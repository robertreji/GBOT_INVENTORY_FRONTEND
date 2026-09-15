'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserDTO } from '../types/user.types';
import {
  LoginPayload,
  RegisterPayload,
  VerifyOtpPayload,
  AuthResponseDTO,
} from '../types/auth.types';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from '../api/client';

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponseDTO>;
  register: (payload: RegisterPayload) => Promise<AuthResponseDTO>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<AuthResponseDTO>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateUser: (updatedData: Partial<UserDTO>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload safely
function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDTO | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('gbot_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveUser = (u: UserDTO | null) => {
    setUser(u);
    if (typeof window !== 'undefined') {
      if (u) localStorage.setItem('gbot_user', JSON.stringify(u));
      else localStorage.removeItem('gbot_user');
    }
  };

  // Derive admin status from token app_metadata or user role
  const checkIsAdmin = (tok: string | null, usr: UserDTO | null): boolean => {
    if (usr?.role === 'admin' || (usr as any)?.user_role === 'admin') return true;
    if (tok) {
      const payload = parseJwtPayload(tok);
      if (
        payload?.app_metadata?.role === 'admin' ||
        payload?.app_metadata?.user_role === 'admin' ||
        payload?.user_metadata?.role === 'admin' ||
        payload?.user_metadata?.user_role === 'admin' ||
        payload?.role === 'admin' ||
        payload?.user_role === 'admin'
      ) {
        return true;
      }
    }
    return false;
  };

  const isAdmin = checkIsAdmin(token, user);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const storedRefreshToken = getRefreshToken();
        if (!storedRefreshToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Try silent refresh to get the latest claims from Supabase
        const session = await authApi.refresh(storedRefreshToken);
        if (session.accessToken) {
          setAccessToken(session.accessToken);
          setRefreshToken(session.refreshToken);
          if (isMounted) setTokenState(session.accessToken);

          // Fetch fresh user profile
          const profile = await usersApi.getMe();
          if (isMounted) saveUser(profile);
        }
      } catch (err) {
        // If refresh failed but we already had an access token, don't immediately wipe if valid
        if (isMounted && !getAccessToken()) {
          clearTokens();
          saveUser(null);
          setTokenState(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<AuthResponseDTO> => {
    const data = await authApi.login(payload);
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
      setTokenState(data.session.accessToken);
    }
    if (data.user) {
      saveUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthResponseDTO> => {
    const data = await authApi.register(payload);
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
      setTokenState(data.session.accessToken);
    }
    if (data.user) {
      saveUser(data.user);
    }
    return data;
  }, []);

  const verifyOtp = useCallback(async (payload: VerifyOtpPayload): Promise<AuthResponseDTO> => {
    const data = await authApi.verifyOtp(payload);
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
      setTokenState(data.session.accessToken);
    }
    if (data.user) {
      saveUser(data.user);
    }
    return data;
  }, []);

  const resendOtp = useCallback(async (email: string): Promise<void> => {
    await authApi.resendOtp({ email });
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setTokenState(null);
      clearTokens();
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) return false;

      const session = await authApi.refresh(storedRefreshToken);
      if (session.accessToken) {
        setTokenState(session.accessToken);
        const profile = await usersApi.getMe();
        saveUser(profile);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const updateUser = useCallback((updatedData: Partial<UserDTO>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updatedData } : null;
      if (typeof window !== 'undefined') {
        if (updated) localStorage.setItem('gbot_user', JSON.stringify(updated));
        else localStorage.removeItem('gbot_user');
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAdmin,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

