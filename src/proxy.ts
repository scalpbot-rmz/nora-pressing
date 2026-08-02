import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/auth') || pathname === '/install';
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/onboarding';

  const authCookie =
    request.cookies.get('nora_auth_session')?.value ||
    request.cookies.get('sb-access-token')?.value;

  // Route protégée sans session -> Redirection vers la connexion
  if (isProtectedRoute && !authCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Déjà connecté -> Redirection hors des pages auth vers le dashboard
  if (isAuthRoute && authCookie && pathname !== '/auth/reset-password') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding', '/auth/:path*'],
};
