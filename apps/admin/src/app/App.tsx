import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@proxmox-reseller/auth';
import { LoadingSpinner, LoginPage } from '@proxmox-reseller/ui';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { UsersPage } from '../features/users/UsersPage';
import { NodesPage } from '../features/nodes/NodesPage';
import { BillingPage } from '../features/billing/BillingPage';
import { SettingsPage } from '../features/settings/SettingsPage';

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, login, error } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8rem' }}>
        <LoadingSpinner label="Authenticating…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        title="☁️ Proxmox Cloud Admin Console"
        subtitle="Sign in with your administrator account"
        onLogin={login}
        error={error}
      />
    );
  }

  if (!user?.roles.includes('admin')) {
    return (
      <div style={{ textAlign: 'center', marginTop: '8rem' }}>
        <h2>Access Denied</h2>
        <p>You do not have administrator privileges.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <RequireAdmin>
        <AdminLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AdminLayout>
      </RequireAdmin>
    </BrowserRouter>
  );
}
