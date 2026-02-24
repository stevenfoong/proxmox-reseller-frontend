import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@proxmox-reseller/auth';
import { App } from './app/App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const oidcConfig = {
  authority: import.meta.env['VITE_OIDC_AUTHORITY'] as string,
  clientId: import.meta.env['VITE_OIDC_CLIENT_ID'] as string,
  redirectUri: import.meta.env['VITE_OIDC_REDIRECT_URI'] as string,
  postLogoutRedirectUri: window.location.origin,
  scope: 'openid profile email',
};

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AuthProvider config={oidcConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
);
