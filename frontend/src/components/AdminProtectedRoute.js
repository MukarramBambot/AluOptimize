import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * AdminProtectedRoute - Route guard for admin-only pages
 * Ensures only users with is_staff or is_superuser can access admin routes
 */
export default function AdminProtectedRoute({ children }) {
    const { user, loading } = React.useContext(AuthContext);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Not logged in - redirect to admin login
    if (!user) {
        return <Navigate to="/adminlogin" replace />;
    }

    // Logged in but not admin - redirect to regular login with message
    if (!user.is_staff && !user.is_superuser) {
        console.warn('Non-admin user attempted to access admin route:', user.username);
        return <Navigate to="/login" replace />;
    }

    // User is admin - allow access
    return children;
}
