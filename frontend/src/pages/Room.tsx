
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatSidebarAnimated } from '@/components/ChatSidebarAnimated';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  avatar?: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Hey everyone! How\'s the project coming along?',
    sender: 'Alex Johnson',
    timestamp: '10:30 AM',
    isOwn: false,
  },
  {
    id: '2',
    text: 'Great! I just finished the authentication module. Working on the dashboard now.',
    sender: 'You',
    timestamp: '10:32 AM',
    isOwn: true,
  },
  {
    id: '3',
    text: 'Awesome work! The API endpoints are also ready. We should be able to integrate everything by tomorrow.',
    sender: 'Sarah Chen',
    timestamp: '10:35 AM',
    isOwn: false,
  },
  {
    id: '4',
    text: 'Perfect timing! I\'ll prepare the deployment pipeline today.',
    sender: 'You',
    timestamp: '10:36 AM',
    isOwn: true,
  },
];

const Room = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'You',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate someone typing
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate response
      const responses = [
        'That sounds great!',
        'I agree with that approach.',
        'Let me know if you need any help!',
        'Good point, I\'ll look into that.',
        'Thanks for the update!'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'Alex Johnson',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false,
      };
      
      setMessages((prev) => [...prev, responseMessage]);
    }, 2000);
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
        <div className="flex-1 overflow-y-auto chat-scroll bg-background/50">
          <div className="space-y-1 p-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Room;
