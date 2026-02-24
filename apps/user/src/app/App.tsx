import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@proxmox-reseller/auth';
import { LoadingSpinner } from '@proxmox-reseller/ui';
import { UserLayout } from '../layouts/UserLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { InstancesPage } from '../features/instances/InstancesPage';
import { StoragePage } from '../features/storage/StoragePage';
import { NetworkPage } from '../features/network/NetworkPage';
import { BillingPage } from '../features/billing/BillingPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8rem' }}>
        <LoadingSpinner label="Authenticating…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    login();
    return null;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <RequireAuth>
        <UserLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/instances" element={<InstancesPage />} />
            <Route path="/storage" element={<StoragePage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/billing" element={<BillingPage />} />
          </Routes>
        </UserLayout>
      </RequireAuth>
    </BrowserRouter>
  );
}
