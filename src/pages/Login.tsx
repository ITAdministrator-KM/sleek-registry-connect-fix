
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import LoginForm from '@/components/LoginForm';
import { authService } from '@/services/authService';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = (username: string, password: string, role: string) => {
    const newErrors: {[key: string]: string} = {};
    
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    if (!role) newErrors.role = 'Please select a role';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (username: string, password: string, role: string) => {
    if (!validateForm(username, password, role)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      // Clear any existing auth data first
      console.log('Login: Clearing existing auth data');
      ['authToken', 'token', 'userRole', 'username', 'userData', 'userId', 'userFullName'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Call the login API
      console.log('Login: Calling authService.login()');
      const response = await authService.login({
        username: username.trim(),
        password: password,
        role: role,
      });

      console.log('Login: Received response from authService:', response);
      
      // Extract auth token and user data from the response
      const authToken = response.token || (response.data?.token ? response.data.token : null);
      const userData = response.user || (response.data?.user ? response.data.user : {});
      
      if (!authToken) {
        console.error('Login: No auth token received in response');
        throw new Error('Authentication failed: No token received');
      }

      if (!response.success) {
        throw new Error(response.message || 'Login failed. Please try again.');
      }

      const userRole = (userData.role || role).toLowerCase();
      
      // Store auth data
      console.log('Login: Storing new auth data');
      
      // Store token with both 'authToken' and 'token' keys for compatibility
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('token', authToken); // For backward compatibility
      
      // Store user data
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Store additional user info for easy access
      if (userData.id) {
        localStorage.setItem('userId', userData.id.toString());
      }
      if (userData.name) {
        localStorage.setItem('userFullName', userData.name);
      }
      if (userData.username) {
        localStorage.setItem('username', userData.username);
      }
      
      console.log('Login: Auth data stored successfully');
      console.log('User role:', userRole);
      console.log('User data:', userData);
      
      console.log('Login: User data stored, redirecting...');
      
      // Determine the redirect path based on role
      let redirectPath = '/login';
      
      switch(userRole) {
        case 'admin':
        case 'staff':
          redirectPath = '/dashboard';
          break;
        case 'public':
          redirectPath = '/public/dashboard';
          break;
        default:
          console.warn('Unknown role, redirecting to home');
      }
      
      console.log(`Login: Redirecting to ${redirectPath}`);
      navigate(redirectPath);
    } catch (error) {
      console.error('Login: Error occurred:', error);
      let errorMessage = 'An error occurred during login';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-md shadow-2xl border-0 rounded-xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/lovable-uploads/6e847d33-bb31-4337-86e5-a709077e569d.png" 
                alt="DSK Logo" 
                className="h-20 w-20 rounded-full shadow-lg border-4 border-white"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              DSK Portal
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2 font-medium">
              Divisional Secretariat KALMUNAI
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <LoginForm 
              onSubmit={handleLogin}
              isLoading={isLoading}
              errors={errors}
            />
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
