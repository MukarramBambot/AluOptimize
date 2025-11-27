import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, requireStaff = false, requireUser = false }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  const role = user?.role;
  const isAdmin = !!(user?.is_superuser || role === 'admin');
  const isStaff = !!(!isAdmin && (user?.is_staff || role === 'staff'));
  const isRegularUser = !!user && !isAdmin && !isStaff;

  if (!isAuthenticated) {
    // Redirect to the correct login page based on route requirement
    if (requireAdmin) return <Navigate to="/adminlogin" replace />;
    if (requireStaff) return <Navigate to="/stafflogin" replace />;
    return <Navigate to="/login" replace />;
  }

  // Admin-only routes: only true admins should see these
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/adminlogin" replace />;
  }

  // Staff routes: allow only staff (not admins)
  if (requireStaff && !isStaff) {
    // If admin hits a staff-only route, send to admin dashboard
    if (isAdmin) return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // User routes: only regular (non-staff, non-admin) users
  if (requireUser && !isRegularUser) {
    if (isAdmin) return <Navigate to="/admin-dashboard" replace />;
    if (isStaff) return <Navigate to="/staff-dashboard" replace />;
  }

  return children;
}

