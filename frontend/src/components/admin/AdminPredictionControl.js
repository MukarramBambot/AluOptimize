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
      const response = await api.get('/admin-panel/prediction-control/', { params });
      
      setPredictions(response.data);
      
      // Fetch statistics
      const statsResponse = await api.get('/admin-panel/prediction-control/statistics/');
      setStatistics(statsResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to load predictions. Please try again.');
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
      
      const response = await api.post(`/admin-panel/prediction-control/${inputId}/run/`);
      
      setSuccess(`Prediction generated successfully! Output: ${response.data.output.predicted_output.toFixed(2)} kg`);
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
      
      await api.post(`/admin-panel/prediction-control/${inputId}/approve/`);
      
      setSuccess('Prediction approved successfully!');
      fetchPredictions();
    } catch (err) {
      console.error('Error approving prediction:', err);
      setError(err.response?.data?.error || 'Failed to approve prediction');
    }
  };

  const handleRejectPrediction = async (inputId) => {
    try {
      setError('');
      setSuccess('');
      
      await api.post(`/admin-panel/prediction-control/${inputId}/reject/`);
      
      setSuccess('Prediction rejected successfully!');
      fetchPredictions();
    } catch (err) {
      console.error('Error rejecting prediction:', err);
      setError(err.response?.data?.error || 'Failed to reject prediction');
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
                  Total Inputs
                </Typography>
                <Typography variant="h4">{statistics.total_inputs}</Typography>
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
                  {statistics.by_status.pending + statistics.inputs_without_predictions}
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
                  {statistics.by_status.approved}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rejected
                </Typography>
                <Typography variant="h4" color="error.main">
                  {statistics.by_status.rejected}
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
                const input = pred.input;
                const output = pred.output;
                const status = output ? output.status : 'Pending';
                
                return (
                  <TableRow key={input.id}>
                    <TableCell>{input.id}</TableCell>
                    <TableCell>
                      {input.submitted_by_username ? (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {input.submitted_by_username}
                          </Typography>
                          {input.submitted_by_email && (
                            <Typography variant="caption" color="textSecondary">
                              {input.submitted_by_email}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{input.production_line}</TableCell>
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
                        
                        {!pred.has_prediction && (
                          <Tooltip title="Run Prediction">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleRunPrediction(input.id)}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {output && !output.is_approved && status !== 'Rejected' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprovePrediction(input.id)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRejectPrediction(input.id)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
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
                  <Typography variant="body1">{selectedPrediction.input.production_line}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Temperature</Typography>
                  <Typography variant="body1">{selectedPrediction.input.temperature}°C</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Pressure</Typography>
                  <Typography variant="body1">{selectedPrediction.input.pressure} Pa</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Feed Rate</Typography>
                  <Typography variant="body1">{selectedPrediction.input.feed_rate} kg/h</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Power Consumption</Typography>
                  <Typography variant="body1">{selectedPrediction.input.power_consumption} kWh</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Anode Effect</Typography>
                  <Typography variant="body1">{selectedPrediction.input.anode_effect}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Bath Ratio</Typography>
                  <Typography variant="body1">{selectedPrediction.input.bath_ratio}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Alumina Concentration</Typography>
                  <Typography variant="body1">{selectedPrediction.input.alumina_concentration}%</Typography>
                </Grid>
              </Grid>

              {selectedPrediction.output && (
                <>
                  <Typography variant="h6" gutterBottom>Prediction Results</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Predicted Output</Typography>
                      <Typography variant="body1">{selectedPrediction.output.predicted_output.toFixed(2)} kg</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Energy Efficiency</Typography>
                      <Typography variant="body1">{selectedPrediction.output.energy_efficiency.toFixed(2)}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Output Quality</Typography>
                      <Typography variant="body1">{selectedPrediction.output.output_quality.toFixed(2)}/100</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Chip
                        label={selectedPrediction.output.status}
                        color={getStatusColor(selectedPrediction.output.status)}
                        size="small"
                      />
                    </Grid>
                    {selectedPrediction.output.processed_by_username && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Processed By</Typography>
                        <Typography variant="body1">{selectedPrediction.output.processed_by_username}</Typography>
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
