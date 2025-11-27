import React from 'react';
import {
    Box,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Container
} from '@mui/material';
import Button from '../components/ui/Button';
import BadgeIcon from '@mui/icons-material/Badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffLogin() {
    const navigate = useNavigate();
    const { login, user } = useAuth();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [formData, setFormData] = React.useState({
        username: '',
        password: ''
    });

    React.useEffect(() => {
        // Redirect if already logged in
        if (user) {
            if (user.is_staff && !user.is_superuser) {
                navigate('/staff-dashboard');
            } else if (user.is_superuser) {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(formData.username.trim(), formData.password);

            if (!result.success) {
                setError(result.error || 'Invalid username or password');
                return;
            }

            const loggedInUser = result.user;
            const role = loggedInUser.role;

            // Redirect based on user role
            if (loggedInUser.is_superuser || role === 'admin') {
                navigate('/admin-dashboard');
            } else if (loggedInUser.is_staff || role === 'staff') {
                navigate('/staff-dashboard');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            console.error('Staff login error:', err);
            setError(err.error || err.detail || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                        <BadgeIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom>
                            Staff Login
                        </Typography>
                        <Typography variant="body2" color="textSecondary" align="center">
                            Sign in with your staff credentials
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            margin="normal"
                            required
                            disabled={loading}
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            disabled={loading}
                        />
                        <Box mt={3}>
                            <Button type="submit" disabled={loading} fullWidth color="secondary">
                                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In as Staff'}
                            </Button>
                        </Box>
                    </form>

                    <Box mt={2} textAlign="center">
                        <Typography variant="body2" color="textSecondary">
                            <Button
                                variant="text"
                                onClick={() => navigate('/login')}
                                sx={{ textTransform: 'none' }}
                            >
                                User Login
                            </Button>
                            {' | '}
                            <Button
                                variant="text"
                                onClick={() => navigate('/adminlogin')}
                                sx={{ textTransform: 'none' }}
                            >
                                Admin Login
                            </Button>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
