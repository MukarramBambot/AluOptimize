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
  Container,
  Tooltip,
  IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import RecyclingIcon from '@mui/icons-material/Recycling';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext, useAuth } from '../context/AuthContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';


export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  // Determine active tab based on current path
  const getTabValue = () => {
    const path = location.pathname.split('/').pop();
    switch (path) {
      case 'overview': return 0;
      case 'predictions': return 1; // Admin Panel
      case 'control': return 2;
      case 'users': return 3;
      case 'reports': return 4;
      case 'waste': return 5;
      default: return 0;
    }
  };

  const [tabValue, setTabValue] = React.useState(getTabValue());

  React.useEffect(() => {
    setTabValue(getTabValue());
  }, [location.pathname]);

  React.useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is admin (staff OR superuser)
    if (!user.is_staff && !user.is_superuser) {
      setError('Access denied. Admins only.');
      setTimeout(() => navigate('/dashboard'), 3000);
      return;
    }

    setLoading(false);
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    switch (newValue) {
      case 0: navigate('overview'); break;
      case 1: navigate('predictions'); break;
      case 2: navigate('control'); break;
      case 3: navigate('users'); break;
      case 4: navigate('reports'); break;
      case 5: navigate('waste'); break;
      default: navigate('overview');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Minimal Header with Tabs and Logout Icon */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            textColor="secondary"
            indicatorColor="secondary"
            sx={{ flexGrow: 1 }}
          >
            <Tab icon={<DashboardIcon />} label="Overview" iconPosition="start" />
            <Tab icon={<AssessmentIcon />} label="Admin Panel" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="Prediction Control" iconPosition="start" />
            <Tab icon={<PeopleIcon />} label="User Management" iconPosition="start" />
            <Tab icon={<FindInPageIcon />} label="Reports" iconPosition="start" />
            <Tab icon={<RecyclingIcon />} label="Waste Recommendations" iconPosition="start" />
          </Tabs>

          <Tooltip title="Logout">
            <IconButton onClick={() => logout('admin')} color="primary">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {/* Render the active nested route */}
        <Box sx={{ minHeight: 400 }}>
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
}
