
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  avatar?: string;
  initials?: string;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 p-4 message-hover rounded-lg ${message.isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={message.avatar} />
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
          {message.initials || message.sender.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex flex-col max-w-xs lg:max-w-md ${message.isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {message.sender}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.timestamp}
          </span>
        </div>
        
        <div
          className={`px-4 py-2 rounded-2xl ${
            message.isOwn
              ? 'bg-chat-bubble-user text-white'
              : 'bg-chat-bubble-other text-white'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      </div>
    </div>
  );
};
