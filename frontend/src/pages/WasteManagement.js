import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Typography, 
  CircularProgress, 
  Alert, 
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import RecyclingIcon from '@mui/icons-material/Recycling';
import InfoIcon from '@mui/icons-material/Info';
import wasteService from '../services/wasteService';
import recommendationService from '../services/recommendationService';
import { AuthContext, useAuth } from '../context/AuthContext';

export default function WasteManagement() {
  const [waste, setWaste] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      wasteService.getUserWaste(),
      recommendationService.getUserRecommendations()
    ]).then(([wasteRes, recRes]) => {
      const wasteData = Array.isArray(wasteRes) ? wasteRes : (wasteRes.results || []);
      const recData = Array.isArray(recRes) ? recRes : (recRes.results || []);
      setWaste(wasteData);
      setRecommendations(recData);
    }).catch(e => {
      console.error('Error loading waste/recommendations:', e);
      setError('Failed to load waste or recommendations');
      setWaste([]);
      setRecommendations([]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout theme="blue">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout theme="blue">
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <RecyclingIcon color="primary" fontSize="large" />
        <Typography variant="h4">Waste Management</Typography>
      </Box>
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        ⚠️ These are AI-generated approximate values based on your production input.
        Waste and recommendations are generated from your production predictions.
      </Alert>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Section 1: Waste Records */}
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Waste Records</Typography>
      {waste.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
          <RecyclingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No waste records yet
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Waste Type</strong></TableCell>
                <TableCell align="right"><strong>Amount</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Estimated Savings</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {waste.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.waste_type || 'N/A'}</TableCell>
                  <TableCell align="right">
                    {item.waste_amount != null ? Number(item.waste_amount).toFixed(2) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.date ? new Date(item.date).toLocaleDateString() : 
                     (item.date_recorded ? new Date(item.date_recorded).toLocaleDateString() : 'N/A')}
                  </TableCell>
                  <TableCell>
                    {item.estimated_savings != null ? `$${Number(item.estimated_savings).toFixed(2)}` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Section 2: Optimization Recommendations */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Optimization Recommendations</Typography>
      {recommendations.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No recommendations available yet
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Recommendation</strong></TableCell>
                <TableCell><strong>Estimated Savings</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recommendations.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{rec.recommendation_text || 'N/A'}</TableCell>
                  <TableCell>
                    {rec.estimated_savings != null ? `$${Number(rec.estimated_savings).toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {rec.date ? new Date(rec.date).toLocaleDateString() : 
                     (rec.created_at ? new Date(rec.created_at).toLocaleDateString() : 'N/A')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Layout>
  );
}
