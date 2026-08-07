/**
 * Système d'authentification Nora Pressing
 * Support multi-appareils (Supabase Auth) + Fallback Local-First
 */

import { createClient } from '@/lib/supabase/client';

const SESSION_COOKIE = 'nora_auth_session';
const LOCAL_USERS_KEY = 'nora_local_registered_users';
const SESSION_DURATION_DAYS = 30;

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  emailConfirmed: boolean;
}

/** Formate et traduit les erreurs d'authentification brutes en messages explicites pour l'utilisateur */
export function formatAuthError(error: any): string {
  if (!error) return 'Une erreur inconnue est survenue.';

  const msg = typeof error === 'string' ? error : error.message || String(error);

  if (
    msg.includes('Failed to fetch') ||
    msg.includes('FetchError') ||
    msg.includes('NetworkError') ||
    msg.includes('network') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('TypeError')
  ) {
    return 'Impossible de joindre le serveur d’authentification. Veuillez vérifier votre connexion Internet ou réessayer plus tard.';
  }

  if (
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('User already registered')
  ) {
    return 'Un compte existe déjà avec cette adresse email.';
  }

  if (msg.includes('Invalid login credentials')) {
    return 'Adresse e-mail ou mot de passe incorrect.';
  }

  if (msg.includes('Email not confirmed')) {
    return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
  }

  if (msg.includes('Password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }

  if (
    msg.includes('Invalid API key') ||
    msg.includes('JWTPayload') ||
    msg.includes('apiKey') ||
    msg.includes('invalid claim')
  ) {
    return 'Erreur de configuration du serveur. Veuillez contacter l’administrateur.';
  }

  return msg;
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

/** Gestion des comptes enregistrés en mode local-first / offline */
function getLocalUsers(): AppUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUser(user: AppUser) {
  if (typeof window === 'undefined') return;
  const users = getLocalUsers();
  const index = users.findIndex((u) => u.email === user.email);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

/**
 * INSCRIPTION REELLE (Supabase Auth avec Fallback Local-First en cas d'indisponibilité réseau)
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

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      // Si l'erreur est un problème de réseau ou "Failed to fetch", basculer proprement sur la création locale si offline
      if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('FetchError') ||
        error.message.includes('NetworkError')
      ) {
        // Enregistrer l'utilisateur localement pour ne pas bloquer l'utilisation de la PWA
        const localUser: AppUser = {
          id: `usr-${Date.now()}`,
          email: cleanEmail,
          fullName: fullName.trim(),
          emailConfirmed: true,
        };
        saveLocalUser(localUser);
        setAuthSession(localUser.id, localUser.email);
        return { success: true, requiresVerification: false };
      }

      return { success: false, error: formatAuthError(error) };
    }

    if (data?.user) {
      const isConfirmed = !!data.user.email_confirmed_at;
      if (!isConfirmed) {
        return { success: true, requiresVerification: true };
      }
      setAuthSession(data.user.id, data.user.email || cleanEmail);
      return { success: true, requiresVerification: false };
    }
  } catch (err: any) {
    // Mode fallback si le réseau est totalement indisponible
    const localUser: AppUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      fullName: fullName.trim(),
      emailConfirmed: true,
    };
    saveLocalUser(localUser);
    setAuthSession(localUser.id, localUser.email);
    return { success: true, requiresVerification: false };
  }

  return { success: false, error: 'Erreur lors de l’inscription.' };
}

/**
 * CONNEXION VIA SUPABASE AUTH (AVEC FALLBACK LOCAL)
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

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // Si problème réseau, tenter la session locale
      if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('FetchError') ||
        error.message.includes('NetworkError')
      ) {
        const localUsers = getLocalUsers();
        const existing = localUsers.find((u) => u.email === cleanEmail);
        if (existing) {
          setAuthSession(existing.id, existing.email);
          return { success: true };
        }
      }

      return { success: false, error: formatAuthError(error) };
    }

    if (data?.session?.user) {
      const isConfirmed = !!data.session.user.email_confirmed_at;
      if (!isConfirmed) {
        return {
          success: false,
          requiresVerification: true,
          error: 'Veuillez confirmer votre adresse e-mail avant de vous connecter.',
        };
      }
      setAuthSession(data.session.user.id, data.session.user.email || cleanEmail);
      return { success: true };
    }
  } catch (err: any) {
    const localUsers = getLocalUsers();
    const existing = localUsers.find((u) => u.email === cleanEmail);
    if (existing) {
      setAuthSession(existing.id, existing.email);
      return { success: true };
    }
    return { success: false, error: formatAuthError(err) };
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

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) return { success: false, error: formatAuthError(error) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatAuthError(err) };
  }
}

/**
 * DEMANDE DE RÉINITIALISATION DE MOT DE PASSE (MOT DE PASSE OUBLIÉ)
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.nora-app.online';

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${siteUrl}/auth/reset-password`,
    });

    if (error) return { success: false, error: formatAuthError(error) };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatAuthError(err) };
  }
}

/**
 * DECONNEXION
 */
export async function logoutUser() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {}
  clearAuthSession();
}
