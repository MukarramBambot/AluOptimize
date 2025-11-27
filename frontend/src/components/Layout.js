import React from 'react';
import { Container, AppBar, Toolbar, Typography, Box, Button, Alert } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '../context/AuthContext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Role helpers
  const isAdmin = !!(user && (user.is_superuser || user.role === 'admin'));
  const isStaff = !!(user && !isAdmin && (user.is_staff || user.role === 'staff'));

  return (
    <Box>
      {/* Role Banner - Show when staff/admin is logged in */}
      {(isAdmin || isStaff) && (
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
          {isAdmin ? '🧠 Logged in as Administrator' : '🛠 Logged in as Staff'}
        </Alert>
      )}

      {/* Navigation Bar */}
      <AppBar
        position="static"
        sx={{
          // Orange navbar for staff/admin, blue for regular users
          bgcolor: (isAdmin || isStaff) ? '#1976d2' : 'primary.main'
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to={isAdmin ? "/admin-dashboard" : isStaff ? "/staff-dashboard" : "/"}
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: (isAdmin || isStaff) ? 'bold' : 'normal'
            }}
          >
            {isAdmin ? '⚙️ AluOptimize Admin' : isStaff ? '🛠 AluOptimize Staff' : 'AluOptimize'}
          </Typography>

          {user ? (
            <>
              {/* Admin/Staff Navigation - Show ONLY when privileged */}
              {isAdmin || isStaff ? (
                <>
                  {/* Clean staff/admin interface - only Logout button */}
                  <Button
                    color="inherit"
                    onClick={() => logout(isAdmin ? 'admin' : 'staff')}
                    startIcon={<LogoutIcon />}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  {/* User Navigation - Show ONLY when user is NOT admin */}
                  <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
                  <Button color="inherit" component={Link} to="/inputs">Inputs</Button>
                  <Button color="inherit" component={Link} to="/predictions">Predictions</Button>
                  <Button color="inherit" component={Link} to="/waste">Waste</Button>

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
