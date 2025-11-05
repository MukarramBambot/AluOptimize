import React from 'react';
import { Box, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  username: yup.string().required('Username required'),
  email: yup.string().email('Invalid email').required('Email required'),
  password: yup.string().min(6, 'Minimum 6 chars').required('Password required'),
});

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await api.post('/auth/users/', values);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const username = err.response?.data?.username;
      const email = err.response?.data?.email;
      
      if (username) {
        setError(`Username error: ${username[0]}`);
      } else if (email) {
        setError(`Email error: ${email[0]}`);
      } else if (detail) {
        setError(detail);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={480} mx="auto" mt={6}>
      <Typography variant="h4" gutterBottom>Register</Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Create a new account to access AluOptimize.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Your account will be activated after admin approval. 
          You will be able to log in once an administrator reviews and approves your registration.
        </Typography>
      </Alert>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Registration successful!
          </Typography>
          <Typography variant="body2">
            Your account has been created and is pending admin approval. 
            You will be able to log in once approved. Redirecting to login page...
          </Typography>
        </Alert>
      )}
      
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
          disabled={loading || success}
        />
        <TextField 
          fullWidth 
          label="Email" 
          {...register('email')} 
          error={!!errors.email} 
          helperText={errors.email?.message} 
          margin="normal"
          disabled={loading || success}
        />
        <TextField 
          fullWidth 
          label="Password" 
          type="password" 
          {...register('password')} 
          error={!!errors.password} 
          helperText={errors.password?.message} 
          margin="normal"
          disabled={loading || success}
        />
        <Box mt={2}>
          <Button type="submit" disabled={loading || success}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Create account'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
