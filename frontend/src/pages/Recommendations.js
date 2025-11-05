import React from 'react';
import Layout from '../components/Layout';
import { 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import api from '../services/api';

export default function Recommendations() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch user-facing recommendations (only from approved predictions)
        const resp = await api.get('/waste/user-recommendations/');
        if (mounted) {
          setItems(resp.data.results || resp.data);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Failed to load recommendations. Please try again later.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TipsAndUpdatesIcon color="primary" fontSize="large" />
        <Typography variant="h4">Waste Optimization Recommendations</Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        ⚠️ These are AI-generated approximate values based on your production input.
        Recommendations are automatically generated from your approved production predictions using
        reinforcement learning optimization strategies.
      </Alert>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {items.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <RecyclingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No recommendations available yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Recommendations will appear here once your production predictions are approved by an administrator.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Table */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Production Line</strong></TableCell>
                  <TableCell><strong>Waste Amount</strong></TableCell>
                  <TableCell><strong>Energy Efficiency</strong></TableCell>
                  <TableCell><strong>Reusable</strong></TableCell>
                  <TableCell><strong>Est. Savings</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.production_line || 'N/A'}</TableCell>
                    <TableCell>
                      {item.waste_amount ? `${item.waste_amount.toFixed(2)} ${item.unit}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.energy_efficiency ? (
                        <Chip 
                          label={`${item.energy_efficiency.toFixed(1)}%`}
                          color={item.energy_efficiency >= 80 ? 'success' : item.energy_efficiency >= 60 ? 'warning' : 'error'}
                          size="small"
                        />
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.reuse_possible ? (
                        <Chip label="Yes" color="success" size="small" />
                      ) : (
                        <Chip label="No" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.estimated_savings ? `$${parseFloat(item.estimated_savings).toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.date_recorded ? new Date(item.date_recorded).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Detailed Recommendations */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            AI Recommendations
          </Typography>
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid item xs={12} key={item.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" component="div">
                          {item.production_line || 'Production Line'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.waste_type || 'Aluminum Dross'} • {item.date_recorded ? new Date(item.date_recorded).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      {item.estimated_savings && (
                        <Chip 
                          label={`Potential Savings: $${parseFloat(item.estimated_savings).toFixed(2)}`}
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                    
                    <Box bgcolor="grey.50" p={2} borderRadius={1} mb={2}>
                      <Typography variant="body1">
                        {item.recommendation_text}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="textSecondary">
                          Waste Generated
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.waste_amount ? `${item.waste_amount.toFixed(2)} ${item.unit}` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="textSecondary">
                          Energy Efficiency
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.energy_efficiency ? `${item.energy_efficiency.toFixed(1)}%` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="textSecondary">
                          Predicted Output
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.predicted_output ? `${item.predicted_output.toFixed(2)} kg` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Layout>
  );
}
