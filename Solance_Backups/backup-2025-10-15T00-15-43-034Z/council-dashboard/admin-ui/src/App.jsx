import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthProvider';
import LoginForm from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import AuditLogViewer from './components/AuditLogViewer';
import OnboardingWizard from './components/OnboardingWizard';
import OperatorPanel from './components/OperatorPanel';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/onboard" element={<PrivateRoute role="admin"><OnboardingWizard /></PrivateRoute>} />
          <Route path="/operator" element={<PrivateRoute role="operator"><OperatorPanel /></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute role="admin"><AuditLogViewer /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
