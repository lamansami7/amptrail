/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [] },
  allowedDevOrigins: ['*.e2b.app'],
  async redirects() {
    // The app used to live at /app.html; keep old bookmarks and links working.
    return [
      { source: '/app.html', destination: '/dashboard', permanent: false },
      { source: '/app', destination: '/dashboard', permanent: false },
    ];
  },
};

export default nextConfig;
