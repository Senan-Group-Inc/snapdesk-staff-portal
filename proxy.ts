import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomainFromHostname } from '@/utils/subdomain';

/**
 * Staff portal proxy — keep traffic on /admin/* only.
 * This app does not serve tenant /client routes.
 */
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const subdomain = getSubdomainFromHostname(hostname);

  if (pathname === '/login' || pathname.startsWith('/client')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url, 301);
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/organisations';
    return NextResponse.redirect(url, 307);
  }

  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Unknown path on admin host → staff login
  if (subdomain === 'admin' || hostname.startsWith('admin.')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
