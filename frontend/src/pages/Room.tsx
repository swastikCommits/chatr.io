
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatSidebarAnimated } from '@/components/ChatSidebarAnimated';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';

// Define the structure of a message
interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    email: string;
  };
  roomId: string;
  createdAt: string;
}

// Define the structure for a message received from the server
interface ServerMessage {
  type: "SERVER:NEW_MESSAGE";
  payload: {
    message: Message;
  };
}

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hardcoded current user ID for demonstration
  // In a real app, this would come from an authentication context
  const currentUserId = "your_current_user_id"; 

  // Effect to establish WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8081');

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      // Join the room upon connection
      ws.current?.send(JSON.stringify({
        type: "join",
        payload: {
          roomId: roomId
        }
      }));
    };

    ws.current.onmessage = (event) => {
      const received = JSON.parse(event.data) as ServerMessage;

      if (received.type === "SERVER:NEW_MESSAGE") {
        setMessages((prevMessages) => [...prevMessages, received.payload.message]);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup on component unmount
    return () => {
      ws.current?.close();
    };
  }, [roomId]);

  // Effect to scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to handle sending a message
  const handleSendMessage = (content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "chat",
        payload: {
          roomId: roomId,
          content: content,
        },
      }));
    }
  };

  return (
    <div className="h-screen flex bg-background w-full">
      <ChatSidebarAnimated />
      
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-border bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-foreground">Room Chat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Room ID: {roomId}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={{
                id: msg.id,
                text: msg.content,
                sender: msg.author.email,
                timestamp: new Date(msg.createdAt).toLocaleTimeString(),
                isOwn: msg.author.id === currentUserId,
              }}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Room;
