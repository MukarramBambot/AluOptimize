import React from 'react';
import Layout from '../components/Layout';
import { Typography, Grid, Card, CardContent, CircularProgress, Box, Chip } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FactoryIcon from '@mui/icons-material/Factory';
import RecyclingIcon from '@mui/icons-material/Recycling';
import SpeedIcon from '@mui/icons-material/Speed';
import predictionService from '../services/predictionService';

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
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);
      // Only fetch user predictions from the unified endpoint
      const predictionsRes = await predictionService.getUserPredictions();
      const predictions = predictionsRes.results || predictionsRes || [];

      // Only show predictions that are sent to user (should already be filtered by backend)
      const filtered = predictions.filter(p => p && (p.sent_to_user === undefined || p.sent_to_user));
      const sortedPredictions = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      const avgEff = sortedPredictions.length > 0 
        ? (sortedPredictions.reduce((sum, o) => sum + (Number(o.efficiency) || Number(o.energy_efficiency) || 0), 0) / sortedPredictions.length)
        : 0;
      const latestEff = sortedPredictions.length > 0 
        ? (Number(sortedPredictions[0].efficiency) || Number(sortedPredictions[0].energy_efficiency) || 0)
        : 0;

      setStats({
        totalInputs: sortedPredictions.length,
        totalOutputs: sortedPredictions.length,
        totalWaste: sortedPredictions.filter(p => p.waste_amount).length,
        avgEfficiency: Number(avgEff).toFixed(1),
        latestEfficiency: Number(latestEff).toFixed(1),
      });

      setPredictions(sortedPredictions.slice(0, 5));
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setPredictions([]);
      setStats({ totalInputs: 0, totalOutputs: 0, totalWaste: 0, avgEff: 0, latestEff: 0 });
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
    efficiency: Number(pred.efficiency) || Number(pred.energy_efficiency) || 0,
    output: Number(pred.output_kg) || Number(pred.predicted_output) || 0,
    quality: Number(pred.quality) || Number(pred.output_quality) || 0,
  }));

  const wasteData = predictions
    .filter(pred => pred.waste_type && (pred.waste_amount || pred.waste_management?.waste_amount))
    .map(pred => ({
      waste_type: pred.waste_type || pred.waste_management?.waste_type,
      waste_amount: Number(pred.waste_amount || pred.waste_management?.waste_amount || 0),
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
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.latestEfficiency || 0}%</Typography>
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
                  <Typography variant="h4" color="white" fontWeight="bold">{stats.avgEfficiency || 0}%</Typography>
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
                      {predictions[0].predicted_output != null ? Number(predictions[0].predicted_output).toFixed(2) : 'N/A'} kg
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">Quality Score</Typography>
                    <Typography variant="h5" color="success.main">
                      {predictions[0].output_quality != null ? Number(predictions[0].output_quality).toFixed(2) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="textSecondary">Energy Efficiency</Typography>
                    <Typography variant="h5" color="warning.main">
                      {predictions[0].energy_efficiency != null ? Number(predictions[0].energy_efficiency).toFixed(2) : 'N/A'}%
                    </Typography>
                  </Box>
                  {/* Waste Management Section */}
                  {predictions[0].waste_management && (
                    <Box mb={2}>
                      <Typography variant="body2" color="textSecondary">Waste Generated</Typography>
                      <Typography variant="h6" color="error.main">
                        {predictions[0].waste_management.waste_amount != null ? Number(predictions[0].waste_management.waste_amount).toFixed(2) : 'N/A'} {predictions[0].waste_management.unit || 'kg'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Type: {predictions[0].waste_management.waste_type || 'N/A'}
                      </Typography>
                    </Box>
                  )}
                  {/* Waste Recommendations Section */}
                  {predictions[0].waste_recommendations && (
                    <Box>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Recommendation
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {predictions[0].waste_recommendations.recommendation_text || 'N/A'}
                      </Typography>
                      {predictions[0].waste_recommendations.estimated_savings != null && (
                        <Typography variant="caption" color="success.main" display="block">
                          Estimated Savings: ${Number(predictions[0].waste_recommendations.estimated_savings || 0).toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  )}
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
              {wasteData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={wasteData}>
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
