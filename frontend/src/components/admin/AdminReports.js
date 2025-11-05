import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import api from '../../services/api';

export default function AdminReports() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [reportType, setReportType] = React.useState('users');
  const [dateRange, setDateRange] = React.useState('all');

  const handleDownloadCSV = async () => {
    try {
      setLoading(true);
      setError('');
      
      let data = [];
      let filename = '';
      
      switch (reportType) {
        case 'users':
          const usersRes = await api.get('/admin-panel/users/');
          data = usersRes.data;
          filename = 'users_report.csv';
          
          const usersCsv = [
            ['Username', 'Email', 'Active', 'Staff', 'Joined Date'],
            ...data.map(u => [
              u.username,
              u.email,
              u.is_active ? 'Yes' : 'No',
              u.is_staff ? 'Yes' : 'No',
              new Date(u.date_joined).toLocaleString()
            ])
          ].map(row => row.join(',')).join('\\n');
          
          downloadFile(usersCsv, filename, 'text/csv');
          break;
          
        case 'predictions':
          const predsRes = await api.get('/admin-panel/predictions/');
          data = predsRes.data;
          filename = 'predictions_report.csv';
          
          const predsCsv = [
            ['ID', 'Production Line', 'User', 'Output (kg)', 'Efficiency (%)', 'Quality', 'Date'],
            ...data.map(p => [
              p.id,
              p.input_data?.production_line || 'N/A',
              p.input_data?.submitted_by?.username || 'N/A',
              p.predicted_output?.toFixed(2) || 'N/A',
              p.energy_efficiency?.toFixed(2) || 'N/A',
              p.output_quality?.toFixed(2) || 'N/A',
              new Date(p.created_at).toLocaleString()
            ])
          ].map(row => row.join(',')).join('\\n');
          
          downloadFile(predsCsv, filename, 'text/csv');
          break;
          
        case 'transactions':
          const txnsRes = await api.get('/admin-panel/transactions/');
          data = txnsRes.data;
          filename = 'transactions_report.csv';
          
          const txnsCsv = [
            ['Transaction ID', 'User', 'Type', 'Amount', 'Currency', 'Status', 'Date'],
            ...data.map(t => [
              t.transaction_id,
              t.user_username,
              t.transaction_type,
              t.amount,
              t.currency,
              t.payment_status,
              new Date(t.created_at).toLocaleString()
            ])
          ].map(row => row.join(',')).join('\\n');
          
          downloadFile(txnsCsv, filename, 'text/csv');
          break;
          
        default:
          setError('Invalid report type');
          return;
      }
      
      setSuccess('Report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For PDF, we'll create a simple text-based report
      // In production, use a library like jsPDF or pdfmake
      let content = '';
      let filename = '';
      
      switch (reportType) {
        case 'users':
          const usersRes = await api.get('/admin-panel/users/');
          const users = usersRes.data;
          filename = 'users_report.txt';
          
          content = `
AluOptimize Users Report
========================
Generated: ${new Date().toLocaleString()}

Total Users: ${users.length}
Active Users: ${users.filter(u => u.is_active).length}
Pending Users: ${users.filter(u => !u.is_active).length}

User List:
----------
${users.map((u, i) => `
${i + 1}. ${u.username}
   Email: ${u.email}
   Status: ${u.is_active ? 'Active' : 'Pending'}
   Staff: ${u.is_staff ? 'Yes' : 'No'}
   Joined: ${new Date(u.date_joined).toLocaleString()}
`).join('\\n')}
          `.trim();
          break;
          
        case 'predictions':
          const predsRes = await api.get('/admin-panel/predictions/');
          const preds = predsRes.data;
          filename = 'predictions_report.txt';
          
          content = `
AluOptimize Predictions Report
==============================
Generated: ${new Date().toLocaleString()}

Total Predictions: ${preds.length}

Prediction List:
----------------
${preds.map((p, i) => `
${i + 1}. Prediction #${p.id}
   Production Line: ${p.input_data?.production_line || 'N/A'}
   User: ${p.input_data?.submitted_by?.username || 'N/A'}
   Predicted Output: ${p.predicted_output?.toFixed(2) || 'N/A'} kg
   Energy Efficiency: ${p.energy_efficiency?.toFixed(2) || 'N/A'}%
   Quality Score: ${p.output_quality?.toFixed(2) || 'N/A'}
   Date: ${new Date(p.created_at).toLocaleString()}
`).join('\\n')}
          `.trim();
          break;
          
        case 'transactions':
          const txnsRes = await api.get('/admin-panel/transactions/');
          const txns = txnsRes.data;
          const statsRes = await api.get('/admin-panel/transactions/statistics/');
          const stats = statsRes.data;
          filename = 'transactions_report.txt';
          
          content = `
AluOptimize Transactions Report
================================
Generated: ${new Date().toLocaleString()}

Summary:
--------
Total Transactions: ${stats.total_transactions}
Total Revenue: $${stats.total_revenue.toFixed(2)}
Paid: ${stats.paid_count}
Pending: ${stats.pending_count}
Failed: ${stats.failed_count}

Transaction List:
-----------------
${txns.map((t, i) => `
${i + 1}. ${t.transaction_id}
   User: ${t.user_username} (${t.user_email})
   Type: ${t.transaction_type}
   Amount: ${t.amount} ${t.currency}
   Status: ${t.payment_status}
   Date: ${new Date(t.created_at).toLocaleString()}
`).join('\\n')}
          `.trim();
          break;
          
        default:
          setError('Invalid report type');
          return;
      }
      
      downloadFile(content, filename, 'text/plain');
      setSuccess('Report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Report Generation
      </Typography>

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

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Settings
              </Typography>
              
              <TextField
                fullWidth
                select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                margin="normal"
              >
                <MenuItem value="users">Users Report</MenuItem>
                <MenuItem value="predictions">Predictions Report</MenuItem>
                <MenuItem value="transactions">Transactions Report</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Date Range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                margin="normal"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </TextField>

              <Box mt={3} display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<TableChartIcon />}
                  onClick={handleDownloadCSV}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={20} /> : 'Download CSV'}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleDownloadPDF}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={20} /> : 'Download Report (TXT)'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Description */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Information
              </Typography>

              {reportType === 'users' && (
                <Box>
                  <Typography variant="body1" paragraph>
                    <strong>Users Report</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This report includes all registered users with their account status,
                    email addresses, staff privileges, and registration dates. Use this
                    report to track user growth and manage account approvals.
                  </Typography>
                </Box>
              )}

              {reportType === 'predictions' && (
                <Box>
                  <Typography variant="body1" paragraph>
                    <strong>Predictions Report</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This report contains all production predictions with input parameters,
                    predicted outputs, energy efficiency scores, and quality metrics.
                    Use this to analyze system performance and prediction accuracy.
                  </Typography>
                </Box>
              )}

              {reportType === 'transactions' && (
                <Box>
                  <Typography variant="body1" paragraph>
                    <strong>Transactions Report</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    This report includes all financial transactions with payment status,
                    amounts, and user information. Use this for financial tracking,
                    revenue analysis, and payment reconciliation.
                  </Typography>
                </Box>
              )}

              <Box mt={3}>
                <Typography variant="caption" color="textSecondary">
                  Note: PDF reports are currently generated as text files. For formatted
                  PDF reports with charts and graphics, please use the CSV export and
                  process it with your preferred PDF generation tool.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
