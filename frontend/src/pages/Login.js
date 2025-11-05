import React from 'react';
import { Box, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    
    console.log('Login attempt with:', { username: values.username });
    
    try {
      const result = await login({ 
        username: values.username.trim(), 
        password: values.password 
      });
      
      console.log('Login successful:', result);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      const errorData = err.response?.data;
      
      // Check for inactive account error
      if (detail && (detail.toLowerCase().includes('not approved') || detail.toLowerCase().includes('account_inactive'))) {
        setError('Account not approved by admin yet. Please wait for admin approval before logging in.');
      } else if (status === 401) {
        if (detail && detail.toLowerCase().includes('verify')) {
          setError('Your account is not verified. Please verify your email before logging in.');
        } else if (detail && (detail.toLowerCase().includes('credentials') || detail.toLowerCase().includes('unable to log in'))) {
          setError('Invalid username or password. Please try again.');
        } else {
          setError(detail || 'Login failed. Please check your credentials and try again.');
        }
      } else if (status === 400) {
        // Check if it's an inactive account error in 400 response
        if (detail && (detail.toLowerCase().includes('not approved') || detail.toLowerCase().includes('inactive'))) {
          setError('Account not approved by admin yet. Please wait for admin approval before logging in.');
        } else {
          const errorMsg = errorData?.username?.[0] || errorData?.password?.[0] || detail || 'Invalid login request.';
          setError(errorMsg);
        }
      } else if (err.message === 'Network Error') {
        setError('Cannot connect to server. Please check your connection and ensure the backend is running.');
      } else {
        setError(detail || err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto" mt={6}>
      <Typography variant="h4" gutterBottom>Login</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextField 
          fullWidth 
          label="Username" 
          {...register('username')} 
          error={!!errors.username} 
          helperText={errors.username?.message} 
          margin="normal"
          disabled={loading}
        />
        <TextField 
          fullWidth 
          label="Password" 
          type="password" 
          {...register('password')} 
          error={!!errors.password} 
          helperText={errors.password?.message} 
          margin="normal"
          disabled={loading}
        />
        <Box mt={2}>
          <Button type="submit" disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
