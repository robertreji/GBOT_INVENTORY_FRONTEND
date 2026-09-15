import { ApiError, ApiResponse } from '../types/api.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// In-memory token storage
let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

export const getAccessToken = (): string | null => {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gbot_access_token');
  }
  return null;
};

export const setAccessToken = (token: string | null): void => {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('gbot_access_token', token);
    } else {
      localStorage.removeItem('gbot_access_token');
    }
  }
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gbot_refresh_token');
};

export const setRefreshToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('gbot_refresh_token', token);
  } else {
    localStorage.removeItem('gbot_refresh_token');
  }
};

export const clearTokens = (): void => {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gbot_refresh_token');
    localStorage.removeItem('gbot_access_token');
    localStorage.removeItem('gbot_user');
  }
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

// Parse Zod error strings like: "email: Use your college email (@gecwyd.ac.in), password: Password must be..."
export const parseZodErrors = (message: string): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!message || !message.includes(':')) return errors;

  const parts = message.split(/,\s*(?=[a-zA-Z0-9_]+:)/);
  for (const part of parts) {
    const colonIndex = part.indexOf(':');
    if (colonIndex > 0) {
      const field = part.slice(0, colonIndex).trim();
      const msg = part.slice(colonIndex + 1).trim();
      if (field && msg) {
        errors[field] = msg;
      }
    }
  }
  return errors;
};

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !options.skipAuth && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Token Expired & Silent Refresh
  if (response.status === 401 && !options.skipAuth && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.data?.accessToken) {
            setAccessToken(refreshData.data.accessToken);
            if (refreshData.data.refreshToken) {
              setRefreshToken(refreshData.data.refreshToken);
            }
            onRefreshed(refreshData.data.accessToken);
          } else {
            clearTokens();
            onRefreshed(null);
          }
        } catch {
          clearTokens();
          onRefreshed(null);
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for refresh to complete
      const newToken = await new Promise<string | null>((resolve) => {
        addRefreshSubscriber((t) => resolve(t));
      });

      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (err) {
    throw new ApiError(
      response.status,
      response.statusText || 'An unexpected network error occurred'
    );
  }

  if (!response.ok || !data.success) {
    const errorMessage = data.message || `Request failed with status ${response.status}`;
    const validationErrors = response.status === 400 ? parseZodErrors(errorMessage) : undefined;
    throw new ApiError(response.status, errorMessage, validationErrors);
  }

  return (data.data !== undefined ? data.data : data) as T;
}

