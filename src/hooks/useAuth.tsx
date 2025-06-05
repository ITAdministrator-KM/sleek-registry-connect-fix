
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'public';
  status: string;
}

export const useAuth = (requiredRole?: string) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');
      const userDataStr = localStorage.getItem('userData');

      if (!token || !userRole || !userDataStr) {
        console.log('Missing auth data, redirecting to login');
        navigate('/login');
        return;
      }

      try {
        const userData = JSON.parse(userDataStr);
        
        // Check if user has required role
        if (requiredRole && userRole !== requiredRole) {
          console.log(`User role ${userRole} doesn't match required role ${requiredRole}`);
          navigate('/login');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
        navigate('/login');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate, requiredRole]);

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  return { user, loading, logout };
};
