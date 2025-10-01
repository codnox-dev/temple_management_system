import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { enhancedJwtAuth } from '../lib/enhancedJwtAuth';

type AuthUser = { _id?: string; username: string; role_id?: number; role?: string } | null;
type AuthContextType = {
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  sendOTP: (mobileNumber: string) => Promise<{ message: string; mobile_number: string; expires_in: number }>;
  verifyOTP: (mobileNumber: string, otp: string) => Promise<boolean>;
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
        // Initialize enhanced security features
        await enhancedJwtAuth.initializeSecurityFeatures();
        
        // Check if user is already authenticated
        if (enhancedJwtAuth.isAuthenticated()) {
          const currentUser = await enhancedJwtAuth.getCurrentUser();
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
          await enhancedJwtAuth.getInitialToken();
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
    console.error('Google login disabled');
    return false;
  };

  const sendOTP = async (mobileNumber: string) => {
    return await enhancedJwtAuth.sendOTP(mobileNumber);
  };

  const verifyOTP = async (mobileNumber: string, otp: string) => {
    try {
      const success = await enhancedJwtAuth.verifyOTP(mobileNumber, otp);
      if (success) {
        const currentUser = await enhancedJwtAuth.getCurrentUser();
        if (currentUser) {
          finishLoginWithUser(currentUser);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('OTP verification failed:', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await enhancedJwtAuth.logout();
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
    sendOTP,
    verifyOTP,
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

