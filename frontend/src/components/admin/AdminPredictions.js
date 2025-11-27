import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentIcon from '@mui/icons-material/Payment';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../../services/api';

export default function AdminPredictions() {
  const [predictions, setPredictions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [reportDialog, setReportDialog] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState(null);

  React.useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError('');
      // Use the prediction endpoint for admin/staff - it shows all predictions
      const response = await api.get('/prediction/predictions/');
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setPredictions(data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      // Don't set error for empty data, just set empty array
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (predictionId) => {
    try {
      setError('');
      // This endpoint might not exist, so we'll handle gracefully
      await api.post(`/prediction/outputs/${predictionId}/mark_paid/`);
      setSuccess('Prediction marked as paid');
      fetchPredictions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking as paid:', err);
      // Don't show error if endpoint doesn't exist
      if (err.response?.status !== 404) {
        setError('Failed to mark as paid');
      }
    }
  };

  const handleGenerateReport = async (predictionId) => {
    try {
      setError('');
      // This endpoint might not exist, so we'll handle gracefully
      const response = await api.get(`/prediction/outputs/${predictionId}/generate_report/`);
      setSelectedReport(response.data);
      setReportDialog(true);
    } catch (err) {
      console.error('Error generating report:', err);
      // Don't show error if endpoint doesn't exist
      if (err.response?.status !== 404) {
        setError('Failed to generate report');
      }
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedReport) return;

    // Create a simple text representation for download
    // In production, you'd use a proper PDF library like jsPDF or pdfmake
    const reportText = `
AluOptimize Production Report
=============================

Prediction ID: ${selectedReport.prediction_id}
Generated: ${new Date().toLocaleString()}

User Information:
-----------------
Username: ${selectedReport.user.username}
Email: ${selectedReport.user.email}

Input Parameters:
-----------------
Production Line: ${selectedReport.input_parameters.production_line}
Temperature: ${selectedReport.input_parameters.temperature}°C
Pressure: ${selectedReport.input_parameters.pressure} Pa
Feed Rate: ${selectedReport.input_parameters.feed_rate} kg/h
Power Consumption: ${selectedReport.input_parameters.power_consumption} kWh
Anode Effect: ${selectedReport.input_parameters.anode_effect}
Bath Ratio: ${selectedReport.input_parameters.bath_ratio}
Alumina Concentration: ${selectedReport.input_parameters.alumina_concentration}%

Prediction Results:
-------------------
Predicted Output: ${selectedReport.predictions.predicted_output.toFixed(2)} kg
Energy Efficiency: ${selectedReport.predictions.energy_efficiency.toFixed(2)}%
Output Quality: ${selectedReport.predictions.output_quality.toFixed(2)}

${selectedReport.admin_signature}

=============================
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${selectedReport.prediction_id}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setSuccess('Report downloaded successfully');
    setTimeout(() => setSuccess(''), 3000);
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
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Prediction Management</Typography>
        <IconButton onClick={fetchPredictions} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Production Line</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell align="right"><strong>Output (kg)</strong></TableCell>
              <TableCell align="right"><strong>Efficiency (%)</strong></TableCell>
              <TableCell align="right"><strong>Quality</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {predictions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">No predictions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              predictions.map((pred) => (
                <TableRow key={pred.id} hover>
                  <TableCell>{pred.id}</TableCell>
                  <TableCell>{pred.input_data?.production_line || 'N/A'}</TableCell>
                  <TableCell>
                    {pred.input_data?.created_by_username || 'Unknown'}
                  </TableCell>
                  <TableCell align="right">
                    {pred.predicted_output?.toFixed(2) || 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Box
                      component="span"
                      sx={{
                        color: pred.energy_efficiency > 15 ? 'success.main' : 'warning.main',
                        fontWeight: 'bold'
                      }}
                    >
                      {pred.energy_efficiency?.toFixed(2) || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {pred.output_quality?.toFixed(2) || 'N/A'}
                  </TableCell>
                  <TableCell>{formatDate(pred.created_at)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Mark as Paid">
                      <IconButton
                        color="primary"
                        onClick={() => handleMarkPaid(pred.id)}
                        size="small"
                      >
                        <PaymentIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Generate Report">
                      <IconButton
                        color="secondary"
                        onClick={() => handleGenerateReport(pred.id)}
                        size="small"
                      >
                        <PictureAsPdfIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Report Dialog */}
      <Dialog
        open={reportDialog}
        onClose={() => setReportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Prediction Report</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Typography variant="h6" gutterBottom>User Information</Typography>
              <Typography><strong>Username:</strong> {selectedReport.user.username}</Typography>
              <Typography><strong>Email:</strong> {selectedReport.user.email}</Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Input Parameters</Typography>
              <Typography><strong>Production Line:</strong> {selectedReport.input_parameters.production_line}</Typography>
              <Typography><strong>Temperature:</strong> {selectedReport.input_parameters.temperature}°C</Typography>
              <Typography><strong>Pressure:</strong> {selectedReport.input_parameters.pressure} Pa</Typography>
              <Typography><strong>Feed Rate:</strong> {selectedReport.input_parameters.feed_rate} kg/h</Typography>
              <Typography><strong>Power Consumption:</strong> {selectedReport.input_parameters.power_consumption} kWh</Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Prediction Results</Typography>
              <Typography><strong>Predicted Output:</strong> {selectedReport.predictions.predicted_output.toFixed(2)} kg</Typography>
              <Typography><strong>Energy Efficiency:</strong> {selectedReport.predictions.energy_efficiency.toFixed(2)}%</Typography>
              <Typography><strong>Output Quality:</strong> {selectedReport.predictions.output_quality.toFixed(2)}</Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
                {selectedReport.admin_signature}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
