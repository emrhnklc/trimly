export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};
export type AuthResponse = { accessToken: string; user: AuthUser };
