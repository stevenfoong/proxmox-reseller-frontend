import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  /** Returns the current Bearer token, or null when unauthenticated */
  getAccessToken: () => string | null;
  /** Called when the API returns 401 (token expired / invalid) */
  onUnauthorized?: () => void;
}

/** Standard API response envelope */
export interface ApiResponse<T> {
  data: T;
  meta: { requestId: string; timestamp: string };
}

/** Standard paginated API response envelope */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  meta: { requestId: string; timestamp: string };
}

/** Standard API error shape */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Creates and configures an Axios instance that:
 * - Attaches the OIDC Bearer token to every request
 * - Unwraps the standard response envelope
 * - Handles 401 responses by calling onUnauthorized
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Attach Bearer token on every outgoing request
  instance.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    const token = config.getAccessToken();
    if (token) {
      req.headers.set('Authorization', `Bearer ${token}`);
    }
    return req;
  });

  // Handle 401 Unauthorized globally
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        config.onUnauthorized?.();
      }
      return Promise.reject(error);
    },
  );

  return instance;
}
