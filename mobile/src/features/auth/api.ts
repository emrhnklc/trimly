import { apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  AuthResponse,
  AuthUser,
  EmailVerificationPendingResponse,
} from "./types";

export const getCurrentUser = (accessToken: string) =>
  apiGet<AuthUser>("/users/me", undefined, accessToken);

export const login = (email: string, password: string) =>
  apiPost<AuthResponse>("/auth/login", { email, password });

export const register = (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => apiPost<EmailVerificationPendingResponse>("/auth/register", data);

export const verifyEmail = (email: string, code: string) =>
  apiPost<AuthResponse>("/auth/verify-email", { code, email });

export const resendEmailVerification = (email: string) =>
  apiPost<EmailVerificationPendingResponse>("/auth/resend-email-verification", {
    email,
  });

export const updateMyProfile = (
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profileImageUrl?: string;
  },
  accessToken: string,
) => apiPatch<AuthUser>("/users/me", data, accessToken);
