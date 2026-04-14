export interface CaptchaPayload {
  honeypot?: string;
  formLoadedAt?: number;
  powPrefix?: string;
  powNonce?: string;
}

export interface LoginDto {
  username: string;
  password: string;
  captcha?: CaptchaPayload;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
  marketer?: string;
  captcha?: CaptchaPayload;
}

export interface ForgotDto {
  username: string;
  captcha?: CaptchaPayload;
}

export interface ResetPasswordDto {
  id: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangeEmailDto {
  email: string;
}

export interface ChangePhoneDto {
  phone: string;
}

export interface ConfirmDto {
  id: string;
  code: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  bio: string;
  timeZone: string;
  calendar: number;
  darkMode: boolean;
  avatar?: File;
}
