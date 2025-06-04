
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
      const loginData = { username: username.trim(), password, role };
      console.log('Login: Attempting login with:', { username: loginData.username, role: loginData.role });
      
      const response = await authService.login(loginData);
      console.log('Login: Raw response:', JSON.stringify(response, null, 2));

      if (response && response.status === 'success' && response.data) {
        const { user: userData, token: authToken } = response.data;
        
        if (!userData || !authToken) {
          throw new Error('Invalid response: missing user data or token');
        }
        
        console.log('Login: Success, user data:', {
          id: userData.id,
          username: userData.username,
          role: userData.role,
          name: userData.name
        });

        // Store auth data
        localStorage.setItem('userRole', userData.role.toLowerCase());
        localStorage.setItem('username', userData.username);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('userId', userData.id?.toString() || '');
        localStorage.setItem('userFullName', userData.name || '');

        // Store department/division if available
        if (userData.department_id) {
          localStorage.setItem('userDepartmentId', userData.department_id.toString());
          localStorage.setItem('userDepartmentName', userData.department_name || '');
        }
        if (userData.division_id) {
          localStorage.setItem('userDivisionId', userData.division_id.toString());
          localStorage.setItem('userDivisionName', userData.division_name || '');
        }
        
        toast({
          title: "Login Successful",
          description: `Welcome, ${userData.name || username}!`,
        });

        // Navigate based on role
        let targetPath = '/';
        switch (userData.role.toLowerCase()) {
          case 'admin':
            targetPath = '/admin';
            break;
          case 'staff':
            targetPath = '/staff';
            break;
          case 'public':
            targetPath = '/public';
            break;
        }
        
        console.log('Login: Navigating to:', targetPath);
        navigate(targetPath);
      } else {
        throw new Error('Invalid response format - missing success status or data');
      }
    } catch (error) {
      console.error('Login: Error occurred:', error);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials')) {
          errorMessage = "Invalid username or password. Please check your credentials.";
        } else if (error.message.includes('Network error')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error. Please contact support if this persists.";
        } else {
          errorMessage = error.message;
        }
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
