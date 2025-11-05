import React from 'react';
import Layout from '../components/Layout';
import { 
  Typography, 
  Box, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent,
  CardActionArea,
  Divider,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DeleteIcon from '@mui/icons-material/Delete';
import RecommendIcon from '@mui/icons-material/Recommend';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import RecyclingIcon from '@mui/icons-material/Recycling';

export default function Home() {
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  const features = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon sx={{ fontSize: 48, color: '#1976d2' }} />,
      description: 'Real-time analytics and comprehensive overview of production metrics',
      link: '/dashboard',
      requiresAuth: true
    },
    {
      title: 'Predictions',
      icon: <ShowChartIcon sx={{ fontSize: 48, color: '#2e7d32' }} />,
      description: 'AI-powered predictions for output, quality, and efficiency',
      link: '/predictions',
      requiresAuth: true
    },
    {
      title: 'Waste Management',
      icon: <DeleteIcon sx={{ fontSize: 48, color: '#ed6c02' }} />,
      description: 'Track and manage waste with intelligent reuse suggestions',
      link: '/waste',
      requiresAuth: true
    },
    {
      title: 'Recommendations',
      icon: <RecommendIcon sx={{ fontSize: 48, color: '#9c27b0' }} />,
      description: 'Get AI-generated optimization recommendations',
      link: '/recommendations',
      requiresAuth: true
    }
  ];

  const benefits = [
    { icon: <SpeedIcon />, text: 'Increase Production Efficiency' },
    { icon: <CheckCircleIcon />, text: 'Improve Output Quality' },
    { icon: <RecyclingIcon />, text: 'Reduce Waste & Costs' }
  ];

  const handleFeatureClick = (feature) => {
    if (feature.requiresAuth && !user) {
      navigate('/login');
    } else {
      navigate(feature.link);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Welcome to AluOptimize
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4, opacity: 0.95 }}>
            Optimize Aluminum Production with Machine Learning
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 4, maxWidth: 800, mx: 'auto', opacity: 0.9 }}>
            Transform your aluminum production with AI-powered insights, predictive analytics, 
            and intelligent waste management solutions.
          </Typography>

          {user ? (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{ 
                  mr: 2, 
                  bgcolor: 'white', 
                  color: '#667eea',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/login')}
                sx={{ 
                  mr: 2, 
                  bgcolor: 'white', 
                  color: '#667eea',
                  '&:hover': { bgcolor: '#f5f5f5' }
                }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      {/* Why AluOptimize Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
            Why AluOptimize?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            AluOptimize combines cutting-edge machine learning with industry expertise to deliver 
            actionable insights that drive measurable improvements in your aluminum production process.
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {benefits.map((benefit, index) => (
              <Grid item key={index}>
                <Chip
                  icon={benefit.icon}
                  label={benefit.text}
                  color="primary"
                  variant="outlined"
                  sx={{ py: 2.5, px: 1, fontSize: '0.95rem' }}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Features Overview Section */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
            Features Overview
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Explore our comprehensive suite of tools designed to optimize every aspect of aluminum production
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                elevation={3}
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleFeatureClick(feature)}
                  sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <Box mb={2}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold" textAlign="center">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    {feature.description}
                  </Typography>
                  {feature.requiresAuth && !user && (
                    <Chip 
                      label="Login Required" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 2 }}
                    />
                  )}
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        {!user && (
          <Box 
            textAlign="center" 
            mt={8} 
            py={6} 
            px={4}
            sx={{ 
              bgcolor: '#f5f5f5', 
              borderRadius: 2,
              border: '2px solid #e0e0e0'
            }}
          >
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Ready to Optimize Your Production?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3 }}>
              Join AluOptimize today and start leveraging AI to improve efficiency, 
              reduce waste, and maximize output quality.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ mr: 2 }}
            >
              Get Started Free
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </Box>
        )}
      </Container>
    </Layout>
  );
}
