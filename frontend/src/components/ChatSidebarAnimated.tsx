import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { MessageCircle, Users, Settings, Hash } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
}

const mockUsers: User[] = [
  { id: '1', name: 'Alex Johnson', status: 'online' },
  { id: '2', name: 'Sarah Chen', status: 'online' },
  { id: '3', name: 'Mike Rodriguez', status: 'offline' },
  { id: '4', name: 'Emma Davis', status: 'online' },
  { id: '5', name: 'James Wilson', status: 'offline' },
];

export function ChatSidebarAnimated() {
  const links = [
    {
      label: "General",
      href: "/",
      icon: (
        <Hash className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Team Chat",
      href: "/team",
      icon: (
        <MessageCircle className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Users",
      href: "/users",
      icon: (
        <Users className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: (
        <Settings className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  
  const [open, setOpen] = useState(false);
  
  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
          
          {/* Online Users Section */}
          {open && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Online ({mockUsers.filter(u => u.status === 'online').length})
              </h3>
              <div className="space-y-2">
                {mockUsers.filter(u => u.status === 'online').map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-sidebar bg-online-indicator" />
                    </div>
                    <span className="text-sm text-foreground truncate">
                      {user.name}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        
        <div>
          <SidebarLink
            link={{
              label: "Your Profile",
              href: "/profile",
              icon: (
                <Avatar className="w-7 h-7">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    YU
                  </AvatarFallback>
                </Avatar>
              ),
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-foreground whitespace-pre"
      >
        Team Chat
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      to="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-primary rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};