import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtAuth } from '../lib/jwtAuth';

type AuthUser = { _id?: string; username: string; role_id?: number; role?: string } | null;
type AuthContextType = {
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is already authenticated
        if (jwtAuth.isAuthenticated()) {
          const currentUser = await jwtAuth.getCurrentUser();
          if (currentUser) {
            setIsAuthenticated(true);
            setUser({ 
              username: currentUser.sub, 
              role_id: currentUser.role_id, 
              role: currentUser.role, 
              _id: currentUser.user_id 
            });
          }
        } else {
          // Get initial token for app functionality
          await jwtAuth.getInitialToken();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const login = async (username, password) => {
    console.error('Password login disabled');
    return false;
  };

  const finishLoginWithUser = (currentUser: any) => {
    setIsAuthenticated(true);
    setUser({ 
      username: currentUser.sub, 
      role_id: currentUser.role_id, 
      role: currentUser.role, 
      _id: currentUser.user_id 
    });
    const rid = Number(currentUser.role_id ?? 99);
    if (rid === 3) {
      navigate('/admin/events');
    } else if (rid === 4) {
      navigate('/admin/bookings');
    } else {
      navigate('/admin');
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      await jwtAuth.loginWithGoogle(idToken);
      const currentUser = await jwtAuth.getCurrentUser();
      if (currentUser) {
        finishLoginWithUser(currentUser);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Google login failed:', e);
      return false;
    }
  };

  const logout = async () => {
    try {
      await jwtAuth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      navigate('/login');
    }
  };

  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

