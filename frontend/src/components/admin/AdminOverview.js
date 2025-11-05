import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../../services/api';

export default function AdminOverview() {
  const [stats, setStats] = React.useState(null);
  const [transactionStats, setTransactionStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [dashboardRes, transactionRes] = await Promise.all([
        api.get('/admin-panel/dashboard/'),
        api.get('/admin-panel/transactions/statistics/')
      ]);
      setStats(dashboardRes.data);
      setTransactionStats(transactionRes.data);
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
      <Typography variant="h5" gutterBottom>
        System Overview
      </Typography>

      <Grid container spacing={3}>
        {/* User Stats */}
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

        {/* Transaction Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2">Total Revenue</Typography>
                  <Typography variant="h4" color="white" fontWeight="bold">
                    ${transactionStats?.total_revenue?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                <AttachMoneyIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Paid Transactions</Typography>
              <Typography variant="h5" color="success.main">
                {transactionStats?.paid_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Pending Payments</Typography>
              <Typography variant="h5" color="warning.main">
                {transactionStats?.pending_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="textSecondary">Failed Transactions</Typography>
              <Typography variant="h5" color="error.main">
                {transactionStats?.failed_count || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
