import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type { AuthResponse, AuthUser } from './types';

export const getCurrentUser = (accessToken: string) =>
  apiGet<AuthUser>('/users/me', undefined, accessToken);

export const login = (email: string, password: string) =>
  apiPost<AuthResponse>('/auth/login', { email, password });

export const register = (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) => apiPost<AuthResponse>('/auth/register', data);

export const updateMyProfile = (
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profileImageUrl?: string;
  },
  accessToken: string,
) => apiPatch<AuthUser>('/users/me', data, accessToken);
