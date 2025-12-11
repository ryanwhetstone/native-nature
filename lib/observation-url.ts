/**
 * Generate a SEO-friendly URL for an observation detail page
 * Format: /observation/{observationId}-{species-name-slug}
 */
export function getObservationUrl(
  observationId: number | string,
  speciesName: string,
  preferredCommonName?: string | null
): string {
  const displayName = preferredCommonName || speciesName;
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `/observation/${observationId}-${slug}`;
}
