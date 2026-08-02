/**
 * Gestion de session locale Nora (cookie côté client)
 * Le middleware lit ce cookie pour protéger les routes /dashboard/* et /onboarding
 */

const SESSION_COOKIE = 'nora_auth_session';
const SESSION_DURATION_DAYS = 30;

/** Pose le cookie de session → débloque l'accès au dashboard */
export function setAuthSession(userId = 'local-user') {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);
  document.cookie = `${SESSION_COOKIE}=${userId}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/** Supprime le cookie de session → déconnecte l'utilisateur */
export function clearAuthSession() {
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/** Vérifie côté client si une session existe */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}
