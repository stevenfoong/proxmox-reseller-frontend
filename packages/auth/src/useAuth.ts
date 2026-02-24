import { useAuth as useOidcAuth } from 'react-oidc-context';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  accessToken: string;
}

/**
 * useAuth provides a simplified interface over react-oidc-context.
 *
 * Usage:
 *   const { user, isLoading, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  const auth = useOidcAuth();

  const login = () => void auth.signinRedirect();
  const logout = () =>
    void auth.signoutRedirect({ post_logout_redirect_uri: window.location.origin });

  const user: AuthUser | null =
    auth.user
      ? {
          sub: auth.user.profile.sub,
          email: auth.user.profile.email ?? '',
          name: auth.user.profile.name ?? '',
          roles: (auth.user.profile['roles'] as string[] | undefined) ?? [],
          accessToken: auth.user.access_token,
        }
      : null;

  return {
    user,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    error: auth.error,
    login,
    logout,
  };
}
