import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

/**
 * StaffProtectedRoute - Route guard for staff-only pages
 * Ensures only users with role='staff' (or is_staff=True but not superuser) can access
 */
export default function StaffProtectedRoute({ children }) {
    const { user, loading } = React.useContext(AuthContext);

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

    // Not logged in - redirect to staff login
    if (!user) {
        return <Navigate to="/stafflogin" replace />;
    }

    const role = user.role;
    // Check if user is staff
    // We can check role === 'staff' OR (is_staff && not superuser)
    const isStaff = role === 'staff' || (user.is_staff && !user.is_superuser);
    const isAdmin = user.is_superuser || role === 'admin';

    if (!isStaff && !isAdmin) {
        console.warn('Non-staff user attempted to access staff route:', user.username);
        // If normal user, redirect to user dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
