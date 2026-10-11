import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/**
 * Inter is self-hosted (no third-party font request, no layout shift) and
 * exposes a variable font so every weight in the type scale is available.
 */
const inter = localFont({
  src: [
    {
      path: '../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'AmpTrail — Extra work, fully documented',
    template: '%s · AmpTrail',
  },
  description:
    'AmpTrail is the field record for electrical subcontractors: capture extra work, crew labor, materials, and jobsite photos, then hand over a professional T&M document.',
  applicationName: 'AmpTrail',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://getamptrail.vercel.app'),
};

export const viewport: Viewport = {
  themeColor: '#f6f8fb',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
