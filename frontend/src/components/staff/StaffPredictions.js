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
    Typography,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../services/api';

export default function StaffPredictions() {
    const [predictions, setPredictions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/staff/predictions/');
            const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
            setPredictions(data);
        } catch (err) {
            console.error('Error fetching predictions:', err);
            setError('Failed to load predictions');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPredictions();
    }, []);

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
                <Typography variant="h6">All Predictions</Typography>
                <Tooltip title="Refresh">
                    <IconButton onClick={fetchPredictions} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
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
                            <TableCell><strong>Status</strong></TableCell>
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
                                    <TableCell>
                                        <Chip
                                            label={pred.status || 'Completed'}
                                            color="success"
                                            size="small"
                                        />
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
