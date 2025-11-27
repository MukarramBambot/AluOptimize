import React from 'react';
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Container
} from '@mui/material';
import Button from '../components/ui/Button';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  });

  React.useEffect(() => {
    // Only redirect if already logged in as admin
    if (user && user.is_superuser) {
      navigate('/admin-dashboard');
    } else if (user && user.is_staff) {
      navigate('/staff-dashboard');
    } else if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.username.trim(), formData.password);

      if (!result.success) {
        setError(result.error || 'Invalid username or password');
        return;
      }

      const loggedInUser = result.user;
      const role = loggedInUser.role;
      
      // Redirect based on user role
      if (loggedInUser.is_superuser || role === 'admin') {
        navigate('/admin-dashboard');
      } else if (loggedInUser.is_staff || role === 'staff') {
        navigate('/staff-dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Admin login error:', err);
      
      // Handle the new error format from authService
      if (err.error) {
        setError(err.error);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check your connection and ensure the backend is running.');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <AdminPanelSettingsIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Admin Login
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Sign in with your administrator credentials
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={loading}
            />
            <Box mt={3}>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In as Admin'}
              </Button>
            </Box>
          </form>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              Not an admin?{' '}
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', p: 0 }}
              >
                User Login
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
