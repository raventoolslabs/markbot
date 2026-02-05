import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only rewrite /api requests that are NOT handled by Next.js API routes (if any)
    // Since all our API logic is in the backend service, we rewrite all /api calls.
    if (pathname.startsWith('/api')) {
        const apiUrl = process.env.API_URL || 'http://localhost:3002';

        // Construct the new URL
        const url = request.nextUrl.clone();
        url.href = `${apiUrl}${pathname}${request.nextUrl.search}`;

        // Check if the destination is external (http/https) to rewrite properly
        // Next.js middleware rewrite to external URL acts as a proxy
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
