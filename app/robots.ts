import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getamptrail.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/projects', '/tickets', '/evidence', '/settings', '/workspace-setup', '/auth/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
