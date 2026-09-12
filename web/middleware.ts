import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname, search, searchParams } = request.nextUrl;

    // Todas las llamadas de API se reenvían al backend, que valida cada ruta.
    if (pathname.startsWith('/api')) {
        const apiUrl = process.env.API_URL || 'http://localhost:6240';
        const url = request.nextUrl.clone();
        url.href = `${apiUrl}${pathname}${search}`;
        return NextResponse.rewrite(url);
    }

    // El iframe del widget vive en webs de terceros: nunca tiene sesión.
    if (pathname === '/chat' && searchParams.get('embed') === '1') {
        return NextResponse.next();
    }

    // ponytail: solo comprueba presencia de cookie, no la firma del JWT (haría
    // falta el secreto en el edge). La frontera real es el 401 del backend.
    const isAuthenticated = Boolean(request.cookies.get('token'));

    if (pathname === '/login') {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|widget.js).*)'],
};
