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

export interface RegisterPayload {
  email: string;
  password?: string;
  name: string;
  department: string;
  year: number;
  phoneNo: string;
  profileImg?: string | null;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface VerifyOtpPayload {
  email: string;
  token: string;
}

export interface ResendOtpPayload {
  email: string;
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

