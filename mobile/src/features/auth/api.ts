import { apiPost } from '@/lib/api/client';
import type { AuthResponse } from './types';
export const login = (email: string, password: string) => apiPost<AuthResponse>('/auth/login', { email, password });
export const register = (data: { email: string; password: string; firstName: string; lastName: string }) => apiPost<AuthResponse>('/auth/register', data);
