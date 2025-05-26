
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { User, Lock, UserCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !role) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      // Demo credentials
      const validCredentials = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'staff', password: 'staff123', role: 'staff' },
        { username: 'public', password: 'public123', role: 'public' }
      ];

      const isValid = validCredentials.some(
        cred => cred.username === username && cred.password === password && cred.role === role
      );

      if (isValid) {
        localStorage.setItem('userRole', role);
        localStorage.setItem('username', username);
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${username}!`,
        });

        // Redirect based on role
        switch (role) {
          case 'admin':
            navigate('/admin-dashboard');
            break;
          case 'staff':
            navigate('/staff-dashboard');
            break;
          case 'public':
            navigate('/public-dashboard');
            break;
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials or role selection",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
                alt="DSK Logo" 
                className="h-20 w-20 rounded-full shadow-lg"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              DSK Login
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Divisional Secretariat KALMUNAI
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700 font-medium">Select Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 h-12">
                    <div className="flex items-center space-x-2">
                      <UserCheck size={20} className="text-gray-500" />
                      <SelectValue placeholder="Choose your role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="public">Public User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 h-12"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 h-12"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Demo Credentials:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>Staff:</strong> staff / staff123</p>
                <p><strong>Public:</strong> public / public123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
