import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ProductionInputForm from '../pages/ProductionInputForm';
import Predictions from '../pages/Predictions';
import WasteManagement from '../pages/WasteManagement';
import AdminPanel from '../pages/AdminPanel';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import StaffDashboard from '../pages/StaffDashboard';
import StaffLogin from '../pages/StaffLogin';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUsers from '../components/admin/AdminUsers';
import AdminPredictions from '../components/admin/AdminPredictions';
import AdminPredictionControl from '../components/admin/AdminPredictionControl';
import AdminWasteRecommendations from '../components/admin/AdminWasteRecommendations';
import AdminInputReports from '../components/admin/AdminInputReports';
import StaffOverview from '../components/staff/StaffOverview';
import StaffUsers from '../components/staff/StaffUsers';
import StaffPredictions from '../components/staff/StaffPredictions';
import StaffWasteRecommendations from '../components/staff/StaffWasteRecommendations';
import StaffInputReports from '../components/staff/StaffInputReports';
import StaffPanel from '../components/staff/StaffPanel';

// Public route component - redirects logged-in users to their role dashboard
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  if (user) {
    const role = user.role;
    if (user.is_superuser || role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    }
    if (user.is_staff || role === 'staff') {
      return <Navigate to="/staff-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

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
            <ProtectedRoute requireUser>
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
            <ProtectedRoute requireUser>
              <WasteManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stafflogin"
          element={<StaffLogin />}
        />
        <Route
          path="/adminlogin"
          element={<AdminLogin />}
        />
        <Route
          path="/staff-dashboard"
          element={
            <ProtectedRoute requireStaff>
              <StaffDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<StaffOverview />} />
          <Route path="users" element={<StaffUsers />} />
          <Route path="predictions" element={<StaffPredictions />} />
          <Route path="reports" element={<StaffInputReports />} />
          <Route path="staff-panel" element={<StaffPanel />} />
          <Route path="waste" element={<StaffWasteRecommendations />} />
        </Route>
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="predictions" element={<AdminPredictions />} />
          <Route path="control" element={<AdminPredictionControl />} />
          <Route path="waste" element={<AdminWasteRecommendations />} />
          <Route path="reports" element={<AdminInputReports />} />
        </Route>
        <Route
          path="/admin-panel"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
