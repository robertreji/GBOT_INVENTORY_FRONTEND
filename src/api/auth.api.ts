import { apiClient, setAccessToken, setRefreshToken, clearTokens } from './client';
import {
  AuthSessionDTO,
  AuthResponseDTO,
  LoginPayload,
  RegisterPayload,
  RosterLookupPayload,
  RosterLookupResponse,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '../types/auth.types';

export const authApi = {
  /**
   * Verify the roster details and send an OTP to the roster email.
   */
  async lookupRoster(payload: RosterLookupPayload): Promise<RosterLookupResponse> {
    return apiClient<RosterLookupResponse>('/auth/lookup-roster', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  /**
   * Finish registration using the session established by the verified OTP.
   * Backend resolves the email from the roster; the client never supplies it.
   */
  async register(payload: RegisterPayload, accessToken: string): Promise<AuthResponseDTO> {
    const data = await apiClient<AuthResponseDTO>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (data.session?.accessToken) {
      setAccessToken(data.session.accessToken);
      setRefreshToken(data.session.refreshToken);
    }
    return data;
  },

  /** Verify the OTP sent before the account is created. */
  async verifyRegistrationOtp(payload: VerifyOtpPayload): Promise<AuthSessionDTO> {
    return apiClient<AuthSessionDTO>('/auth/verify-registration-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },

  /** Resend the pre-registration OTP to the email on the roster. */
  async resendRegistrationOtp(payload: ResendOtpPayload): Promise<{ message: string }> {
    return apiClient('/auth/resend-registration-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
    });
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

  /**
   * Verify OTP — sends admissionNumber (backend resolves email from roster).
   */
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

  /**
   * Resend OTP — sends admissionNumber (backend resolves email from roster).
   */
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
