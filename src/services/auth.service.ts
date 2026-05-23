// ─── Auth Service ──────────────────────────────────────────────────────────
// All authentication business logic. Wraps Supabase Auth with custom profile management.

import { supabase, supabaseAdmin } from '../config/supabase';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';
import type { Profile, AuthResponse, AuthTokens } from '../types/auth';
import type {
  RegisterInput,
  LoginInput,
  GoogleAuthInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../validators/auth.validator';
import { config } from '../config';

class AuthService {
  // ── Register ───────────────────────────────────────────────────────────
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, full_name, phone, role } = input;

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    // Sign up via Supabase Admin Auth to bypass public email rate limits and confirm instantly
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bypasses email confirmation rate limits
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      logger.error('Supabase admin signUp error', { error: authError.message });
      throw ApiError.badRequest(authError.message);
    }

    if (!authData.user) {
      throw ApiError.internal('Registration failed — no user returned');
    }

    // Sign the user in immediately to generate session tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      logger.error('Auto sign-in after admin register failed', { error: sessionError.message });
      throw ApiError.internal('Auto sign-in failed — please log in manually');
    }

    // Ensure the user profile row exists by upserting it directly from the backend.
    // This makes the registration process 100% immune to missing or delayed database triggers!
    const { error: profileError } = await supabaseAdmin
       .from('profiles')
       .upsert({
         id: authData.user.id,
         email: authData.user.email!,
         full_name: full_name || null,
         phone: phone || null,
         role: role,
         is_verified: true, // Automatically marked verified as it is bypassed via admin signup
         onboarding_completed: role === 'customer' || role === 'admin', // Customers/Admins do not need onboarding
       }, {
         onConflict: 'id'
       });

    if (profileError) {
      logger.error('Profile upsert after register failed', { error: profileError.message });
      throw ApiError.internal(`Failed to initialize user profile: ${profileError.message}`);
    }

    // Fetch complete profile
    const profile = await this.getProfileById(authData.user.id);

    return {
      user: profile,
      tokens: sessionData.session ? this.formatTokens(sessionData.session) : null,
    };
  }

  // ── Login ──────────────────────────────────────────────────────────────
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Login failed', { email, error: error.message });
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!data.session) {
      throw ApiError.unauthorized('Login failed — no session');
    }

    const profile = await this.getProfileById(data.user.id);

    return {
      user: profile,
      tokens: this.formatTokens(data.session),
    };
  }

  // ── Google OAuth ───────────────────────────────────────────────────────
  async googleLogin(input: GoogleAuthInput): Promise<AuthResponse> {
    const { id_token, role } = input;

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token,
    });

    if (error) {
      logger.error('Google OAuth failed', { error: error.message });
      throw ApiError.unauthorized('Google authentication failed');
    }

    if (!data.session || !data.user) {
      throw ApiError.unauthorized('Google login failed — no session');
    }

    // Ensure the Google user profile row exists by upserting it directly from the backend.
    // This resolves any race conditions or missing database triggers during Google Login!
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        full_name: data.user.user_metadata?.['full_name'] || null,
        avatar_url: data.user.user_metadata?.['avatar_url'] || null,
        role: role,
        is_verified: true,
        onboarding_completed: role === 'customer' || role === 'admin', // Customers/Admins do not need onboarding
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      logger.error('Google profile upsert failed', { error: profileError.message });
      throw ApiError.internal(`Failed to initialize Google user profile: ${profileError.message}`);
    }

    const profile = await this.getProfileById(data.user.id);

    return {
      user: profile,
      tokens: this.formatTokens(data.session),
    };
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  async logout(accessToken: string): Promise<void> {
    const { error } = await supabase.auth.admin.signOut(accessToken, 'local');

    if (error) {
      // Non-critical — token may already be expired
      logger.warn('Logout signOut error (non-critical)', { error: error.message });
    }
  }

  // ── Refresh Token ──────────────────────────────────────────────────────
  async refreshToken(input: RefreshTokenInput): Promise<AuthResponse> {
    const { refresh_token } = input;

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session || !data.user) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const profile = await this.getProfileById(data.user.id);

    return {
      user: profile,
      tokens: this.formatTokens(data.session),
    };
  }

  // ── Forgot Password ───────────────────────────────────────────────────
  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const { email } = input;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.cors.origin[0]}/auth/reset-password`,
    });

    if (error) {
      logger.error('Forgot password error', { error: error.message });
      // Don't reveal whether the email exists
    }

    // Always return success to prevent email enumeration
  }

  // ── Reset Password ────────────────────────────────────────────────────
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const { access_token, password } = input;

    // Create a client scoped to this user's token
    const { data: userData, error: userError } = await supabase.auth.getUser(access_token);

    if (userError || !userData.user) {
      throw ApiError.unauthorized('Invalid or expired reset token');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
      password,
    });

    if (error) {
      logger.error('Reset password error', { error: error.message });
      throw ApiError.badRequest('Failed to reset password');
    }
  }

  // ── Get Profile ────────────────────────────────────────────────────────
  async getProfile(userId: string): Promise<Profile> {
    return this.getProfileById(userId);
  }

  // ── Update Profile ─────────────────────────────────────────────────────
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const updateData: Record<string, unknown> = {};

    if (input.full_name !== undefined) updateData['full_name'] = input.full_name;
    if (input.phone !== undefined) updateData['phone'] = input.phone;
    if (input.avatar_url !== undefined) updateData['avatar_url'] = input.avatar_url;

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No fields to update');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Profile update failed', { userId, error: error.message });
      throw ApiError.internal('Failed to update profile');
    }

    return data as Profile;
  }

  // ── Private Helpers ────────────────────────────────────────────────────

  private async getProfileById(userId: string): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      logger.error('Profile fetch failed', { userId, error: error?.message });
      throw ApiError.notFound('Profile not found');
    }

    return data as Profile;
  }

  private formatTokens(session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }): AuthTokens {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: 'bearer',
    };
  }
}

export const authService = new AuthService();
export default authService;
