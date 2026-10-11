import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getamptrail.vercel.app';

/** Public marketing and account pages only — workspace routes are private. */
export default function sitemap(): MetadataRoute.Sitemap {
  const publicPaths = [
    { path: '', priority: 1 },
    { path: '/login', priority: 0.7 },
    { path: '/signup', priority: 0.8 },
    { path: '/forgot-password', priority: 0.4 },
    { path: '/contact', priority: 0.6 },
    { path: '/privacy', priority: 0.4 },
    { path: '/terms', priority: 0.4 },
  ];

  return publicPaths.map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority,
  }));
}
