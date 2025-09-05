import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Users, Zap, UserPlus, Plus } from 'lucide-react';

const Home = () => {
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    
    setIsCreating(true);
    
    // Simulate room creation
    setTimeout(() => {
      const roomId = generateRoomId();
      navigate(`/room/${roomId}`);
    }, 1000);
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) return;
    
    setIsJoining(true);
    
    // Simulate room joining
    setTimeout(() => {
      navigate(`/room/${roomId.trim()}`);
    }, 500);
  };

  return (
    <div className="flex-1 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          {/* <div className="flex justify-center">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary-foreground" />
            </div>
          </div> */}
          <h1 className="text-3xl font-bold text-foreground">Chat Rooms</h1>
          <p className="text-muted-foreground">Create a room and start chatting with your team</p>
        </div>

        {/* Features */}
        {/* <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center mx-auto">
              <Users className="h-5 w-5 text-secondary-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Team Chat</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center mx-auto">
              <Zap className="h-5 w-5 text-secondary-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Real-time</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center mx-auto">
              <MessageCircle className="h-5 w-5 text-secondary-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Instant</p>
          </div>
        </div> */}

        {/* Room Actions */}
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Join Room
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create">
            <Card className="bg-card border-border">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-card-foreground">Create a Room</CardTitle>
                <CardDescription>
                  Give your room a name and start collaborating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName" className="text-card-foreground">Room Name</Label>
                  <Input
                    id="roomName"
                    type="text"
                    placeholder="Enter room name..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                    className="bg-input border-border"
                    disabled={isCreating}
                  />
                </div>
                <Button 
                  onClick={handleCreateRoom}
                  disabled={!roomName.trim() || isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Creating Room...' : 'Create Room'}
                </Button>
              </CardContent>
            </Card>
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">
                Room ID will be auto-generated for easy sharing
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="join">
            <Card className="bg-card border-border">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-card-foreground">Join a Room</CardTitle>
                <CardDescription>
                  Enter the room ID to join an existing conversation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomId" className="text-card-foreground">Room ID</Label>
                  <Input
                    id="roomId"
                    type="text"
                    placeholder="Enter room ID..."
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    className="bg-input border-border"
                    disabled={isJoining}
                  />
                </div>
                <Button 
                  onClick={handleJoinRoom}
                  disabled={!roomId.trim() || isJoining}
                  className="w-full"
                >
                  {isJoining ? 'Joining Room...' : 'Join Room'}
                </Button>
              </CardContent>
            </Card>
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground">
                Ask the room creator for the room ID
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Home;