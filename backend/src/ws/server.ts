import { WebSocketServer, WebSocket } from "ws";
import { generateRoom } from "../lib/generate";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { UserJWTPayload } from "../types";

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
    user?: UserJWTPayload;
}

function verifyUser(token: string): UserJWTPayload {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserJWTPayload;
    return decoded;
}

const wss = new WebSocketServer({ port: 8080 });

let rooms: Map<string, Set<AuthenticatedWebSocket>> = new Map();

wss.on("connection", (ws: AuthenticatedWebSocket) => {
    ws.send("Hello from WebSocket server");

    ws.on("message", async (data) => {
        const parsedMessage = JSON.parse(data.toString());

        if (parsedMessage.type === "create") {
            try {
                const token = parsedMessage.payload.token;
                if (!token) {
                    ws.send(JSON.stringify({ type: "error", payload: { message: "Authentication token is missing." }}));
                    return;
                }
                const authenticatedUser = verifyUser(token);
                ws.user = authenticatedUser;
                const userId = authenticatedUser.userId;

                const generatedRoomId = generateRoom();
                const room = await prisma.room.create({
                    data: {
                        id: generatedRoomId,
                        name: generatedRoomId,
                        users: {
                            connect: {
                                id: userId 
                            }
                        }
                    }
                });
                
                rooms.set(generatedRoomId, new Set([ws]));
                // console.log(`User ${userId} created and joined room ${generatedRoomId}`);
                
                ws.send(JSON.stringify({ type: "room_created", payload: { roomId: generatedRoomId }}));

            } catch (error) {
                console.error("Authentication or room creation failed:", error);
                ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid token or failed to create room." }}));
            }
        }

        if (parsedMessage.type === "join") {
            const token = parsedMessage.payload.token;
            if (!token) {
                ws.send(JSON.stringify({ type: "error", payload: { message: "Authentication token is missing." }}));
                return;
            }
            const authenticatedUser = verifyUser(token);
            ws.user = authenticatedUser; 
            const userId = authenticatedUser.userId;

            const roomId = parsedMessage.payload.roomId;
            const room = await prisma.room.update({
                where: {
                    id: roomId
                },
                data: {
                    users: {
                        connect: {
                            id: userId
                        }
                    }
                }
            });

            rooms.set(roomId, new Set([ws]));
            ws.send(JSON.stringify({ type: "room_joined", payload: { roomId: roomId }}));            
        }


        if (parsedMessage.type === "chat") {
            if (!ws.user) {
                ws.send(JSON.stringify({ type: "error", payload: { message: "You must join a room first to chat." }}));
                return;
            }

            const userId = ws.user.userId;
            const { roomId, content } = parsedMessage.payload;

            if (!roomId || !content) {
                ws.send(JSON.stringify({ type: "error", payload: { message: "Message content and roomId are required." }}));
                return;
            }

            try {
                // 1. Save the message to the database first (best practice)
                const newMessage = await prisma.message.create({
                    data: {
                        content: content,
                        roomId: roomId,
                        userId: userId // Use the trusted ID
                    },
                    include: {
                        author: { // Include author details to broadcast
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    }
                });

                // 2. Find all connected users in that room
                const roomSockets = rooms.get(roomId);

                if (roomSockets) {
                    // 3. Broadcast the new message to everyone in the room
                    for (const client of roomSockets) {
                        client.send(JSON.stringify({
                            type: "SERVER:NEW_MESSAGE",
                            payload: { message: newMessage }
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to process chat message:", error);
                ws.send(JSON.stringify({ type: "error", payload: { message: "Failed to send message." }}));
            }
        }
    });
});

console.log("WebSocket server started on port 8080");