import { UserDTO } from './user.types';

export interface AuthSessionDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseDTO {
  user: UserDTO;
  session: AuthSessionDTO;
}

/**
 * Step 1 of registration: lookup the roster.
 * Client supplies admissionNumber + mobile.
 */
export interface RosterLookupPayload {
  admissionNumber: string;
  mobile: string;
}

/**
 * Response from the roster lookup endpoint.
 * maskedEmail is shown to the user as confirmation (e.g. "ra*****@example.com").
 */
export interface RosterLookupResponse {
  maskedEmail: string;
  name: string;
}

/**
 * Step 2 of registration: create account.
 * No email field — backend uses the email from the roster.
 */
export interface RegisterPayload {
  admissionNumber: string;
  mobile: string;
  password: string;
  name: string;
  department: string;
  year: number;
  phoneNo: string;
  profileImg?: string | null;
}

export interface LoginPayload {
  /** Direct email login. */
  email?: string;
  /** Admission-number login — backend resolves the email. */
  admissionNumber?: string;
  password?: string;
}

/**
 * OTP verify — uses admissionNumber, NOT email (backend resolves email from roster).
 */
export interface VerifyOtpPayload {
  admissionNumber: string;
  token: string;
}

/**
 * OTP resend — uses admissionNumber, NOT email (backend resolves email from roster).
 */
export interface ResendOtpPayload {
  admissionNumber: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  accessToken: string;
  newPassword: string;
}
