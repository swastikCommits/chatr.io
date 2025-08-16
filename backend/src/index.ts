import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let rooms: Map<string, Set<WebSocket>> = new Map();
let clientRooms: Map<WebSocket, string> = new Map();

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        
        if(data.type === "join"){
            let room = rooms.get(data.roomId);
            if(!room){
                room = new Set();
                rooms.set(data.roomId, room);
            }
            room.add(ws);
            clientRooms.set(ws, data.roomId);

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



        if (data.type === "chat") {
            const roomId = clientRooms.get(ws);
            if (!roomId) {
                ws.send(JSON.stringify({type: "error", message: "You are not in a room!"}));
                return;
            }

            const room = rooms.get(roomId);
            if (!room) {
                ws.send(JSON.stringify({type: "error", message: "Room does not exist!"}));
                return;
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
});
