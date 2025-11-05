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
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [selectedUsers, setSelectedUsers] = React.useState([]);

  React.useEffect(() => {
    fetchUsers();
  }, [filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.get('/admin-panel/users/', { params });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      setError('');
      await api.post(`/admin-panel/users/${userId}/approve/`);
      setSuccess('User approved successfully');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      setError('');
      await api.post(`/admin-panel/users/${userId}/reject/`);
      setSuccess('User deactivated successfully');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Failed to deactivate user');
    }
  };

  const handleBulkApprove = async () => {
    try {
      setError('');
      const pendingUserIds = users.filter(u => !u.is_active).map(u => u.id);
      
      if (pendingUserIds.length === 0) {
        setError('No pending users to approve');
        return;
      }

      await api.post('/admin-panel/users/bulk_approve/', { user_ids: pendingUserIds });
      setSuccess(`${pendingUserIds.length} user(s) approved successfully`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error bulk approving users:', err);
      setError('Failed to approve users');
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
        <Typography variant="h6">User Management</Typography>
        <Box display="flex" gap={2}>
          <TextField
            select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Users</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="active">Active</MenuItem>
          </TextField>
          <Button
            variant="contained"
            color="success"
            onClick={handleBulkApprove}
            disabled={users.filter(u => !u.is_active).length === 0}
          >
            Approve All Pending
          </Button>
          <IconButton onClick={fetchUsers} color="primary">
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
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Staff</strong></TableCell>
              <TableCell><strong>Joined</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Pending'}
                      color={user.is_active ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.is_staff && <Chip label="Staff" color="primary" size="small" />}
                  </TableCell>
                  <TableCell>{formatDate(user.date_joined)}</TableCell>
                  <TableCell align="center">
                    {!user.is_active ? (
                      <Tooltip title="Approve User">
                        <IconButton
                          color="success"
                          onClick={() => handleApprove(user.id)}
                          size="small"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Deactivate User">
                        <IconButton
                          color="error"
                          onClick={() => handleReject(user.id)}
                          size="small"
                        >
                          <CancelIcon />
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
