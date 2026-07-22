import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch {
          setAccessToken(null);
          setUser(null);
        }
      } else {
        // Try transparent refresh on mount
        try {
          const res = await api.post('/api/auth/refresh');
          setAccessToken(res.data.accessToken);
          setUser(res.data.user);
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore
    } finally {
      setAccessToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (...roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
