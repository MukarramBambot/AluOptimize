import React from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import api from '../../services/api';

export default function StaffOverview() {
    const [stats, setStats] = React.useState({
        total_users: 0,
        pending_requests: 0,
        total_predictions: 0,
        avg_efficiency: 0
    });
    const [recentActivity, setRecentActivity] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/staff/dashboard/');

            if (response.data) {
                setStats(response.data.stats || {
                    total_users: 0,
                    pending_requests: 0,
                    total_predictions: 0,
                    avg_efficiency: 0
                });
                setRecentActivity(response.data.recent_activity || []);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
            // Set default values on error
            setStats({
                total_users: 0,
                pending_requests: 0,
                total_predictions: 0,
                avg_efficiency: 0
            });
            setRecentActivity([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Staff Dashboard Overview
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="white" variant="body2" gutterBottom>
                                        Total Users
                                    </Typography>
                                    <Typography variant="h4" color="white" fontWeight="bold">
                                        {stats.total_users || 0}
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
                                    <Typography color="white" variant="body2" gutterBottom>
                                        Pending Requests
                                    </Typography>
                                    <Typography variant="h4" color="white" fontWeight="bold">
                                        {stats.pending_requests || 0}
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
                                    <Typography color="white" variant="body2" gutterBottom>
                                        Total Predictions
                                    </Typography>
                                    <Typography variant="h4" color="white" fontWeight="bold">
                                        {stats.total_predictions || 0}
                                    </Typography>
                                </Box>
                                <AssessmentIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="white" variant="body2" gutterBottom>
                                        Avg Efficiency
                                    </Typography>
                                    <Typography variant="h4" color="white" fontWeight="bold">
                                        {stats.avg_efficiency ? `${Number(stats.avg_efficiency).toFixed(1)}%` : '0%'}
                                    </Typography>
                                </Box>
                                <SpeedIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Activity Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Recent Activity
                    </Typography>

                    {recentActivity.length === 0 ? (
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                            <Typography color="textSecondary">
                                No recent activity to display
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Type</strong></TableCell>
                                        <TableCell><strong>Description</strong></TableCell>
                                        <TableCell><strong>User</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Date</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentActivity.map((activity) => (
                                        <TableRow key={activity.id} hover>
                                            <TableCell>{activity.id}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={activity.type || 'N/A'}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{activity.description || 'N/A'}</TableCell>
                                            <TableCell>{activity.user || 'Unknown'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={activity.status || 'N/A'}
                                                    size="small"
                                                    color={getStatusColor(activity.status)}
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(activity.date)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
