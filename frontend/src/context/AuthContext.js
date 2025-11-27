import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user info + token exist in storage (persisted session)
    const currentUser = authService.getCurrentUser();
    const token = authService.getToken();

    if (currentUser && token) {
      setUser(currentUser);
    } else {
      authService.logout();
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authService.login({ username, password });
      const loggedInUser = data.user;
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (error) {
      const message = error.detail || error.error || 'Invalid username or password';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.detail || 'Registration failed' };
    }
  };

  const logout = (role) => {
    authService.logout();
    setUser(null);
    if (role === 'admin') {
      window.location.href = '/adminlogin';
    } else if (role === 'staff') {
      window.location.href = '/stafflogin';
    } else {
      window.location.href = '/login';
    }
  };

  // On reload, try to restore user from token if no localStorage user
  useEffect(() => {
    if (user) return; // already restored
    const token = authService.getToken && authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        setUser(null);
      }
    }
  }, [user]);

  React.useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleForcedLogout);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handleForcedLogout);
      }
    };
  }, []);

  const role = user?.role;
  const isAdmin = !!(user?.is_superuser || role === 'admin');
  const isStaff = !!(!isAdmin && (user?.is_staff || role === 'staff'));
  const isRegularUser = !!user && !isAdmin && !isStaff;

  const value = {
    user,
    login,
    logout,
    register,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isStaff,
    isUser: isRegularUser,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthContext;
