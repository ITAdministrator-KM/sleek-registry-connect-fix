
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { User, Lock, UserCheck } from 'lucide-react';
import { apiService } from '@/services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    if (!role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with:', { username, role });
      
      const response = await apiService.login({
        username,
        password,
        role
      });

      console.log('Login response:', response);

      // Handle different response formats from backend
      let userData, authToken;
      
      if (response.user && response.token) {
        userData = response.user;
        authToken = response.token;
      } else if (response.data && response.data.user && response.data.token) {
        userData = response.data.user;
        authToken = response.data.token;
      } else {
        throw new Error('Invalid response format from server');
      }

      if (userData && authToken) {
        // Store authentication data
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', userData.id.toString());
        localStorage.setItem('userFullName', userData.name);
        localStorage.setItem('userDepartmentId', userData.department_id?.toString() || '');
        localStorage.setItem('userDivisionId', userData.division_id?.toString() || '');
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${userData.name}!`,
        });

        // Redirect based on role
        switch (userData.role) {
          case 'admin':
            navigate('/admin-dashboard');
            break;
          case 'staff':
            navigate('/staff-dashboard');
            break;
          case 'public':
            navigate('/public-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        throw new Error('Invalid credentials or server error');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials or server error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            <form onSubmit={handleLogin} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor="login-role" className="text-gray-700 font-medium">
                  Select Role <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <Select 
                  value={role} 
                  onValueChange={setRole}
                  name="role"
                  required
                  aria-required="true"
                  aria-describedby={errors.role ? "role-error" : "role-help"}
                  aria-invalid={!!errors.role}
                >
                  <SelectTrigger 
                    id="login-role"
                    className="bg-white/50 border-gray-200 focus:border-blue-500 h-12"
                  >
                    <div className="flex items-center space-x-2">
                      <UserCheck size={20} className="text-gray-500" aria-hidden="true" />
                      <SelectValue placeholder="Choose your role" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="staff">Staff Member</SelectItem>
                    <SelectItem value="public">Public User</SelectItem>
                  </SelectContent>
                </Select>
                <small id="role-help" className="text-sm text-gray-500">
                  Select your account type to continue
                </small>
                {errors.role && (
                  <div id="role-error" className="text-sm text-red-600" role="alert">
                    {errors.role}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-gray-700 font-medium">
                  Username <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <div className="relative">
                  <User 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    size={20} 
                    aria-hidden="true"
                  />
                  <Input
                    id="login-username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) {
                        setErrors(prev => ({ ...prev, username: '' }));
                      }
                    }}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 h-12"
                    placeholder="Enter your username"
                    required
                    aria-required="true"
                    aria-describedby={errors.username ? "username-error" : "username-help"}
                    aria-invalid={!!errors.username}
                    autoComplete="username"
                  />
                </div>
                <small id="username-help" className="text-sm text-gray-500">
                  Enter the username provided by your administrator
                </small>
                {errors.username && (
                  <div id="username-error" className="text-sm text-red-600" role="alert">
                    {errors.username}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-gray-700 font-medium">
                  Password <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <div className="relative">
                  <Lock 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                    size={20} 
                    aria-hidden="true"
                  />
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 h-12"
                    placeholder="Enter your password"
                    required
                    aria-required="true"
                    aria-describedby={errors.password ? "password-error" : "password-help"}
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                  />
                </div>
                <small id="password-help" className="text-sm text-gray-500">
                  Enter your secure password
                </small>
                {errors.password && (
                  <div id="password-error" className="text-sm text-red-600" role="alert">
                    {errors.password}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
                aria-describedby="submit-help"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <small id="submit-help" className="sr-only">
                Click to sign in with your credentials
              </small>
            </form>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Test with Staff Credentials:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Username:</strong> Ansar</p>
                <p><strong>Password:</strong> password</p>
                <p><strong>Role:</strong> Staff Member</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">Other test users: admin/password (admin), fatima/password (staff), ahmed/password (staff)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700"
            aria-label="Go back to home page"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
