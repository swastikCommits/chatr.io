
import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ChatSidebarAnimated } from '@/components/ChatSidebarAnimated';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Define the structure of a message
interface Message {
  id: string;
  message: string; // Changed from content
  author: {
    id: string;
    email: string;
  };
  roomId: string;
  createdAt: string;
}

// Define the structure for a message received from the server
interface ServerMessage {
  type: "SERVER:NEW_MESSAGE" | "room_joined" | "error";
  payload: {
    roomId?: string;
    message?: Message | string;
  };
}

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current user from authentication context
  const { user } = useAuth();
  const currentUserId = user?.id || ''; 

  // Effect to establish WebSocket connection
  useEffect(() => {
    const connectToRoom = async () => {
      try {
        // Get WebSocket token from the API
        const tokenResponse = await fetch('http://localhost:3000/api/auth/ws-token', {
          credentials: 'include',
        });

        if (!tokenResponse.ok) {
          console.error('Failed to get WebSocket token');
          return;
        }

        const { wsToken } = await tokenResponse.json();

        // Now connect to WebSocket with the token
        ws.current = new WebSocket('ws://localhost:8081');

        ws.current.onopen = () => {
          console.log("WebSocket connected");
          
          // Join the room upon connection with token
          ws.current?.send(JSON.stringify({
            type: "join",
            payload: {
              roomId: roomId,
              token: wsToken
            }
          }));
        };

        ws.current.onmessage = (event) => {
          try {
            const received = JSON.parse(event.data) as ServerMessage;

            if (received.type === "SERVER:NEW_MESSAGE" && received.payload.message) {
              setMessages((prevMessages) => [...prevMessages, received.payload.message as Message]);
            } else if (received.type === "room_joined") {
              console.log("Successfully joined room:", received.payload.roomId);
            } else if (received.type === "error") {
              console.error("WebSocket error:", received.payload.message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', event.data);
            // If it's not JSON, just ignore it (could be a connection message)
          }
        };

        ws.current.onclose = () => {
          console.log("WebSocket disconnected");
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error('Failed to connect to room:', error);
      }
    };

    connectToRoom();

    // Cleanup on component unmount
    return () => {
      ws.current?.close();
    };
  }, [roomId]);

  // Memoize processed messages to avoid recalculating timestamps and initials on every render
  const processedMessages = useMemo(() => {
    return messages.map((msg) => ({
      id: msg.id,
      text: msg.message, // Changed from msg.content
      sender: msg.author.email,
      timestamp: new Date(msg.createdAt).toLocaleTimeString(),
      isOwn: msg.author.id === currentUserId,
      initials: msg.author.email.slice(0, 2).toUpperCase(),
    }));
  }, [messages, currentUserId]);

  // Effect to scroll to the latest message
  useEffect(() => {
    // Use instant scrolling for better performance
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
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
      <ChatSidebarAnimated open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col" onClick={() => { if (sidebarOpen) setSidebarOpen(false); }}>
        {/* Chat Header */}
        <div className="p-6 border-b border-border bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-foreground">Room Chat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Room ID: {roomId}
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {processedMessages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 150 }}
              >
                <ChatMessage
                  message={message}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Room;
