import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let clients: Map<string, WebSocket> = new Map();

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        
        if(data.type === "join"){
            clients.set(data.roomId, ws);
            ws.send(JSON.stringify({type: "join", message: `Connected to room: ${data.roomId}`}));
            
            clients.forEach((clientWs, roomId) => {
                console.log(`roomId: ${roomId}`);
            });
        }
        if (data.type === "chat") {
            const roomIdConnection = clients.get(data.roomId);
            if (roomIdConnection) {
                roomIdConnection.send(JSON.stringify({type: "chat", message: `Dalma, from: ${data.roomId}`}));
            }
        }
    });
});
