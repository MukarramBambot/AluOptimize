import React from 'react';
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
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function WasteManagement() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const { user } = React.useContext(AuthContext);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch waste records for the current user
        const resp = await api.get('/waste/management/');
        if (mounted) {
          // Filter to show only user's own waste records
          const userWaste = (resp.data.results || resp.data).filter(
            item => item.recorded_by === user?.id || !item.recorded_by
          );
          setItems(userWaste);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Failed to load waste data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [user]);

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
        <RecyclingIcon color="primary" fontSize="large" />
        <Typography variant="h4">Waste Management</Typography>
      </Box>
      
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        ⚠️ These are AI-generated approximate values based on your production input.
        Waste data is automatically generated from your production predictions using reinforcement learning. 
        No manual entry required. View AI recommendations in the "Recommendations" page.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <RecyclingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No waste records yet
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Waste data will be automatically generated when your production predictions are processed.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Waste Type</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Unit</strong></TableCell>
                <TableCell><strong>Date Recorded</strong></TableCell>
                <TableCell><strong>Reusable</strong></TableCell>
                <TableCell><strong>Production Line</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.waste_type}</TableCell>
                  <TableCell>{item.waste_amount.toFixed(2)}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    {item.date_recorded ? new Date(item.date_recorded).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.reuse_possible ? (
                      <Chip label="Yes" color="success" size="small" />
                    ) : (
                      <Chip label="No" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {item.production_input?.production_line || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Alert severity="success" sx={{ mt: 3 }}>
        💡 <strong>Tip:</strong> Check the "Recommendations" page for AI-generated optimization suggestions 
        based on this waste data.
      </Alert>
    </Layout>
  );
}
