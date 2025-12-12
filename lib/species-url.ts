/**
 * Generate a SEO-friendly URL for a species detail page
 * Format: /species/{common-name-slug}-{scientific-name-slug}
 */
export function getSpeciesUrl(
  slugOrFallback: string | number,
  name?: string,
  preferredCommonName?: string | null
): string {
  // If slug is already provided (from database slug column), use it directly
  if (typeof slugOrFallback === 'string' && slugOrFallback.length > 0) {
    return `/species/${slugOrFallback}`;
  }
  
  // Fallback: generate slug from common name and scientific name
  if (!name) {
    // If no name provided, use numeric ID as last resort
    return `/species/${slugOrFallback}`;
  }
  
  const commonNameSlug = preferredCommonName
    ? preferredCommonName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : '';
  const scientificNameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  if (commonNameSlug) {
    return `/species/${commonNameSlug}-${scientificNameSlug}`;
  }
  
  return `/species/${scientificNameSlug}`;
}
