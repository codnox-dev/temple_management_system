import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { setAuthToken } from '../api/api';

type AuthUser = { _id?: string; username: string; role_id?: number; role?: string } | null;
type AuthContextType = {
  user: AuthUser;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
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
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const me = await api.get('/admin/me');
          const data = (me as any)?.data ?? me;
          setIsAuthenticated(true);
          setUser({ username: data?.username, role_id: data?.role_id, role: data?.role, _id: data?._id });
        } catch (e) {
          // Token invalid; clean up
          setAuthToken(null);
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    void init();
  }, []);

  const login = async (username, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const response = await api.post(
        '/admin/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      const token = (response as any)?.access_token ?? (response as any)?.data?.access_token; // support wrapper vs raw
      if (token) {
        setAuthToken(token);
        // load real user
        try {
          const me = await api.get('/admin/me');
          const data = (me as any)?.data ?? me;
          setIsAuthenticated(true);
          setUser({ username: data?.username, role_id: data?.role_id, role: data?.role, _id: data?._id });
          // role-based landing
          const rid = Number(data?.role_id ?? 99);
          if (rid === 3) {
            navigate('/admin/events');
          } else if (rid === 4) {
            navigate('/admin/bookings');
          } else {
            navigate('/admin');
          }
        } catch (e) {
          setIsAuthenticated(true);
          setUser({ username });
          navigate('/admin');
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  const authContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
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

