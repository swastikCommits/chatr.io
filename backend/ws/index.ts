import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const wss = new WebSocketServer({ port: 8081 });

let rooms: Map<string, Set<WebSocket>> = new Map();
let clientRooms: Map<WebSocket, string> = new Map();
let clientUserIds: Map<WebSocket, string> = new Map();

wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
        const data = JSON.parse(message.toString());
        
        if(data.type === "join"){
            if (!data.token) {
                ws.send(JSON.stringify({ type: "error", message: "Authentication token required" }));
                return ws.close();
            }

            try {
                const payload = jwt.verify(data.token, process.env.JWT_SECRET as string) as { userId: string };
                clientUserIds.set(ws, payload.userId);
            } catch (error) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid token" }));
                return ws.close();
            }

            let room = rooms.get(data.roomId);
            if(!room){
                room = new Set();
                rooms.set(data.roomId, room);
            }
            room.add(ws);
            clientRooms.set(ws, data.roomId);

            const roomInDb = await prisma.room.upsert({
                where: { name: data.roomId },
                update: {},
                create: { name: data.roomId },
            });

            console.log(`Client joined room: ${data.roomId}`);

            ws.send(JSON.stringify({
                type: "join_success",
                message: `You are now in room ${data.roomId}`,
                roomId: data.roomId
            }));
            room.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "user_joined",
                        message: `A new user has joined the room.`,
                        userCount: room.size
                    }));
                }
            });
        }



        if (data.type === "chat" && data.message) {
            const roomId = clientRooms.get(ws);
            const userId = clientUserIds.get(ws);
            if (!roomId || !userId) {
                return;
            }

            const room = rooms.get(roomId);
            if (!room) {
                return;
            }

            const roomInDb = await prisma.room.findUnique({ where: { name: roomId } });
            if (roomInDb) {
                await prisma.message.create({
                    data: {
                        content: data.message,
                        roomId: roomInDb.id,
                        userId: userId,
                    },
                });
            }

            room.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "chat_message",
                        message: data.message,
                        sender: client === ws ? "me" : "other"
                    }));
                }
            });
        }
    });

    ws.on("close", () => {
        // Step 1: Find which room the disconnected client was in.
        const roomId = clientRooms.get(ws);
        if (!roomId) {
            console.log("Client disconnected (was not in a room).");
            return;
        }

        // Step 2: Get the room's client list from the 'rooms' Map.
        const room = rooms.get(roomId);
        if (!room) {
            // This should not happen if our data is consistent, but it's good practice to check.
            return;
        }

        // Step 3: Remove the client from the room's Set of clients.
        room.delete(ws);
        // Step 4: Remove the client's own lookup entry.
        clientRooms.delete(ws);
        clientUserIds.delete(ws);

        console.log(`Client left room: ${roomId}`);

        // Step 5: (Optional but recommended) If the room is now empty, delete the room itself.
        if (room.size === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} is now empty and has been deleted.`);
        } else {
            // Step 6: Notify the remaining clients in the room that someone has left.
            room.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "user_left",
                        message: `A user has left the room.`,
                        userCount: room.size
                    }));
                }
            });
        }
    });
});
