import React from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { buildOidcConfig, type OidcAppConfig } from './config';

interface AuthProviderProps {
  config: OidcAppConfig;
  children: React.ReactNode;
}

/**
 * AuthProvider wraps react-oidc-context's AuthProvider with the platform's
 * standard OIDC configuration. Mount this at the root of both the admin and
 * user apps.
 */
export function AuthProvider({ config, children }: AuthProviderProps) {
  const oidcConfig = buildOidcConfig(config);

  return (
    <OidcAuthProvider
      {...oidcConfig}
      onSigninCallback={() => {
        // Remove OIDC query params from the browser URL after successful login
        window.history.replaceState({}, document.title, window.location.pathname);
      }}
    >
      {children}
    </OidcAuthProvider>
  );
}
