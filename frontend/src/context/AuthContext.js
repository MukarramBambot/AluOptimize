import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import authService from '../services/authService';
import api from '../services/api';

// Role definitions for future expansion
export const USER_ROLES = {
  ADMIN: 'admin',
  RESEARCHER: 'researcher',
  FACTORY_MANAGER: 'factory_manager',
  OPERATOR: 'operator',
  ANALYST: 'analyst'
};

// Permission levels for different features (placeholder for future use)
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_PRODUCTION: 'manage_production',
  VIEW_PREDICTIONS: 'view_predictions',
  MANAGE_WASTE: 'manage_waste',
  VIEW_RECOMMENDATIONS: 'view_recommendations',
  MANAGE_USERS: 'manage_users',
  EXPORT_DATA: 'export_data'
};

// Role-based permission mapping (placeholder - not enforced yet)
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.RESEARCHER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PREDICTIONS,
    PERMISSIONS.VIEW_RECOMMENDATIONS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.FACTORY_MANAGER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_PRODUCTION,
    PERMISSIONS.VIEW_PREDICTIONS,
    PERMISSIONS.MANAGE_WASTE,
    PERMISSIONS.VIEW_RECOMMENDATIONS
  ],
  [USER_ROLES.OPERATOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.MANAGE_PRODUCTION,
    PERMISSIONS.VIEW_PREDICTIONS
  ],
  [USER_ROLES.ANALYST]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_PREDICTIONS,
    PERMISSIONS.VIEW_RECOMMENDATIONS,
    PERMISSIONS.EXPORT_DATA
  ]
};

export const AuthContext = createContext({ 
  user: null, 
  login: () => {}, 
  adminLogin: () => {},
  logout: () => {},
  hasPermission: () => true,
  hasRole: () => false
});

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (token) {
      const decoded = decodeToken(token);
      const userId = decoded ? decoded.user_id || decoded.id : null;
      if (userId) {
        api
          .get(`/auth/users/${userId}/`)
          .then((resp) => {
            // Enhance user object with role information
            const userData = {
              ...resp.data,
              role: resp.data.role || null, // Will be null until backend implements roles
              permissions: resp.data.role ? ROLE_PERMISSIONS[resp.data.role] : []
            };
            setUser(userData);
          })
          .catch((err) => {
            // Clear invalid tokens but don't redirect
            console.error('Failed to fetch user data:', err);
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            setUser(null);
          })
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    console.log('AuthContext login called with:', credentials);
    
    try {
      const data = await authService.login(credentials);
      console.log('authService.login returned:', data);
      
      const decoded = decodeToken(data.access);
      console.log('Decoded token:', decoded);
      
      const userId = decoded ? decoded.user_id || decoded.id : null;
      
      if (userId) {
        try {
          const resp = await api.get(`/auth/users/${userId}/`);
          console.log('User data fetched:', resp.data);
          
          // Enhance user object with role information
          const userData = {
            ...resp.data,
            role: resp.data.role || null,
            permissions: resp.data.role ? ROLE_PERMISSIONS[resp.data.role] : []
          };
          setUser(userData);
        } catch (userFetchError) {
          console.error('Failed to fetch user details, but login succeeded:', userFetchError);
          // Set basic user object from token
          // Try to get is_staff and is_superuser from token if available
          setUser({ 
            id: userId, 
            username: credentials.username,
            is_staff: decoded?.is_staff || false,
            is_superuser: decoded?.is_superuser || false,
            is_active: true,
            role: null,
            permissions: []
          });
        }
      } else {
        console.warn('No userId found in token');
        setUser({ 
          username: credentials.username,
          is_staff: decoded?.is_staff || false,
          is_superuser: decoded?.is_superuser || false,
          is_active: true,
          role: null,
          permissions: []
        });
      }
      
      return data;
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      throw error;
    }
  };

  const adminLogin = async (credentials) => {
    console.log('AuthContext adminLogin called with:', credentials);
    
    try {
      const data = await authService.adminLogin(credentials);
      console.log('authService.adminLogin returned:', data);
      
      const decoded = decodeToken(data.access);
      console.log('Decoded token:', decoded);
      
      const userId = decoded ? decoded.user_id || decoded.id : null;
      
      if (userId) {
        try {
          const resp = await api.get(`/auth/users/${userId}/`);
          console.log('Admin user data fetched:', resp.data);
          
          // Enhance user object with role information
          const userData = {
            ...resp.data,
            role: resp.data.role || null,
            permissions: resp.data.role ? ROLE_PERMISSIONS[resp.data.role] : []
          };
          setUser(userData);
        } catch (userFetchError) {
          console.error('Failed to fetch admin user details, but login succeeded:', userFetchError);
          // Set basic user object from token
          setUser({ 
            id: userId, 
            username: credentials.username,
            is_staff: decoded?.is_staff || false,
            is_superuser: decoded?.is_superuser || false,
            is_active: true,
            role: null,
            permissions: []
          });
        }
      } else {
        console.warn('No userId found in token');
        setUser({ 
          username: credentials.username,
          is_staff: decoded?.is_staff || false,
          is_superuser: decoded?.is_superuser || false,
          is_active: true,
          role: null,
          permissions: []
        });
      }
      
      return data;
    } catch (error) {
      console.error('Admin login failed in AuthContext:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Helper function to check if user has a specific permission
  // Currently returns true for all authenticated users (placeholder)
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // If user is admin or staff, grant all permissions
    if (user.is_superuser || user.is_staff) return true;
    
    // If role-based permissions are implemented, check them
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(permission);
    }
    
    // Default: grant permission to all authenticated users (current behavior)
    return true;
  };

  // Helper function to check if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    if (user.is_superuser) return true; // Superuser has all roles
    return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      adminLogin, 
      logout, 
      loading,
      hasPermission,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
