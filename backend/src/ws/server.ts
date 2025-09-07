import { WebSocketServer, WebSocket } from "ws";
import { generateRoom } from "../lib/generate";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { UserJWTPayload, AuthenticatedWebSocket } from "../types";
const prisma = new PrismaClient();

export const port = Number(process.env.WS_PORT) || 8081;
const wss = new WebSocketServer({ port });

let rooms: Map<string, Set<AuthenticatedWebSocket>> = new Map();

/**
 * Verifies the JWT token and returns the payload, or null if verification fails.
 * This is safer than throwing an error for invalid tokens.
 */
function verifyUser(token: string): UserJWTPayload | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserJWTPayload;
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

// TODO: Add redis for in memory data storage.
// TODO: Add pagination for messages.
wss.on("connection", (ws: AuthenticatedWebSocket) => {

    ws.on("message", async (data) => {
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(data.toString());
        } catch (error) {
            ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid JSON format." } }));
            return;
        }

        const { type, payload } = parsedMessage;

        switch (type) {
            case "create":
                try {
                    const token = payload?.token;
                    if (!token) {
                        ws.send(JSON.stringify({ type: "error", payload: { message: "Authentication token is missing." } }));
                        return;
                    }
                    const authenticatedUser = verifyUser(token);
                    if (!authenticatedUser) {
                        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid or expired token." } }));
                        return;
                    }
                    ws.user = authenticatedUser;
                    
                    const userId = ws.user!.userId;
                    const generatedRoomId = generateRoom();
                    
                    // Optimistic Update: Respond to the client immediately.
                    rooms.set(generatedRoomId, new Set([ws]));
                    ws.send(JSON.stringify({ type: "room_created", payload: { roomId: generatedRoomId } }));

                    // Perform the database operation in the background.
                    (async () => {
                        try {
                            await prisma.room.create({
                                data: {
                                    id: generatedRoomId,
                                    name: generatedRoomId,
                                    users: { connect: { id: userId } }
                                }
                            });
                        } catch (dbError) {
                            console.error("Failed to create room in database:", dbError);
                        }
                    })();

                } catch (error) {
                    console.error("Room creation failed:", error);
                    ws.send(JSON.stringify({ type: "error", payload: { message: "Failed to create room." } }));
                }
                break;

            case "join":
                try {
                    const token = payload?.token;
                    if (!token) {
                        ws.send(JSON.stringify({ type: "error", payload: { message: "Authentication token is missing." } }));
                        return;
                    }
                    const authenticatedUser = verifyUser(token);
                    if (!authenticatedUser) {
                        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid or expired token." } }));
                        return;
                    }
                    ws.user = authenticatedUser;

                    const userId = ws.user!.userId;
                    const roomId = payload.roomId;

                    // Optimistic Update: Add user to the in-memory room and confirm with the client.
                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, new Set());
                    }
                    rooms.get(roomId)?.add(ws);
                    ws.send(JSON.stringify({ type: "room_joined", payload: { roomId: roomId } }));
                    
                    // In the background, update the database and fetch/send history.
                    (async () => {
                        try {
                            await prisma.room.update({
                                where: { id: roomId },
                                data: { users: { connect: { id: userId } } }
                            });

                            const existingMessages = await prisma.message.findMany({
                                where: { roomId: roomId },
                                include: { author: { select: { id: true, email: true, username: true } } },
                                orderBy: { createdAt: 'asc' }
                            });
                            
                            for (const message of existingMessages) {
                                ws.send(JSON.stringify({ type: "SERVER:NEW_MESSAGE", payload: { message } }));
                            }
                        } catch(dbError) {
                            console.error("Failed to update DB or fetch history for join:", dbError);
                            // Optionally send an error to the client here if the background task fails.
                        }
                    })();

                } catch (error) {
                    console.error("Failed to join room:", error);
                    ws.send(JSON.stringify({ type: "error", payload: { message: "Failed to join room." } }));
                }
                break;

            case "chat":
                if (!ws.user) {
                    ws.send(JSON.stringify({ type: "error", payload: { message: "You must join a room first to chat." } }));
                    return;
                }
                try {
                    const userId = ws.user.userId;
                    const { roomId, content } = payload;
                    
                    const room = await prisma.room.findFirst({
                        where: {
                            id: roomId,
                            users: { some: { id: userId } }
                        }
                    });

                    if (!room) {
                        ws.send(JSON.stringify({ type: "error", payload: { message: "You are not a member of this room or the room does not exist." } }));
                        return;
                    }

                    // Optimistic Update: Construct the message object and broadcast to the room immediately.
                    const tempMessage = {
                        id: `temp_${new Date().getTime()}`, // A temporary ID for the client
                        message: content,
                        roomId: roomId,
                        userId: userId,
                        createdAt: new Date(),
                        author: {
                            id: ws.user.userId,
                            email: ws.user.email,
                            username: ws.user.username
                        }
                    };

                    const roomSockets = rooms.get(roomId);
                    if (roomSockets) {
                        for (const client of roomSockets) {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: "SERVER:NEW_MESSAGE",
                                    payload: { message: tempMessage }
                                }));
                            }
                        }
                    }

                    // Perform the database operation in the background.
                    await prisma.message.create({
                        data: {
                            message: content, 
                            roomId: roomId,
                            userId: userId
                        }
                    });

                } catch (error) {
                    console.error("Failed to process chat message:", error);
                    ws.send(JSON.stringify({ type: "error", payload: { message: "Failed to send message." } }));
                }
                break;
        }
    });

    ws.on('close', () => {
        rooms.forEach((clients, roomId) => {
            if (clients.has(ws)) {
                clients.delete(ws);
                if (clients.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});

console.log(`WebSocket server started on port ${port}`);