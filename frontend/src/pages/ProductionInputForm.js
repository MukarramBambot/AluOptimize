import React from 'react';
import Layout from '../components/Layout';
import { Box, TextField, Typography, CircularProgress, MenuItem, Grid, Alert, Paper, Divider } from '@mui/material';
import Button from '../components/ui/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  production_line: yup.string().required('Required'),
  temperature: yup.number().required('Required').positive('Must be positive').typeError('Must be a number'),
  pressure: yup.number().required('Required').positive('Must be positive').typeError('Must be a number'),
  feed_rate: yup.number().required('Required').positive('Must be positive').typeError('Must be a number'),
  power_consumption: yup.number().required('Required').positive('Must be positive').typeError('Must be a number'),
  anode_effect_frequency: yup.number().required('Required').min(0).typeError('Must be a number'),
  bath_ratio: yup.number().required('Required').positive('Must be positive').typeError('Must be a number'),
  alumina_concentration: yup.number().required('Required').min(0).max(100, 'Must be between 0 and 100').typeError('Must be a number'),
});

const productionLines = [
  { value: 'LINE_A', label: 'Production Line A' },
  { value: 'LINE_B', label: 'Production Line B' },
  { value: 'LINE_C', label: 'Production Line C' },
];

export default function ProductionInputForm() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState('');
  const [prediction, setPrediction] = React.useState(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({ 
    resolver: yupResolver(schema),
    defaultValues: {
      production_line: 'LINE_A',
      temperature: '',
      pressure: '',
      feed_rate: '',
      power_consumption: '',
      anode_effect_frequency: '',
      bath_ratio: '',
      alumina_concentration: '',
    }
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setPrediction(null);
    
    try {
      const response = await api.post('/prediction/inputs/', values);
      console.log('Submission response:', response.data);
      
      // With new workflow, we only get a success message, no prediction
      setSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        reset();
        setSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('Submission error:', err);
      const errorMsg = err.response?.data?.error 
        || err.response?.data?.detail 
        || err.message 
        || 'Failed to submit production input';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Production Input Form</Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Enter production parameters to submit for analysis and prediction.
      </Typography>
      
      {success && (
        <Alert 
          severity="success" 
          icon={<CheckCircleIcon />}
          sx={{ mb: 3 }}
          onClose={() => setSuccess(false)}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            Production input submitted successfully!
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Your input has been received and is awaiting staff review. You will be notified once the prediction is ready.
          </Typography>
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Box maxWidth={800} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              select
              label="Production Line" 
              {...register('production_line')} 
              error={!!errors.production_line} 
              helperText={errors.production_line?.message}
              defaultValue="LINE_A"
            >
              {productionLines.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Temperature (°C)" 
              type="number"
              {...register('temperature')} 
              error={!!errors.temperature} 
              helperText={errors.temperature?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Pressure (Pa)" 
              type="number"
              {...register('pressure')} 
              error={!!errors.pressure} 
              helperText={errors.pressure?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Feed Rate (kg/h)" 
              type="number"
              {...register('feed_rate')} 
              error={!!errors.feed_rate} 
              helperText={errors.feed_rate?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Power Consumption (kWh)" 
              type="number"
              {...register('power_consumption')} 
              error={!!errors.power_consumption} 
              helperText={errors.power_consumption?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Anode Effect Frequency" 
              type="number"
              {...register('anode_effect_frequency')} 
              error={!!errors.anode_effect_frequency} 
              helperText={errors.anode_effect_frequency?.message}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              label="Bath Ratio" 
              type="number"
              {...register('bath_ratio')} 
              error={!!errors.bath_ratio} 
              helperText={errors.bath_ratio?.message}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              label="Alumina Concentration (%)" 
              type="number"
              {...register('alumina_concentration')} 
              error={!!errors.alumina_concentration} 
              helperText={errors.alumina_concentration?.message}
            />
          </Grid>
        </Grid>
        <Box mt={3}>
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Production Input'}
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}
