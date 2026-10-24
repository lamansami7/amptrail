import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { GoogleAnalyticsPageViews } from '@/components/analytics/google-analytics-page-views';
import { GA_INITIALIZATION_SCRIPT, GA_MEASUREMENT_ID } from '@/lib/analytics/google-analytics';
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getamptrail.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'AmpTrail — Extra work, fully documented',
    template: '%s · AmpTrail',
  },
  description:
    'AmpTrail is the field record for electrical subcontractors: capture extra work, crew labor, materials, and jobsite photos, then hand over a professional T&M document.',
  applicationName: 'AmpTrail',
  metadataBase: new URL(siteUrl),
  keywords: [
    'electrical subcontractor',
    'time and material',
    'T&M documentation',
    'extra work tracking',
    'work tickets',
    'jobsite evidence',
    'construction documentation',
  ],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'AmpTrail',
    title: 'AmpTrail — Document the work. Protect the paper trail.',
    description:
      'Capture extra work, track labor and materials, and organize jobsite evidence — all in one workspace built for electrical subcontractors.',
    url: siteUrl,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'AmpTrail — document the work, protect the paper trail.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AmpTrail — Document the work. Protect the paper trail.',
    description:
      'Capture extra work, track labor and materials, and organize jobsite evidence — all in one workspace built for electrical subcontractors.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body>
        <a
          href="#main"
          className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-ink px-4 py-3 font-semibold text-white shadow-lg focus:not-sr-only"
        >
          Skip to main content
        </a>
        {children}
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: GA_INITIALIZATION_SCRIPT }}
        />
        <Script
          id="ga4-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
          referrerPolicy="origin"
        />
        <GoogleAnalyticsPageViews />
      </body>
    </html>
  );
}
