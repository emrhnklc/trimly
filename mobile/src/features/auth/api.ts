import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from "@/lib/api/client";
import { Platform } from "react-native";
import { appendImageFile } from "@/lib/api/upload";
import type {
  AuthResponse,
  AuthUser,
  EmailVerificationPendingResponse,
  PasswordResetRequestResponse,
} from "./types";

export const getCurrentUser = (accessToken: string) =>
  apiGet<AuthUser>("/users/me", undefined, accessToken);

const deviceName = Platform.select({
  android: "Android cihaz",
  ios: "iPhone",
  web: "Web tarayıcısı",
  default: "Bilinmeyen cihaz",
});

export const login = (email: string, password: string) =>
  apiPost<AuthResponse>("/auth/login", { deviceName, email, password });

export const register = (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  provinceCode?: string;
  province?: string;
  district?: string;
  neighborhood?: string;
}) => apiPost<EmailVerificationPendingResponse>("/auth/register", data);

export const verifyEmail = (email: string, code: string) =>
  apiPost<AuthResponse>("/auth/verify-email", { code, email });

export const resendEmailVerification = (email: string) =>
  apiPost<EmailVerificationPendingResponse>("/auth/resend-email-verification", {
    email,
  });

export const requestPasswordReset = (email: string) =>
  apiPost<PasswordResetRequestResponse>("/auth/forgot-password", { email });

export const resetPassword = (
  email: string,
  code: string,
  newPassword: string,
) =>
  apiPost<{ message: string }>("/auth/reset-password", {
    code,
    email,
    newPassword,
  });

export const updateMyProfile = (
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: string | null;
  },
  accessToken: string,
) => apiPatch<AuthUser>("/users/me", data, accessToken);

export function uploadMyProfilePhoto(
  photo: { uri: string; mimeType?: string | null },
  accessToken: string,
) {
  const formData = new FormData();
  appendImageFile(formData, "file", photo, "trimly-profile");
  return apiUpload<AuthUser>("/users/me/profile-photo", formData, accessToken);
}

export const removeMyProfilePhoto = (accessToken: string) =>
  apiDelete<AuthUser>("/users/me/profile-photo", accessToken);

export const exportMyData = (accessToken: string) =>
  apiGet<Record<string, unknown>>("/users/me/export", undefined, accessToken);

export const requestAccountDeletion = (accessToken: string) =>
  apiPost<{ deletionVerificationRequired?: boolean; devDeletionCode?: string; ownerBusinesses?: string[]; requiresOwnershipResolution?: boolean }>("/users/me/deletion-request", {}, accessToken);

export const confirmAccountDeletion = (code: string, accessToken: string) =>
  apiPost<{ message: string }>("/users/me/delete", { code }, accessToken);

export type ActiveSession = {
  id: string;
  deviceName: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

export const getActiveSessions = (accessToken: string) =>
  apiGet<ActiveSession[]>("/auth/sessions", undefined, accessToken);

export const revokeSession = (sessionId: string, accessToken: string) =>
  apiDelete<{ message: string }>(`/auth/sessions/${sessionId}`, accessToken);

export const revokeOtherSessions = (accessToken: string) =>
  apiPost<{ revokedCount: number }>("/auth/sessions/revoke-others", {}, accessToken);
