import api from './api';

const authService = {
  login: async (credentials) => {
    try {
      const resp = await api.post('/auth/token/', credentials);
      // expected: { access, refresh, user }
      const { access, refresh, user } = resp.data;
      
      // Store in localStorage
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      return resp.data;
    } catch (error) {
      throw error.response?.data || { detail: 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const resp = await api.post('/auth/register/', userData);
      return resp.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData) {
        // Handle field-specific errors
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          throw { detail: Array.isArray(firstError) ? firstError[0] : firstError };
        }
        throw errorData;
      }
      throw { detail: 'Registration failed' };
    }
  },
  
  refresh: async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) throw new Error('No refresh token');
    
    try {
      const resp = await api.post('/auth/token/refresh/', { refresh });
      const newAccessToken = resp.data.access;
      
      localStorage.setItem('accessToken', newAccessToken);
      
      if (resp.data.refresh) {
        localStorage.setItem('refreshToken', resp.data.refresh);
      }
      
      return resp.data;
    } catch (error) {
      // Clear tokens if refresh fails
      authService.logout();
      throw error.response?.data || { detail: 'Token refresh failed' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'));
    }
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  getToken: () => {
    return localStorage.getItem('accessToken');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  }
};

export default authService;
