import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Button,
  Container
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import RecyclingIcon from '@mui/icons-material/Recycling';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPredictions from '../components/admin/AdminPredictions';
import AdminPredictionControl from '../components/admin/AdminPredictionControl';
import AdminWasteRecommendations from '../components/admin/AdminWasteRecommendations';
import AdminInputReports from '../components/admin/AdminInputReports';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // Check if user is admin/staff
    if (!user) {
      navigate('/admin-login');
      return;
    }

    // Check if user has staff/admin privileges
    const checkAdminAccess = async () => {
      try {
        if (!user.is_staff && !user.is_superuser) {
          setError('Access denied. You must be an administrator to view this page.');
          setTimeout(() => navigate('/dashboard'), 3000);
          return;
        }
        
        // Try to access admin dashboard to verify permissions
        await api.get('/admin-panel/dashboard/');
        setLoading(false);
      } catch (err) {
        console.error('Admin access denied:', err);
        setError('Access denied. You must be an administrator to view this page.');
        setLoading(false);
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Admin Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AluOptimize Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.username} (Admin)
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
            <Tab icon={<DashboardIcon />} label="Overview" />
            <Tab icon={<PeopleIcon />} label="Users" />
            <Tab icon={<AssessmentIcon />} label="Predictions" />
            <Tab icon={<SettingsIcon />} label="Prediction Control" />
            <Tab icon={<RecyclingIcon />} label="Waste & Recommendations" />
            <Tab icon={<FindInPageIcon />} label="Reports" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AdminOverview />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdminUsers />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AdminPredictions />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <AdminPredictionControl />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <AdminWasteRecommendations />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <AdminInputReports />
        </TabPanel>
      </Container>
    </Box>
  );
}
