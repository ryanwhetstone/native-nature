/**
 * Generate a SEO-friendly URL for a species detail page
 * Format: /species/{taxonId}-{species-name-slug}
 */
export function getSpeciesUrl(
  taxonId: number | string,
  name: string,
  preferredCommonName?: string | null
): string {
  const displayName = preferredCommonName || name;
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `/species/${taxonId}-${slug}`;
}
