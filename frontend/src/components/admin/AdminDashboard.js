import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin-panel/dashboard/');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2">Total Users</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.users?.total || 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2">Pending Approval</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.users?.pending || 0}
                  </Typography>
                </Box>
                <PendingActionsIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2">Active Users</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.users?.active || 0}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2">Total Predictions</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    {stats?.predictions?.total || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Registrations</Typography>
              {stats?.recent_activity?.users?.length > 0 ? (
                <List>
                  {stats.recent_activity.users.map((user) => (
                    <ListItem key={user.id}>
                      <ListItemText
                        primary={user.username}
                        secondary={user.email}
                      />
                      <Chip
                        label={user.is_active ? 'Active' : 'Pending'}
                        color={user.is_active ? 'success' : 'warning'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">No recent users</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Predictions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Predictions</Typography>
              {stats?.recent_activity?.predictions?.length > 0 ? (
                <List>
                  {stats.recent_activity.predictions.map((pred) => (
                    <ListItem key={pred.id}>
                      <ListItemText
                        primary={`${pred.input_data?.production_line || 'N/A'} - ${pred.predicted_output?.toFixed(2)} kg`}
                        secondary={`Efficiency: ${pred.energy_efficiency?.toFixed(2)}%`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">No recent predictions</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
