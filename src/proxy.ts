import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Accès libre aux routes d'authentification et d'installation PWA
  const isAuthRoute = pathname.startsWith('/auth') || pathname === '/install';
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/onboarding';

  // Vérifier la présence du cookie de session Nora
  const authCookie =
    request.cookies.get('nora_auth_session')?.value ||
    request.cookies.get('sb-access-token')?.value;

  // Route protégée sans session → redirection vers la connexion
  if (isProtectedRoute && !authCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Déjà connecté → redirection hors des pages auth
  if (isAuthRoute && authCookie && pathname !== '/auth/reset-password') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding', '/auth/:path*'],
};
