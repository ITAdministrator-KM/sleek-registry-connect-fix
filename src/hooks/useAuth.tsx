
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  division_name?: string;
  division_id?: number;
  public_id?: string;
  nic?: string;
  mobile?: string;
  address?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    console.log('AuthProvider: Clearing authentication data');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthProvider: Checking authentication...');
      setLoading(true);
      
      try {
        const token = localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole');
        const userDataStr = localStorage.getItem('userData');

        if (!token || !userRole || !userDataStr) {
          clearAuth();
          return;
        }

        if (typeof token !== 'string' || token.split('.').length !== 3) {
          console.error('AuthProvider: Invalid token format');
          clearAuth();
          return;
        }

        try {
          const userData = JSON.parse(userDataStr);
          
          if (!userData || typeof userData !== 'object' || !userData.id || !userData.role) {
            console.error('AuthProvider: Invalid user data structure');
            clearAuth();
            return;
          }

          setUser(userData);
          console.log('AuthProvider: User authenticated successfully');
        } catch (error) {
          console.error('AuthProvider: Error parsing user data:', error);
          clearAuth();
        }
      } catch (error) {
        console.error('AuthProvider: Unexpected error during authentication check:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [clearAuth]);

  const logout = useCallback(() => {
    console.log('AuthProvider: Logging out user');
    clearAuth();
    navigate('/login', { replace: true });
  }, [clearAuth, navigate]);

  const value = {
    user,
    loading,
    logout,
    isAuthenticated: !!user && !loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (requiredRole?: string | string[]) => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, loading } = context;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    if (requiredRole && user) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowedRoles.includes(user.role)) {
        console.log(`useAuth: User role ${user.role} doesn't match required roles ${allowedRoles.join(', ')}`);
        navigate('/login', { replace: true });
        return;
      }
    }
  }, [user, loading, requiredRole, navigate]);

  return context;
};
