/**
 * Extract the subdomain from the current hostname
 * Examples:
 * - pharstcare.snapdesk.pywe.org -> pharstcare
 * - bluerocktx.snapdesk.pywe.org -> bluerocktx
 * - admin.snapdesk.pywe.org -> admin
 * - localhost:3000 -> null (development)
 * - snapdesk.pywe.org -> null (main domain)
 */
export function getSubdomain(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;

  // In development, return null to show organization selection
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
    return null;
  }

  // Split the hostname by dots
  const parts = hostname.split('.');

  // Check if it's a subdomain pattern: subdomain.snapdesk.pywe.org
  // We expect at least 3 parts: [subdomain, snapdesk, pywe, org]
  if (parts.length >= 4) {
    const subdomain = parts[0];
    // Verify it's not the main domain (snapdesk)
    if (subdomain && subdomain !== 'snapdesk' && subdomain !== 'www') {
      return subdomain;
    }
  }

  // Also check for pattern: subdomain.snapdesk.pywe.org
  // If the second part is 'snapdesk', the first part is the subdomain
  if (parts.length >= 3 && parts[1] === 'snapdesk') {
    const subdomain = parts[0];
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
}

/**
 * Check if the current subdomain is the admin subdomain
 * Examples:
 * - admin.snapdesk.pywe.org -> true
 * - pharstcare.snapdesk.pywe.org -> false
 * - localhost:3000 -> false (development)
 */
export function isAdminSubdomain(): boolean {
  const subdomain = getSubdomain();
  return subdomain === 'admin';
}

/**
 * Get the organization subdomain (excludes admin)
 * Returns null if subdomain is 'admin' or if no subdomain
 * Examples:
 * - pharstcare.snapdesk.pywe.org -> pharstcare
 * - admin.snapdesk.pywe.org -> null
 * - localhost:3000 -> null (development)
 */
export function getOrganizationSubdomain(): string | null {
  const subdomain = getSubdomain();
  if (subdomain && subdomain !== 'admin') {
    return subdomain;
  }
  return null;
}

/**
 * Check if we're in a subdomain environment (production)
 */
export function isSubdomainEnvironment(): boolean {
  return getSubdomain() !== null;
}

