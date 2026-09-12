import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// AuthContext guarda el usuario como JSON en una cookie legible. Si no se puede
// leer no se bloquea el paso: quien decide de verdad es el backend.
function isEmailVerified(request: NextRequest) {
    const raw = request.cookies.get('user')?.value;
    if (!raw) return true;
    try {
        return JSON.parse(decodeURIComponent(raw)).email_verified !== false;
    } catch {
        return true;
    }
}

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
    const verified = isEmailVerified(request);

    // Login es también la pantalla de verificación: solo se sale de ella con la
    // sesión ya verificada, o si no se saldría nunca de un bucle de redirecciones.
    if (pathname === '/login') {
        if (isAuthenticated && verified) {
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', `${pathname}${search}`);
        return NextResponse.redirect(loginUrl);
    }

    if (!verified) {
        return NextResponse.redirect(new URL('/login?mode=verify-email', request.url));
    }

    return NextResponse.next();
}

// Se excluye todo /_next y los endpoints internos de Next: en desarrollo el
// hot reload vive ahí y redirigirlo deja la página sin recargar.
export const config = {
    matcher: ['/((?!_next/|__nextjs|img/|favicon.ico|widget.js).*)'],
};
