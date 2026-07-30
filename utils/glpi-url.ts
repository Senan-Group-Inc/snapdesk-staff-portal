/** Public GLPI UI URL for links in the staff portal. */
export function glpiLoginUrl(): string {
  return (
    process.env.NEXT_PUBLIC_GLPI_URL ||
    'https://glpi.senangroupafrica.com'
  );
}
