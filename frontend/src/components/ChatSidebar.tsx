
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
}

const mockUsers: User[] = [
  // { id: '1', name: 'Alex Johnson', status: 'online' },
  // { id: '2', name: 'Sarah Chen', status: 'online' },
  // { id: '3', name: 'Mike Rodriguez', status: 'offline' },
  // { id: '4', name: 'Emma Davis', status: 'online' },
  // { id: '5', name: 'James Wilson', status: 'offline' },
];

export const ChatSidebar = () => {
  return (
    <div className="w-80 bg-sidebar-bg border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Team Chat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mockUsers.filter(u => u.status === 'online').length} online
        </p>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto chat-scroll p-4">
        <div className="space-y-2">
          {mockUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg user-hover cursor-pointer"
            >
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-sidebar-bg ${
                    user.status === 'online' ? 'bg-online' : 'bg-offline'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.status === 'online' ? 'Active now' : 'Last seen 2h ago'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
