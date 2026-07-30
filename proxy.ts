import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy (Next.js 16+) — subdomain-based routing (formerly middleware).
 *
 * Routes:
 * - admin.snapdesk.pywe.org -> /admin/*
 * - {organization}.snapdesk.pywe.org -> /client/*
 * - localhost -> /client/* (development)
 */
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(hostname);

  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    if (subdomain === 'admin') {
      url.pathname = '/admin/login';
    } else {
      url.pathname = '/client/login';
    }
    return NextResponse.redirect(url, 301);
  }

  if (subdomain === 'admin') {
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    if (pathname === '/' || pathname.startsWith('/client')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? '/admin/organisations' : pathname.replace('/client', '/admin');
      return NextResponse.redirect(url, 301);
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url, 301);
  }

  if (subdomain && subdomain !== 'admin') {
    if (pathname.startsWith('/client')) {
      return NextResponse.next();
    }
    if (pathname === '/' || pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === '/' ? '/client/dashboard' : pathname.replace('/admin', '/client');
      return NextResponse.redirect(url, 301);
    }
    const url = request.nextUrl.clone();
    url.pathname = '/client/login';
    return NextResponse.redirect(url, 301);
  }

  if (!subdomain || hostname.includes('localhost')) {
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    if (pathname === '/') {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];

  if (host === 'localhost' || host === '127.0.0.1' || host.includes('localhost')) {
    return null;
  }

  const parts = host.split('.');

  if (parts.length >= 4) {
    const sub = parts[0];
    if (sub && sub !== 'snapdesk' && sub !== 'www') {
      return sub;
    }
  }

  if (parts.length >= 3 && parts[1] === 'snapdesk') {
    const sub = parts[0];
    if (sub && sub !== 'www') {
      return sub;
    }
  }

  return null;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
