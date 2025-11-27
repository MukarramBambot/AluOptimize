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
    Chip,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RecyclingIcon from '@mui/icons-material/Recycling';
import api from '../../services/api';

export default function StaffWasteRecommendations() {
    const [recommendations, setRecommendations] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [statistics, setStatistics] = React.useState(null);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch staff waste recommendations
            const resp = await api.get('/staff/waste/recommendations/');
            const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
            setRecommendations(data);

            // Calculate statistics
            const stats = {
                total: data.length,
                // Ensure numeric aggregation even if API returns strings
                totalWaste: data.reduce(
                    (sum, rec) => sum + Number(rec.waste_record?.waste_amount ?? 0),
                    0
                ),
                totalSavings: data.reduce(
                    (sum, rec) => sum + Number(rec.estimated_savings ?? 0),
                    0
                ),
                reusable: data.filter(rec => !!rec.waste_record?.reuse_possible).length
            };
            setStatistics(stats);

        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError('Failed to load waste recommendations');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchRecommendations();
    }, []);

    const getStatusColor = (status) => {
        if (!status) return 'default';
        switch (status.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'processing':
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1}>
                    <RecyclingIcon color="primary" />
                    <Typography variant="h5">Waste & Recommendations</Typography>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton onClick={fetchRecommendations} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            {statistics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Total Recommendations
                                </Typography>
                                <Typography variant="h4">{statistics.total}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Total Waste
                                </Typography>
                                <Typography variant="h4">{Number(statistics.totalWaste || 0).toFixed(2)} kg</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Potential Savings
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    ${statistics.totalSavings.toFixed(2)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom variant="body2">
                                    Reusable Waste
                                </Typography>
                                <Typography variant="h4" color="info.main">
                                    {statistics.reusable}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Recommendations Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>User</strong></TableCell>
                            <TableCell><strong>Production Line</strong></TableCell>
                            <TableCell><strong>Waste Amount</strong></TableCell>
                            <TableCell><strong>Waste Type</strong></TableCell>
                            <TableCell><strong>Reusable</strong></TableCell>
                            <TableCell><strong>Est. Savings</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recommendations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography color="textSecondary">No waste recommendations found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            recommendations.map((rec) => {
                                const wasteRecord = rec.waste_record;
                                const user =
                                    wasteRecord?.created_by_username ||
                                    wasteRecord?.submitted_by_username ||
                                    'N/A';

                                return (
                                    <TableRow key={rec.id}>
                                        <TableCell>{rec.id}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{user}</Typography>
                                        </TableCell>
                                        <TableCell>{wasteRecord?.production_line || 'N/A'}</TableCell>
                                        <TableCell>
                                            {wasteRecord?.waste_amount != null
                                                ? `${Number(wasteRecord.waste_amount).toFixed(2)} ${wasteRecord.unit || 'kg'}`
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell>{wasteRecord?.waste_type || 'N/A'}</TableCell>
                                        <TableCell>
                                            {wasteRecord?.reuse_possible ? (
                                                <Chip label="Yes" color="success" size="small" />
                                            ) : (
                                                <Chip label="No" color="default" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            ${rec.estimated_savings ? Number(rec.estimated_savings).toFixed(2) : '0.00'}
                                        </TableCell>
                                        <TableCell>
                                            {wasteRecord?.date_recorded
                                                ? new Date(wasteRecord.date_recorded).toLocaleDateString()
                                                : rec.date
                                                    ? new Date(rec.date).toLocaleDateString()
                                                    : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Detailed View */}
            {recommendations.length > 0 && (
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom>
                        Recommendation Details
                    </Typography>
                    <Grid container spacing={2}>
                        {recommendations.map((rec) => (
                            <Grid item xs={12} key={rec.id}>
                                <Card>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                            <Typography variant="h6">
                                                Recommendation #{rec.id}
                                            </Typography>
                                            {rec.estimated_savings && (
                                                <Chip
                                                    label={`Savings: $${parseFloat(rec.estimated_savings).toFixed(2)}`}
                                                    color="success"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                        <Box bgcolor="grey.50" p={2} borderRadius={1}>
                                            <Typography variant="body2">
                                                {rec.recommendation_text}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
}
