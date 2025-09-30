import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('plataforma.token')?.value
  const loginPath = '/auth/login';
  const publicRoutes = ['/auth/login', '/auth/forgot-password'];

  // se a rota for publica, permite seguir.
  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // Se o usuário não estiver autenticado e a rota não for pública, redireciona para a página de login
  if (!token) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
