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
  TextField,
  MenuItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';
import api from '../../services/api';

export default function AdminPayments() {
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');

  React.useEffect(() => {
    fetchTransactions();
  }, [filterStatus]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.get('/admin-panel/transactions/', { params });
      setTransactions(response.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (transactionId) => {
    try {
      setError('');
      await api.post(`/admin-panel/transactions/${transactionId}/mark_paid/`);
      setSuccess('Transaction marked as paid');
      fetchTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking as paid:', err);
      setError('Failed to mark transaction as paid');
    }
  };

  const handleRefund = async (transactionId) => {
    if (!window.confirm('Are you sure you want to refund this transaction?')) {
      return;
    }

    try {
      setError('');
      await api.post(`/admin-panel/transactions/${transactionId}/refund/`);
      setSuccess('Transaction refunded successfully');
      fetchTransactions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error refunding transaction:', err);
      setError(err.response?.data?.error || 'Failed to refund transaction');
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
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
        <Typography variant="h6">Payment Management</Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Transactions</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
          </TextField>
          <IconButton onClick={fetchTransactions} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
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
              <TableCell><strong>Transaction ID</strong></TableCell>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Method</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">No transactions found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {txn.transaction_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{txn.user_username}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {txn.user_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={txn.transaction_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {txn.amount} {txn.currency}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={txn.payment_status}
                      color={getStatusColor(txn.payment_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{txn.payment_method || 'N/A'}</TableCell>
                  <TableCell>{formatDate(txn.created_at)}</TableCell>
                  <TableCell align="center">
                    {txn.payment_status === 'pending' && (
                      <Tooltip title="Mark as Paid">
                        <IconButton
                          color="success"
                          onClick={() => handleMarkPaid(txn.id)}
                          size="small"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {txn.payment_status === 'paid' && (
                      <Tooltip title="Refund">
                        <IconButton
                          color="warning"
                          onClick={() => handleRefund(txn.id)}
                          size="small"
                        >
                          <UndoIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
