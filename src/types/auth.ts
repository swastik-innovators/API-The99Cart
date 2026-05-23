// ─── Auth Types ────────────────────────────────────────────────────────────
// Types specific to the authentication module.

/** User roles */
export type UserRole = 'customer' | 'seller' | 'admin';

/** Profile record from the database */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** Auth tokens returned to client */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'bearer';
}

/** Login / Register response */
export interface AuthResponse {
  user: Profile;
  tokens: AuthTokens | null;
}

/** JWT payload after verification */
export interface JwtPayload {
  sub: string;        // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
