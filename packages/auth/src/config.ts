import { type UserManagerSettings } from 'oidc-client-ts';

/**
 * OIDC configuration shape consumed by both the admin and user apps.
 * Values are supplied via Vite environment variables:
 *   VITE_OIDC_AUTHORITY   – base URL of the IdP realm
 *   VITE_OIDC_CLIENT_ID   – public client ID registered in the IdP
 *   VITE_OIDC_REDIRECT_URI – post-login callback URL for this app
 */
export interface OidcAppConfig {
  authority: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scope?: string;
}

/**
 * Build a UserManagerSettings object compatible with oidc-client-ts and
 * react-oidc-context from the simplified OidcAppConfig.
 */
export function buildOidcConfig(cfg: OidcAppConfig): UserManagerSettings {
  return {
    authority: cfg.authority,
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    post_logout_redirect_uri: cfg.postLogoutRedirectUri,
    scope: cfg.scope ?? 'openid profile email',
    response_type: 'code',
    // Silent token refresh via a hidden iframe
    silent_redirect_uri: cfg.redirectUri,
    automaticSilentRenew: true,
    // Security: never persist tokens to localStorage
    userStore: undefined,
    monitorSession: true,
  };
}
