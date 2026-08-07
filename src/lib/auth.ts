/**
 * Système d'authentification Nora Pressing
 * 100% Supabase Auth avec support multi-appareils et vérification d'email
 */

import { createClient } from '@/lib/supabase/client';

const SESSION_COOKIE = 'nora_auth_session';
const SESSION_DURATION_DAYS = 30;

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  emailConfirmed: boolean;
}

/** Pose le cookie de session basique */
export function setAuthSession(userId: string, email: string) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);

  const sessionVal = JSON.stringify({ userId, email });
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
    sessionVal
  )}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/** Supprime la session */
export function clearAuthSession() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/** Vérifie si une session locale existe */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}

/**
 * INSCRIPTION VIA SUPABASE AUTH
 */
export async function registerUser({
  fullName,
  email,
  password,
}: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; requiresVerification?: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = createClient();

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.nora-app.online';

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      return { success: false, error: 'Un compte existe déjà avec cette adresse email.' };
    }
    return { success: false, error: error.message };
  }

  if (data?.user) {
    // Si l'email n'est pas encore confirmé
    const isConfirmed = !!data.user.email_confirmed_at;
    if (!isConfirmed) {
      return { success: true, requiresVerification: true };
    }
    setAuthSession(data.user.id, data.user.email || cleanEmail);
    return { success: true, requiresVerification: false };
  }

  return { success: false, error: 'Erreur lors de l’inscription.' };
}

/**
 * CONNEXION VIA SUPABASE AUTH
 */
export async function loginUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ success: boolean; requiresVerification?: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { success: false, error: 'Email ou mot de passe incorrect.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        success: false,
        requiresVerification: true,
        error: 'Veuillez confirmer votre adresse e-mail avant de vous connecter.',
      };
    }
    return { success: false, error: error.message };
  }

  if (data?.session?.user) {
    const isConfirmed = !!data.session.user.email_confirmed_at;
    if (!isConfirmed) {
      return {
        success: false,
        requiresVerification: true,
        error: 'Veuillez confirmer votre adresse e-mail avant d’accéder à l’application.',
      };
    }
    setAuthSession(data.session.user.id, data.session.user.email || cleanEmail);
    return { success: true };
  }

  return { success: false, error: 'Échec de connexion.' };
}

/**
 * RENVOYER L'EMAIL DE VÉRIFICATION
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.nora-app.online';

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * DEMANDE DE RÉINITIALISATION DE MOT DE PASSE (MOT DE PASSE OUBLIÉ)
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.nora-app.online';

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${siteUrl}/auth/reset-password`,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * DECONNEXION
 */
export async function logoutUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearAuthSession();
}
