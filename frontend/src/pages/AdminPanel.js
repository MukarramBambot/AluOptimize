import React from 'react';
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
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  TextField,
  MenuItem
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import api from '../services/api';
import predictionService from '../services/predictionService';

export default function AdminPanel() {
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [predictionDialog, setPredictionDialog] = React.useState(false);
  const [predictionResult, setPredictionResult] = React.useState(null);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [statistics, setStatistics] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    fetchAllRequests();
  }, [statusFilter]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all production inputs (not just pending)
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const data = await predictionService.getAllInputs(params);
      const allRequests = Array.isArray(data.results || data) ? (data.results || data) : [];
      
      setRequests(allRequests);
      
      // Calculate statistics
      const stats = {
        total: allRequests.length,
        pending: allRequests.filter(r => r.status === 'pending').length,
        approved: allRequests.filter(r => r.status === 'approved').length,
        rejected: allRequests.filter(r => r.status === 'rejected').length,
        sent: allRequests.filter(r => r.sent_to_user).length
      };
      setStatistics(stats);
      
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAndCalculate = async (request) => {
    setSelectedRequest(request);
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await predictionService.generatePrediction(request.id);
      setPredictionResult(response.prediction);
      setPredictionDialog(true);
      setSuccess('Prediction generated successfully!');
      
      // Refresh the list
      fetchAllRequests();
    } catch (err) {
      console.error('Error generating prediction:', err);
      setError(err.response?.data?.error || 'Failed to generate prediction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToUser = async (request) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await predictionService.sendToUser(request.id);
      setSuccess('Prediction sent to user successfully!');
      
      // Refresh the list
      fetchAllRequests();
      
      // Close prediction dialog if open
      if (predictionDialog) {
        setPredictionDialog(false);
        setPredictionResult(null);
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error('Error sending to user:', err);
      setError(err.response?.data?.error || 'Failed to send prediction to user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm('Are you sure you want to reject this request?')) {
      return;
    }
    
    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await predictionService.rejectInput(request.id);
      setSuccess('Request rejected successfully!');
      
      // Refresh the list
      fetchAllRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowDetails = (request) => {
    setSelectedRequest(request);
    setPredictionDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>Admin Panel - User Input Processing</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAllRequests}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Review, approve, and process all user-submitted production inputs.
      </Typography>
      
      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total
                </Typography>
                <Typography variant="h4">{statistics.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Sent
                </Typography>
                <Typography variant="h4" color="info.main">
                  {statistics.sent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rejected
                </Typography>
                <Typography variant="h4" color="error.main">
                  {statistics.rejected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
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
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Box>
      
      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No requests found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            {statusFilter !== 'all' ? `No ${statusFilter} requests found.` : 'No production inputs have been submitted yet.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Production Line</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Parameters</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>#{request.id}</TableCell>
                  <TableCell>
                    <Chip 
                      label={request.production_line} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    {request.created_by_username || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      Temp: {request.temperature}°C | 
                      Pressure: {request.pressure} Pa | 
                      Feed: {request.feed_rate} kg/h
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={request.status} 
                      size="small" 
                      color={
                        request.status === 'pending' ? 'warning' :
                        request.status === 'approved' ? 'success' :
                        request.status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleShowDetails(request)}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {request.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleApproveAndCalculate(request)}
                          disabled={actionLoading}
                        >
                          Approve & Calculate
                        </Button>
                      )}
                      
                      {request.status === 'approved' && !request.sent_to_user && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<SendIcon />}
                          onClick={() => handleSendToUser(request)}
                          disabled={actionLoading}
                        >
                          Send to User
                        </Button>
                      )}
                      
                      {request.status === 'pending' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleReject(request)}
                          disabled={actionLoading}
                        >
                          Reject
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Dialog */}
      <Dialog 
        open={predictionDialog} 
        onClose={() => {
          setPredictionDialog(false);
          setPredictionResult(null);
          setSelectedRequest(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {predictionResult ? 'Prediction Results' : 'Input Details'} for Request #{selectedRequest?.id}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Typography variant="h6" gutterBottom>Input Parameters</Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Production Line</Typography>
                  <Typography variant="body1">{selectedRequest.production_line}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Temperature</Typography>
                  <Typography variant="body1">{selectedRequest.temperature}°C</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Pressure</Typography>
                  <Typography variant="body1">{selectedRequest.pressure} Pa</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Feed Rate</Typography>
                  <Typography variant="body1">{selectedRequest.feed_rate} kg/h</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Power Consumption</Typography>
                  <Typography variant="body1">{selectedRequest.power_consumption} kWh</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Submitted By</Typography>
                  <Typography variant="body1">{selectedRequest.created_by_username || 'Unknown'}</Typography>
                </Grid>
              </Grid>

              {predictionResult && (
                <>
                  <Typography variant="h6" gutterBottom>Prediction Results</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Predicted Output:</Typography>
                      <Typography variant="h6">
                        {predictionResult.predicted_output?.toFixed(2)} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Energy Efficiency:</Typography>
                      <Typography variant="h6">
                        {predictionResult.energy_efficiency?.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Quality Score:</Typography>
                      <Typography variant="h6">
                        {predictionResult.output_quality?.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Waste Amount:</Typography>
                      <Typography variant="h6">
                        {predictionResult.waste_amount?.toFixed(2)} kg
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPredictionDialog(false);
            setPredictionResult(null);
            setSelectedRequest(null);
          }}>
            Close
          </Button>
          {predictionResult && selectedRequest?.status === 'approved' && !selectedRequest?.sent_to_user && (
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => handleSendToUser(selectedRequest)}
              disabled={actionLoading}
            >
              Send to User
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
