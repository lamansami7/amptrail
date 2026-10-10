import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AmpTrail — Keep the record on extra work',
    template: '%s · AmpTrail',
  },
  description: 'A practical field record for electrical subcontractors to capture extra work, supporting evidence, labor, and materials.',
  applicationName: 'AmpTrail',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://getamptrail.vercel.app'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
