import React from 'react';
import Layout from '../components/Layout';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

import AdminDashboard from '../components/admin/AdminDashboard';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPredictions from '../components/admin/AdminPredictions';

const API_BASE_URL = "http://127.0.0.1:8000";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminPanel() {
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // Check if user is admin/staff
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user has staff/admin privileges
    const checkAdminAccess = async () => {
      try {
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

  if (loading) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Panel
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Manage users, predictions, and system data
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<DashboardIcon />} label="Dashboard" />
            <Tab icon={<PeopleIcon />} label="User Management" />
            <Tab icon={<AssessmentIcon />} label="Predictions" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AdminDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AdminUsers />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <AdminPredictions />
        </TabPanel>
      </Card>
    </Layout>
  );
}
