import React from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Button, Alert } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function Layout({ children }) {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();

  // Check if user is admin
  const isAdmin = user && (user.is_staff || user.is_superuser);
  
  // Check if currently on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <Box>
      {/* Admin Banner - Show when admin is logged in */}
      {isAdmin && (
        <Alert 
          icon={<AdminPanelSettingsIcon />}
          severity="info" 
          sx={{ 
            borderRadius: 0,
            justifyContent: 'center',
            '& .MuiAlert-message': {
              fontWeight: 'bold'
            }
          }}
        >
          🧠 Logged in as Administrator
        </Alert>
      )}

      {/* Navigation Bar */}
      <AppBar 
        position="static"
        sx={{
          // Darker color for admin navbar when admin is logged in
          bgcolor: isAdmin ? '#1a237e' : 'primary.main'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component={Link} 
            to={isAdmin ? "/admin-dashboard" : "/"} 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: isAdmin ? 'bold' : 'normal'
            }}
          >
            {isAdmin ? '⚙️ AluOptimize Admin' : 'AluOptimize'}
          </Typography>
          
          {user ? (
            <>
              {/* Admin Navigation - Show ONLY when user is admin */}
              {isAdmin ? (
                <>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin-dashboard"
                    sx={{ 
                      fontWeight: location.pathname === '/admin-dashboard' ? 'bold' : 'normal',
                      textDecoration: location.pathname === '/admin-dashboard' ? 'underline' : 'none'
                    }}
                  >
                    Admin Dashboard
                  </Button>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin-dashboard"
                    sx={{ 
                      fontWeight: 'normal'
                    }}
                  >
                    Prediction Control
                  </Button>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin-dashboard"
                    sx={{ 
                      fontWeight: 'normal'
                    }}
                  >
                    User Management
                  </Button>
                  <Button color="inherit" onClick={logout}>Logout</Button>
                </>
              ) : (
                <>
                  {/* User Navigation - Show ONLY when user is NOT admin */}
                  <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
                  <Button color="inherit" component={Link} to="/inputs">Inputs</Button>
                  <Button color="inherit" component={Link} to="/predictions">Predictions</Button>
                  <Button color="inherit" component={Link} to="/waste">Waste</Button>
                  <Button color="inherit" component={Link} to="/recommendations">Recommendations</Button>
                  
                  {/* No "Switch to Admin View" button for regular users */}
                  
                  <Button color="inherit" onClick={logout}>Logout</Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">Login</Button>
              <Button color="inherit" component={Link} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 3 }}>{children}</Container>
    </Box>
  );
}
