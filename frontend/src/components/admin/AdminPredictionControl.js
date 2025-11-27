import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import api from '../../services/api';

export default function AdminPredictionControl() {
  const [predictions, setPredictions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [selectedPrediction, setSelectedPrediction] = React.useState(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [statistics, setStatistics] = React.useState(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = statusFilter !== 'All' ? { status: statusFilter } : {};
      const response = await api.get('/prediction/predictions/', { params });
      
      // Handle both paginated and non-paginated responses
      const data = response.data.results || response.data;
      setPredictions(Array.isArray(data) ? data : []);
      
      // Calculate basic statistics
      const stats = {
        total: Array.isArray(data) ? data.length : 0,
        approved: Array.isArray(data) ? data.filter(p => p.status === 'approved').length : 0,
        pending: Array.isArray(data) ? data.filter(p => p.input_data?.status === 'pending').length : 0,
        avgEfficiency: Array.isArray(data) && data.length > 0 
          ? data.reduce((sum, p) => sum + (p.energy_efficiency || 0), 0) / data.length 
          : 0
      };
      setStatistics(stats);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to load predictions. Please try again.');
      setPredictions([]);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPredictions();
  }, [statusFilter]);

  const handleRunPrediction = async (inputId) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await api.post(`/prediction/inputs/${inputId}/generate_prediction/`);
      
      setSuccess(`Prediction generated successfully! Output: ${response.data.prediction.predicted_output.toFixed(2)} kg`);
      fetchPredictions();
    } catch (err) {
      console.error('Error running prediction:', err);
      setError(err.response?.data?.error || 'Failed to run prediction');
    }
  };

  const handleApprovePrediction = async (inputId) => {
    try {
      setError('');
      setSuccess('');
      
      await api.post(`/prediction/inputs/${inputId}/send_to_user/`);
      
      setSuccess('Prediction sent to user successfully!');
      fetchPredictions();
    } catch (err) {
      console.error('Error sending prediction:', err);
      setError(err.response?.data?.error || 'Failed to send prediction');
    }
  };

  const handleRejectPrediction = async (inputId) => {
    try {
      setError('');
      setSuccess('');
      
      await api.post(`/prediction/inputs/${inputId}/reject/`);
      
      setSuccess('Input rejected successfully!');
      fetchPredictions();
    } catch (err) {
      console.error('Error rejecting input:', err);
      setError(err.response?.data?.error || 'Failed to reject input');
    }
  };

  const handleShowDetails = (prediction) => {
    setSelectedPrediction(prediction);
    setDetailsOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Processing':
        return 'warning';
      case 'Pending':
      default:
        return 'default';
    }
  };

  if (loading && predictions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Prediction Control
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPredictions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Predictions
                </Typography>
                <Typography variant="h4">{statistics.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {statistics.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Approved
                </Typography>
                <Typography variant="h4" color="success.main">
                  {statistics.approved}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Efficiency
                </Typography>
                <Typography variant="h4" color="info.main">
                  {statistics.avgEfficiency.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filter */}
      <Box mb={2}>
        <TextField
          select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Processing">Processing</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
        </TextField>
      </Box>

      {/* Predictions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Line</strong></TableCell>
              <TableCell><strong>Temp (°C)</strong></TableCell>
              <TableCell><strong>Pressure (Pa)</strong></TableCell>
              <TableCell><strong>Feed Rate</strong></TableCell>
              <TableCell><strong>Power (kWh)</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Submitted</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {predictions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="textSecondary">No predictions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              predictions.map((pred) => {
                const input = pred.input_data || {};
                const status = pred.status || 'pending';
                
                return (
                  <TableRow key={pred.id}>
                    <TableCell>{pred.id}</TableCell>
                    <TableCell>
                      {input.created_by_username ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {input.created_by_username}
                          </Typography>
                          {input.created_by_email && (
                            <Typography variant="caption" color="textSecondary">
                              {input.created_by_email}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{input.production_line || 'N/A'}</TableCell>
                    <TableCell>{input.temperature}</TableCell>
                    <TableCell>{input.pressure}</TableCell>
                    <TableCell>{input.feed_rate} kg/h</TableCell>
                    <TableCell>{input.power_consumption}</TableCell>
                    <TableCell>
                      <Chip
                        label={status}
                        color={getStatusColor(status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(input.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleShowDetails(pred)}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {input.status === 'pending' && (
                          <Tooltip title="Generate Prediction">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRunPrediction(input.id)}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {input.status === 'approved' && !input.sent_to_user && (
                          <Tooltip title="Send to User">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprovePrediction(input.id)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {input.status === 'pending' && (
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRejectPrediction(input.id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Prediction Details</DialogTitle>
        <DialogContent>
          {selectedPrediction && (
            <Box>
              <Typography variant="h6" gutterBottom>Input Parameters</Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Production Line</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.production_line || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Temperature</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.temperature}°C</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Pressure</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.pressure} Pa</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Feed Rate</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.feed_rate} kg/h</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Power Consumption</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.power_consumption} kWh</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Anode Effect</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.anode_effect}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Bath Ratio</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.bath_ratio}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Alumina Concentration</Typography>
                  <Typography variant="body1">{selectedPrediction.input_data?.alumina_concentration}%</Typography>
                </Grid>
              </Grid>

              {selectedPrediction.predicted_output && (
                <>
                  <Typography variant="h6" gutterBottom>Prediction Results</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Predicted Output</Typography>
                      <Typography variant="body1">{selectedPrediction.predicted_output.toFixed(2)} kg</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Energy Efficiency</Typography>
                      <Typography variant="body1">{selectedPrediction.energy_efficiency?.toFixed(2)}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Output Quality</Typography>
                      <Typography variant="body1">{selectedPrediction.output_quality?.toFixed(2)}/100</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Chip
                        label={selectedPrediction.status}
                        color={getStatusColor(selectedPrediction.status)}
                        size="small"
                      />
                    </Grid>
                    {selectedPrediction.processed_by_username && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Processed By</Typography>
                        <Typography variant="body1">{selectedPrediction.processed_by_username}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
