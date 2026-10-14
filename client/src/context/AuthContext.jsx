import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { getErrorMessage } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('sf_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        const currentUser = res.data.data.user;
        setUser(currentUser);
        localStorage.setItem('sf_user', JSON.stringify(currentUser));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { user: u, token: t } = res.data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('sf_token', t);
    localStorage.setItem('sf_user', JSON.stringify(u));
    return u;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { user: u, token: t } = res.data.data;
    setUser(u);
    setToken(t);
    localStorage.setItem('sf_token', t);
    localStorage.setItem('sf_user', JSON.stringify(u));
    return u;
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
  }, []);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sf_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
