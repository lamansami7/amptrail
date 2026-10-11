export const GA_MEASUREMENT_ID = 'G-MBG985L02V';
export const GA_READY_EVENT = 'amptrail:analytics-ready';
export const ANALYTICS_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || 'https://getamptrail.vercel.app'
).origin;

/** Only generic route names may leave AmpTrail, never record IDs or page content. */
const pages: Readonly<Record<string, string>> = {
  '/': 'Home',
  '/contact': 'Contact',
  '/privacy': 'Privacy',
  '/terms': 'Terms',
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/forgot-password': 'Forgot password',
  '/reset-password': 'Reset password',
  '/workspace-setup': 'Workspace setup',
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'New project',
  '/projects/[id]': 'Project',
  '/projects/[id]/edit': 'Edit project',
  '/tickets': 'Work tickets',
  '/tickets/new': 'New work ticket',
  '/tickets/[id]': 'Work ticket',
  '/tickets/[id]/edit': 'Edit work ticket',
  '/evidence': 'Evidence',
  '/settings': 'Settings',
};

type AnalyticsPage = { path: string; title: string };
export type Gtag = (...args: unknown[]) => void;

/** Unknown routes (including auth callbacks) are deliberately not measured. */
export function getAnalyticsPage(pathname: string): AnalyticsPage | null {
  let path = pathname.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';

  if (!Object.hasOwn(pages, path)) {
    path = path
      .replace(/^\/projects\/[^/]+(\/edit)?$/, '/projects/[id]$1')
      .replace(/^\/tickets\/[^/]+(\/edit)?$/, '/tickets/[id]$1');
  }

  return Object.hasOwn(pages, path) ? { path, title: `AmpTrail · ${pages[path]}` } : null;
}

/** Queue manual page views, including distinct records sharing the same safe route name. */
export function createPageViewTracker() {
  let lastPathname: string | null = null;
  let previousPage: AnalyticsPage | null = null;

  return (pathname: string, gtag: Gtag) => {
    // Avoid duplicate effects in React Strict Mode, not legitimate back/forward visits.
    if (pathname === lastPathname) return;
    lastPathname = pathname;

    const page = getAnalyticsPage(pathname);
    if (page) {
      gtag('event', 'page_view', {
        send_to: GA_MEASUREMENT_ID,
        page_path: page.path,
        page_location: `${ANALYTICS_ORIGIN}${page.path}`,
        page_title: page.title,
        page_referrer: previousPage ? `${ANALYTICS_ORIGIN}${previousPage.path}` : '',
        // Event-only marker: automatic/enhanced-measurement events never receive it.
        amptrail_page_view: '1',
      });
    }
    previousPage = page;
  };
}

/**
 * The tag uses a first-party collection endpoint. Its strict allowlist below also
 * protects against Enhanced Measurement enabled in the GA property's settings.
 * Bootstrap before the remote script, so slow/blocked downloads don't race route tracking.
 */
export const GA_INITIALIZATION_SCRIPT = `
  if (!window.__amptrailGaInitialized) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', '${GA_MEASUREMENT_ID}', {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false,
      page_location: ${JSON.stringify(`${ANALYTICS_ORIGIN}/`)},
      page_title: 'AmpTrail',
      page_referrer: '',
      server_container_url: window.location.origin + '/api/analytics',
      transport_url: window.location.origin + '/api/analytics'
    });
    window.__amptrailGaInitialized = true;
    window.dispatchEvent(new Event('${GA_READY_EVENT}'));
  }
`;

function getSafeLocation(value: string | null): AnalyticsPage | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.origin !== ANALYTICS_ORIGIN || url.username || url.password || url.search || url.hash) return null;
    // Unlike getAnalyticsPage, this accepts only already-sanitized, exact templates.
    return Object.hasOwn(pages, url.pathname)
      ? { path: url.pathname, title: `AmpTrail · ${pages[url.pathname]}` }
      : null;
  } catch {
    return null;
  }
}

/**
 * Rebuild the GA4 collection payload instead of forwarding arbitrary parameters.
 * No user IDs/properties, DOM/form/link data, campaign queries, IP addresses,
 * customer information, or project/ticket content can pass this boundary.
 */
export function filterAnalyticsHit(input: URLSearchParams): URLSearchParams | null {
  if (
    input.get('v') !== '2' ||
    input.get('tid') !== GA_MEASUREMENT_ID ||
    input.get('en') !== 'page_view' ||
    input.get('ep.amptrail_page_view') !== '1'
  ) return null;

  const page = getSafeLocation(input.get('dl'));
  const clientId = input.get('cid') || '';
  // The tag's anonymous cookie ID, never an AmpTrail account/workspace ID.
  if (!page || !/^\d{1,20}\.\d{1,20}$/.test(clientId)) return null;

  const referrer = getSafeLocation(input.get('dr'));
  const output = new URLSearchParams({
    v: '2',
    tid: GA_MEASUREMENT_ID,
    cid: clientId,
    en: 'page_view',
    dl: `${ANALYTICS_ORIGIN}${page.path}`,
    dt: page.title,
    dr: referrer ? `${ANALYTICS_ORIGIN}${referrer.path}` : '',
    'ep.page_path': page.path,
    npa: '1',
  });

  // Numeric session/engagement metadata preserves GA's page-view/session counts.
  for (const key of ['_p', '_s', '_ss', '_fv', '_et', 'sid', 'sct', 'seg']) {
    const value = input.get(key);
    if (value && /^\d{1,20}$/.test(value)) output.set(key, value);
  }

  // Preserve valid consent signals; never forward arbitrary strings from a request.
  for (const [key, pattern] of [
    ['gcs', /^G1[01-]{2}$/],
    ['gcd', /^[a-z0-9]{1,32}$/i],
    ['dma', /^[01]$/],
  ] as const) {
    const value = input.get(key);
    if (value && pattern.test(value)) output.set(key, value);
  }

  return output;
}
