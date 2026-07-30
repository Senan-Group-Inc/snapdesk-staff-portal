/**
 * Subdomain helpers for the staff portal host.
 *
 * Production examples:
 * - admin.senangroupafrica.com -> admin
 * - admin.snapdesk.pywe.org -> admin
 *
 * MAIN_DOMAIN (optional): e.g. senangroupafrica.com — used to strip the apex.
 */

function mainDomainSuffix(): string | null {
  const raw = process.env.NEXT_PUBLIC_MAIN_DOMAIN?.trim().toLowerCase();
  if (!raw || raw === 'localhost') return null;
  return raw.replace(/^\.+/, '');
}

function extractSubdomainFromHost(hostname: string): string | null {
  const host = hostname.split(':')[0].toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
    return null;
  }

  // Explicit admin host short-circuit
  if (host.startsWith('admin.')) {
    return 'admin';
  }

  const main = mainDomainSuffix();
  if (main && (host === main || host === `www.${main}`)) {
    return null;
  }
  if (main && host.endsWith(`.${main}`)) {
    const left = host.slice(0, -(main.length + 1));
    const first = left.split('.')[0];
    if (first && first !== 'www') return first;
  }

  const parts = host.split('.');

  // Legacy: subdomain.snapdesk.pywe.org (4+ labels)
  if (parts.length >= 4) {
    const sub = parts[0];
    if (sub && sub !== 'snapdesk' && sub !== 'www') return sub;
  }

  // Legacy: subdomain.snapdesk.tld
  if (parts.length >= 3 && parts[1] === 'snapdesk') {
    const sub = parts[0];
    if (sub && sub !== 'www') return sub;
  }

  // Generic: subdomain.domain.tld (e.g. admin.senangroupafrica.com)
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub && sub !== 'www') return sub;
  }

  return null;
}

export function getSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  return extractSubdomainFromHost(window.location.hostname);
}

/** Shared with proxy.ts */
export function getSubdomainFromHostname(hostname: string): string | null {
  return extractSubdomainFromHost(hostname);
}

export function isAdminSubdomain(): boolean {
  return getSubdomain() === 'admin';
}

export function getOrganizationSubdomain(): string | null {
  const subdomain = getSubdomain();
  if (subdomain && subdomain !== 'admin') return subdomain;
  return null;
}

export function isSubdomainEnvironment(): boolean {
  return getSubdomain() !== null;
}
