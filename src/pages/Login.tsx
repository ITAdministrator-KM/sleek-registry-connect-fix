
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import LoginForm from '@/components/LoginForm';
import { apiService } from '@/services/api';

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

    try {
      console.log('Attempting login with:', { username, role });
      
      const response = await apiService.login({ username, password, role });
      console.log('Login response:', response);

      // Handle different response formats more flexibly
      let userData, authToken;

      if (response && response.data) {
        userData = response.data.user || response.data;
        authToken = response.data.token;
      } else if (response && response.user) {
        userData = response.user;
        authToken = response.token;
      }

      if (userData && authToken) {
        // Store all necessary authentication data
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', userData.id?.toString() || '');
        localStorage.setItem('userFullName', userData.name || '');
        
        // Store additional user data for dashboard use
        if (userData.department_id) {
          localStorage.setItem('userDepartmentId', userData.department_id.toString());
        }
        if (userData.division_id) {
          localStorage.setItem('userDivisionId', userData.division_id.toString());
        }
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${userData.name || username}!`,
        });

        // Navigate based on role
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
        throw new Error('Invalid response format - missing user data or token');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : "Invalid credentials";
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
