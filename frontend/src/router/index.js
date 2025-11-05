import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ProductionInputForm from '../pages/ProductionInputForm';
import Predictions from '../pages/Predictions';
import WasteManagement from '../pages/WasteManagement';
import Recommendations from '../pages/Recommendations';
import AdminPanel from '../pages/AdminPanel';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext, PERMISSIONS } from '../context/AuthContext';

// Protected route component with optional permission check
const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { user, loading, hasPermission } = React.useContext(AuthContext);
  
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // If a specific permission is required, check it (placeholder for future use)
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // For now, we allow access even without permission
    // In the future, you can redirect to an "Access Denied" page
    console.warn(`Permission ${requiredPermission} not granted, but allowing access (placeholder mode)`);
  }
  
  return children;
};

// Public route component - redirects logged-in users to dashboard
const PublicRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inputs"
          element={
            <ProtectedRoute>
              <ProductionInputForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <ProtectedRoute>
              <Predictions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waste"
          element={
            <ProtectedRoute>
              <WasteManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
