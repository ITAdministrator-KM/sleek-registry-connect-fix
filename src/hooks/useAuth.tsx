
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'public';
  status: string;
  department_name?: string;
  department_id?: number;
}

export const useAuth = (requiredRole?: string) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      console.log('useAuth: Checking authentication...');
      
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      const userDataStr = localStorage.getItem('userData');

      console.log('useAuth: Auth data found:', { 
        hasToken: !!token, 
        userRole, 
        hasUserData: !!userDataStr 
      });

      if (!token || !userRole || !userDataStr) {
        console.log('useAuth: Missing auth data, redirecting to login');
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        const userData = JSON.parse(userDataStr);
        console.log('useAuth: Parsed user data:', userData);
        
        // Check if user has required role
        if (requiredRole && userRole !== requiredRole) {
          console.log(`useAuth: User role ${userRole} doesn't match required role ${requiredRole}`);
          setLoading(false);
          navigate('/login');
          return;
        }

        setUser(userData);
        console.log('useAuth: User authenticated successfully');
      } catch (error) {
        console.error('useAuth: Error parsing user data:', error);
        localStorage.clear();
        navigate('/login');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate, requiredRole]);

  const logout = () => {
    console.log('useAuth: Logging out user');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  return { user, loading, logout };
};
