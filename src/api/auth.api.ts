import { apiClient, setAccessToken, setRefreshToken, clearTokens } from './client';
import {
  AuthResponseDTO,
  LoginPayload,
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types';

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponseDTO> {
    const data = await apiClient<AuthResponseDTO>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
    }
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseDTO> {
    const data = await apiClient<AuthResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
    }
    return data;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponseDTO> {
    const data = await apiClient<AuthResponseDTO>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
    }
    return data;
  },

  async resendOtp(payload: ResendOtpPayload): Promise<{ message: string }> {
    return apiClient('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const data = await apiClient<{ accessToken: string; refreshToken: string; expiresIn: number }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout backend errors, proceed to clear client tokens
    } finally {
      clearTokens();
    }
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    return apiClient('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    return apiClient('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
};

