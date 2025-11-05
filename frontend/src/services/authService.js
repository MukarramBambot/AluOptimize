import api from './api';
import Cookies from 'js-cookie';

const authService = {
  login: async (credentials) => {
    const resp = await api.post('/token/', credentials);
    // expected: { access, refresh }
    const accessToken = resp.data.access;
    const refreshToken = resp.data.refresh;
    
    // Store in both cookies and localStorage for compatibility
    Cookies.set('access_token', accessToken, { expires: 1 });
    Cookies.set('refresh_token', refreshToken, { expires: 7 });
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return resp.data;
  },
  refresh: async () => {
    const refresh = Cookies.get('refresh_token') || localStorage.getItem('refreshToken');
    if (!refresh) throw new Error('No refresh token');
    const resp = await api.post('/token/refresh/', { refresh });
    const newAccessToken = resp.data.access;
    
    Cookies.set('access_token', newAccessToken, { expires: 1 });
    localStorage.setItem('accessToken', newAccessToken);
    
    if (resp.data.refresh) {
      Cookies.set('refresh_token', resp.data.refresh, { expires: 7 });
      localStorage.setItem('refreshToken', resp.data.refresh);
    }
    
    return resp.data;
  },
  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

export default authService;
