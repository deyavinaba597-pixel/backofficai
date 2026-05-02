import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Invoices } from './pages/Invoices';
import { Expenses } from './pages/Expenses';
import { Payroll } from './pages/Payroll';
import { Vendors } from './pages/Vendors';
import { Policies } from './pages/Policies';
import { AgentLogs } from './pages/AgentLogs';
import { Analytics } from './pages/Analytics';
import { AuditLog } from './pages/AuditLog';
import { useAuthStore } from './store/authStore';

function App() {
  const { initialize, isInitialized, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing page for unauthenticated users */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
      />

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Protected app routes */}
      <Route path="/" element={user ? <Layout /> : <Navigate to="/" replace />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="policies" element={<Policies />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="agent" element={<AgentLogs />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export default App;
