import React from 'react';
import { Box, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { login } = useAuth();
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
    
    try {
      const result = await login(values.username.trim(), values.password);

      if (!result.success) {
        setError(result.error || 'Invalid username or password');
        return;
      }

      const loggedInUser = result.user;
      const role = loggedInUser.role;

      // Redirect based on role and Django flags
      if (loggedInUser.is_superuser || role === 'admin') {
        navigate('/admin-dashboard');
      } else if (loggedInUser.is_staff || role === 'staff') {
        navigate('/staff-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.error || err.detail || 'Invalid username or password');
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
