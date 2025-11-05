import React from 'react';
import Layout from '../components/Layout';
import { Typography, Grid, Card, CardContent, CircularProgress, Box, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FactoryIcon from '@mui/icons-material/Factory';
import RecyclingIcon from '@mui/icons-material/Recycling';
import SpeedIcon from '@mui/icons-material/Speed';
import api from '../services/api';

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Dashboard() {
  const [stats, setStats] = React.useState({
    totalInputs: 0,
    totalOutputs: 0,
    totalWaste: 0,
    avgEfficiency: 0,
    latestEfficiency: 0,
  });
  const [predictions, setPredictions] = React.useState([]);
  const [waste, setWaste] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [inputsRes, outputsRes, wasteRes] = await Promise.all([
        api.get('/prediction/inputs/'),
        api.get('/prediction/outputs/'),
        api.get('/waste/management/'),
      ]);

      const inputs = inputsRes.data.results || inputsRes.data || [];
      const outputs = outputsRes.data.results || outputsRes.data || [];
      const wasteData = wasteRes.data.results || wasteRes.data || [];

      // Sort outputs by created_at descending
      const sortedOutputs = outputs.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

      const avgEff = outputs.length > 0 
        ? (outputs.reduce((sum, o) => sum + (o.energy_efficiency || 0), 0) / outputs.length)
        : 0;

      const latestEff = sortedOutputs.length > 0 
        ? sortedOutputs[0].energy_efficiency || 0
        : 0;

      setStats({
        totalInputs: inputs.length,
        totalOutputs: outputs.length,
        totalWaste: wasteData.length,
        avgEfficiency: avgEff.toFixed(1),
        latestEfficiency: latestEff.toFixed(2),
      });

      setPredictions(sortedOutputs.slice(0, 10));
      setWaste(wasteData.slice(0, 10));
      
      console.log('Dashboard data refreshed:', { 
        outputs: outputs.length, 
        avgEff: avgEff.toFixed(1),
        latestEff: latestEff.toFixed(2)
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  const chartData = predictions.map((pred, idx) => ({
    name: `#${predictions.length - idx}`,
    efficiency: pred.energy_efficiency || 0,
    output: pred.predicted_output || 0,
    quality: pred.output_quality || 0,
  }));

  return (
    <Layout>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Dashboard</Typography>
        <Chip 
          label="Auto-refresh: 30s" 
          color="primary" 
          size="small" 
          variant="outlined"
        />
      </Box>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>Total Inputs</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.totalInputs}</Typography>
                </Box>
                <FactoryIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>Predictions</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.totalOutputs}</Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>Latest Efficiency</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.latestEfficiency}%</Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>Avg Efficiency</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.avgEfficiency}%</Typography>
                </Box>
                <RecyclingIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy Efficiency Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Energy Efficiency Trends</Typography>
              {predictions.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Efficiency (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke="#1976d2" 
                      strokeWidth={2}
                      name="Energy Efficiency (%)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="textSecondary">No prediction data available yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Output & Quality Widget */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Latest Prediction</Typography>
              {predictions.length > 0 ? (
                <Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">Production Line</Typography>
                    <Typography variant="h6">
                      {predictions[0].input_data?.production_line || 'N/A'}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">Predicted Output</Typography>
                    <Typography variant="h5" color="primary">
                      {predictions[0].predicted_output?.toFixed(2) || 'N/A'} kg
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">Quality Score</Typography>
                    <Typography variant="h5" color="success.main">
                      {predictions[0].output_quality?.toFixed(2) || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Energy Efficiency</Typography>
                    <Typography variant="h5" color="warning.main">
                      {predictions[0].energy_efficiency?.toFixed(2) || 'N/A'}%
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                  <Typography color="textSecondary">No predictions yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Waste Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Waste Management Overview</Typography>
              {waste.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={waste}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="waste_type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="waste_amount" fill="#4caf50" name="Waste Amount (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height={250}>
                  <Typography color="textSecondary">No waste data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
}
