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
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import api from '../../services/api';
import { AuthContext, useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('all');

  // Create User Modal State
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createData, setCreateData] = React.useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

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

  const handleCreateOpen = () => {
    setCreateData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setOpenCreateModal(true);
  };

  const handleCreateClose = () => {
    setOpenCreateModal(false);
  };

  const handleCreateChange = (e) => {
    setCreateData({
      ...createData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateSubmit = async () => {
    if (!createData.username || !createData.email || !createData.password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreateLoading(true);
      setError('');
      await api.post('/admin-panel/users/create/', createData);
      setSuccess(`User ${createData.username} created successfully`);
      setOpenCreateModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateLoading(false);
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

  const isSuperAdmin = currentUser?.is_superuser || currentUser?.role === 'admin';

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

          {isSuperAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateOpen}
            >
              Create User
            </Button>
          )}

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
              <TableCell><strong>Role</strong></TableCell>
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
                    <Chip
                      label={user.role ? user.role.toUpperCase() : (user.is_superuser ? 'ADMIN' : (user.is_staff ? 'STAFF' : 'USER'))}
                      color={user.role === 'admin' || user.is_superuser ? 'error' : (user.role === 'staff' || user.is_staff ? 'primary' : 'default')}
                      size="small"
                    />
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

      {/* Create User Dialog */}
      <Dialog open={openCreateModal} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Username"
              name="username"
              value={createData.username}
              onChange={handleCreateChange}
              fullWidth
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={createData.email}
              onChange={handleCreateChange}
              fullWidth
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={createData.password}
              onChange={handleCreateChange}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={createData.role}
                onChange={handleCreateChange}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose} color="inherit">Cancel</Button>
          <Button
            onClick={handleCreateSubmit}
            color="primary"
            variant="contained"
            disabled={createLoading}
          >
            {createLoading ? <CircularProgress size={24} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
