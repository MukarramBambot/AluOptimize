import React from 'react';
import Layout from '../components/Layout';
import predictionService from '../services/predictionService';
import { 
  Typography, 
  CircularProgress, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  CartesianGrid 
} from 'recharts';

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Predictions() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchPredictions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await predictionService.getUserPredictions();
      const data = resp.results || resp || [];
      // Only show predictions that are sent to user (should already be filtered by backend)
      const filtered = data.filter(p => p && (p.sent_to_user === undefined || p.sent_to_user));
      const sortedData = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setItems(sortedData);
      console.log('Fetched user predictions:', sortedData);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPredictions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const chartData = items.map(item => ({
    name: item.input_data?.production_line || 'N/A',
    efficiency: item.energy_efficiency != null ? Number(item.energy_efficiency) : 0,
    output: item.predicted_output != null ? Number(item.predicted_output) : 0,
    quality: item.output_quality != null ? Number(item.output_quality) : 0,
    timestamp: formatDate(item.created_at)
  }));

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Production Predictions</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Alert severity="info">
          No predictions available yet. Your submitted inputs are being reviewed by staff. You will see predictions here once they are approved and sent to you.
        </Alert>
      ) : (
        <>
          {/* Efficiency Chart */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Energy Efficiency Trends</Typography>
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
                  name="Energy Efficiency (%)" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Output & Quality Chart */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Predicted Output & Quality</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="output" fill="#4caf50" name="Predicted Output (kg)" />
                <Bar dataKey="quality" fill="#ff9800" name="Quality Score" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Data Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Production Line</strong></TableCell>
                  <TableCell align="right"><strong>Feed Rate (kg/h)</strong></TableCell>
                  <TableCell align="right"><strong>Power (kWh)</strong></TableCell>
                  <TableCell align="right"><strong>Predicted Output (kg)</strong></TableCell>
                  <TableCell align="right"><strong>Energy Efficiency (%)</strong></TableCell>
                  <TableCell align="right"><strong>Quality Score</strong></TableCell>
                  <TableCell align="right"><strong>Waste (kg)</strong></TableCell>
                  <TableCell><strong>Recommendation</strong></TableCell>
                  <TableCell><strong>Timestamp</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.input_data?.production_line || 'N/A'}</TableCell>
                    <TableCell align="right">
                      {item.input_data?.feed_rate != null ? Number(item.input_data.feed_rate).toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {item.input_data?.power_consumption != null ? Number(item.input_data.power_consumption).toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      {item.predicted_output != null ? Number(item.predicted_output).toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Box 
                        component="span" 
                        sx={{ 
                          color: (item.energy_efficiency != null && Number(item.energy_efficiency) > 15) ? 'success.main' : 'warning.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {item.energy_efficiency != null ? Number(item.energy_efficiency).toFixed(2) : 'N/A'}%
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {item.output_quality != null ? Number(item.output_quality).toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Box 
                        component="span" 
                        sx={{ 
                          color: (item.waste_management?.waste_amount != null && Number(item.waste_management.waste_amount) > 300) ? 'error.main' : 'warning.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {item.waste_management?.waste_amount != null ? Number(item.waste_management.waste_amount).toFixed(2) : 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.waste_recommendations ? (
                        <Box>
                          <Typography variant="caption" color="primary" display="block">
                            {item.waste_recommendations.recommendation_text?.substring(0, 50) || 'N/A'}...
                          </Typography>
                          {item.waste_recommendations.estimated_savings && (
                            <Typography variant="caption" color="success.main" display="block">
                              Save: ${Number(item.waste_recommendations.estimated_savings || 0).toFixed(0)}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Layout>
  );
}
