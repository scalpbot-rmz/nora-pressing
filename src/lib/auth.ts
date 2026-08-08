/**
 * Système d'authentification Nora Pressing
 * Hybride : Supabase Auth (Multi-appareils) + Local-First Fallback (Offline & Résilience)
 */

import { createClient } from '@/lib/supabase/client';

const SESSION_COOKIE = 'nora_auth_session';
const CURRENT_USER_KEY = 'nora_current_user';
const LOCAL_USERS_KEY = 'nora_registered_users';
const SESSION_DURATION_DAYS = 30;

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  emailConfirmed: boolean;
}

/** Formate et traduit les erreurs d'authentification en français */
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
    return 'Impossible de joindre le serveur. Vos identifiants locaux seront utilisés.';
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

  return msg;
}

/** Récupère les utilisateurs enregistrés localement */
export function getLocalUsers(): (AppUser & { passwordHash?: string })[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Enregistre un utilisateur dans le registre local */
export function saveLocalUser(user: AppUser, password?: string) {
  if (typeof window === 'undefined') return;
  const users = getLocalUsers();
  const index = users.findIndex((u) => u.email === user.email);
  const entry = {
    ...user,
    passwordHash: password ? btoa(password) : undefined,
  };

  if (index >= 0) {
    users[index] = { ...users[index], ...entry };
  } else {
    users.push(entry);
  }
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

/** Enregistre l'utilisateur actif et le cookie de session */
export function setAuthSession(user: AppUser) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);

  const sessionVal = JSON.stringify({ userId: user.id, email: user.email, fullName: user.fullName });
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
    sessionVal
  )}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

/** Supprime la session active */
export function clearAuthSession() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  localStorage.removeItem(CURRENT_USER_KEY);
}

/** Récupère l'utilisateur actif depuis la session locale */
export function getCurrentAppUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);

    // Fallback cookie
    const cookieMatch = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
    if (cookieMatch) {
      const val = decodeURIComponent(cookieMatch.split('=')[1]);
      const parsed = JSON.parse(val);
      return {
        id: parsed.userId,
        email: parsed.email,
        fullName: parsed.fullName || 'Gérant',
        emailConfirmed: true,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Vérifie si une session active existe */
export function isAuthenticated(): boolean {
  return !!getCurrentAppUser();
}

/**
 * INSCRIPTION (Supabase Auth + Fallback Local-First instantané)
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
  const cleanName = fullName.trim();
  const supabase = createClient();

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.nora-app.online';

  // 1. Inscription Supabase si disponible
  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error && !error.message.includes('Failed to fetch') && !error.message.includes('FetchError')) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return { success: false, error: 'Un compte existe déjà avec cette adresse email.' };
      }
    }

    if (data?.user) {
      const isConfirmed = !!data.user.email_confirmed_at;
      const appUser: AppUser = {
        id: data.user.id,
        email: cleanEmail,
        fullName: cleanName,
        emailConfirmed: isConfirmed,
      };

      saveLocalUser(appUser, password);

      if (!isConfirmed) {
        // Mode développement / local : autoriser la connexion directe si besoin
        setAuthSession(appUser);
        return { success: true, requiresVerification: true };
      }

      setAuthSession(appUser);
      return { success: true, requiresVerification: false };
    }
  } catch (err) {
    console.warn('Supabase Auth non disponible, passage en inscription locale:', err);
  }

  // 2. Fallback Inscription Locale
  const existingUsers = getLocalUsers();
  if (existingUsers.some((u) => u.email === cleanEmail)) {
    return { success: false, error: 'Un compte existe déjà avec cette adresse email.' };
  }

  const localUser: AppUser = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    fullName: cleanName,
    emailConfirmed: true,
  };

  saveLocalUser(localUser, password);
  setAuthSession(localUser);
  return { success: true, requiresVerification: false };
}

/**
 * CONNEXION (Supabase Auth + Fallback Local-First)
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

  // 1. Tenter la connexion Supabase
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (data?.session?.user) {
      const isConfirmed = !!data.session.user.email_confirmed_at;
      const appUser: AppUser = {
        id: data.session.user.id,
        email: cleanEmail,
        fullName: data.session.user.user_metadata?.full_name || 'Gérant',
        emailConfirmed: isConfirmed,
      };

      saveLocalUser(appUser, password);
      setAuthSession(appUser);
      return { success: true };
    }

    if (error && !error.message.includes('Failed to fetch') && !error.message.includes('FetchError')) {
      if (error.message.includes('Invalid login credentials')) {
        // Vérifier si le compte existe dans le registre local avant de rejeter
        const localUsers = getLocalUsers();
        const localUser = localUsers.find((u) => u.email === cleanEmail);
        if (localUser && localUser.passwordHash === btoa(password)) {
          setAuthSession(localUser);
          return { success: true };
        }
        return { success: false, error: 'Adresse e-mail ou mot de passe incorrect.' };
      }
    }
  } catch (err) {
    console.warn('Supabase Login non disponible, vérification locale:', err);
  }

  // 2. Fallback Connexion Locale
  const localUsers = getLocalUsers();
  const localUser = localUsers.find((u) => u.email === cleanEmail);

  if (!localUser) {
    return { success: false, error: "Aucun compte n'existe avec cette adresse e-mail. Veuillez créer un compte." };
  }

  if (localUser.passwordHash && localUser.passwordHash !== btoa(password)) {
    return { success: false, error: 'Mot de passe incorrect.' };
  }

  setAuthSession(localUser);
  return { success: true };
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
 * DEMANDE DE RÉINITIALISATION DE MOT DE PASSE
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
