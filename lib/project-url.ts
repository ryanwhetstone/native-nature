/**
 * Generate a SEO-friendly URL for a conservation project detail page
 * Format: /conservation-project/{projectId}-{project-title-slug}
 */
export function getProjectUrl(
  projectId: number | string,
  projectTitle: string
): string {
  const slug = projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `/conservation-project/${projectId}-${slug}`;
}

/**
 * Parse project ID from a slug
 * Format: {projectId}-{project-title-slug}
 */
export function parseProjectSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)-/);
  return match ? parseInt(match[1]) : null;
}
