import React from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = React.useContext(AuthContext);

  // Helper to check if user has role (for future custom user model)
  const hasRole = (roles) => {
    if (!user) return false;
    if (user.is_superuser || user.is_staff) return true;
    if (user.role) return roles.includes(user.role);
    return true; // Default: show to all authenticated users
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            AluOptimize
          </Typography>
          {user ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
              <Button color="inherit" component={Link} to="/inputs">Inputs</Button>
              <Button color="inherit" component={Link} to="/predictions">Predictions</Button>
              <Button color="inherit" component={Link} to="/waste">Waste</Button>
              <Button color="inherit" component={Link} to="/recommendations">Recommendations</Button>
              {(user.is_staff || user.is_superuser) && (
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/admin-panel"
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  Admin Panel
                </Button>
              )}
              <Button color="inherit" onClick={logout}>Logout</Button>
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
