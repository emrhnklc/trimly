export type AuthUser = { id: string; email: string; firstName: string; lastName: string };
export type AuthResponse = { accessToken: string; user: AuthUser };
