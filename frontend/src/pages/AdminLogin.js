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
import { AuthContext } from '../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, user } = React.useContext(AuthContext);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  });

  React.useEffect(() => {
    // If already logged in as staff, redirect to admin dashboard
    if (user && (user.is_staff || user.is_superuser)) {
      navigate('/admin-dashboard');
    } else if (user) {
      // Logged in but not staff
      setError('You do not have admin privileges. Please contact an administrator.');
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
      // Pass credentials as object
      const credentials = {
        username: formData.username.trim(),
        password: formData.password
      };
      
      await login(credentials);
      
      // After login, user context will be updated
      // Check will happen in useEffect
      console.log('Admin login successful');
      
    } catch (err) {
      console.error('Admin login error:', err);
      
      // Handle network errors
      if (!err.response) {
        setError('Cannot connect to server. Please ensure the backend is running.');
        setLoading(false);
        return;
      }
      
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      
      // Handle specific error cases
      if (status === 400) {
        setError('Invalid username or password.');
      } else if (status === 401) {
        setError('Invalid username or password.');
      } else if (detail && (detail.toLowerCase().includes('not approved') || detail.toLowerCase().includes('account_inactive'))) {
        setError('Account not approved by admin yet.');
      } else if (detail && (detail.toLowerCase().includes('credentials') || detail.toLowerCase().includes('unable to log in'))) {
        setError('Invalid username or password.');
      } else {
        setError(detail || err.message || 'Login failed. Please try again.');
      }
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
