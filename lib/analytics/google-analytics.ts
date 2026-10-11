export const GA_MEASUREMENT_ID = 'G-MBG985L02V';
export const GA_READY_EVENT = 'amptrail:analytics-ready';
export const SIGN_UP_STORAGE_KEY = 'amptrail:ga4:sign_up_tracked';
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

export type SignUpAuthResult = {
  data?: {
    user?: {
      id?: string | null;
      identities?: readonly unknown[] | null;
    } | null;
    session?: unknown;
  } | null;
  error?: unknown;
};

type ConsentStorage = Pick<Storage, 'getItem'>;
type SignUpStorage = Pick<Storage, 'getItem' | 'setItem'>;

const CONSENT_PREFERENCE_KEYS = [
  'amptrail_analytics_consent',
  'amptrail_consent',
  'cookie_consent',
  'ga_consent',
] as const;

function isDeniedPreferenceValue(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  if (
    normalized === 'denied' ||
    normalized === 'false' ||
    normalized === '0' ||
    normalized === 'no' ||
    normalized === 'opt_out' ||
    normalized === 'opt-out' ||
    normalized === 'rejected'
  ) {
    return true;
  }

  if (normalized.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (
        parsed.analytics === false ||
        parsed.analytics === 'denied' ||
        parsed.analytics_storage === 'denied'
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

function readCookieValue(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    if (rawKey?.trim() === name) {
      const rawValue = rest.join('=').trim();
      try {
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }
  return null;
}

/**
 * Checks whether analytics measurement is permitted by the visitor's cookie-consent
 * preferences, standard Google opt-out globals, or Google Consent Mode state.
 */
export function hasAnalyticsConsent(target?: {
  window?: Record<string, unknown> | null;
  document?: { cookie?: string } | null;
  storage?: ConsentStorage | null;
}): boolean {
  const win =
    target?.window !== undefined
      ? target.window
      : typeof window !== 'undefined'
        ? (window as unknown as Record<string, unknown>)
        : null;

  if (!win) return true;
  if (win[`ga-disable-${GA_MEASUREMENT_ID}`] === true) return false;
  if (win.__amptrailAnalyticsConsent === false) return false;

  if (Array.isArray(win.dataLayer)) {
    let consentModeAllowed: boolean | null = null;
    for (const entry of win.dataLayer) {
      const args = Array.isArray(entry)
        ? entry
        : typeof entry === 'object' && entry !== null && 'length' in entry
          ? Array.from(entry as ArrayLike<unknown>)
          : null;
      if (
        args &&
        args[0] === 'consent' &&
        (args[1] === 'default' || args[1] === 'update') &&
        typeof args[2] === 'object' &&
        args[2] !== null
      ) {
        const storageState = (args[2] as { analytics_storage?: unknown }).analytics_storage;
        if (storageState === 'denied') consentModeAllowed = false;
        if (storageState === 'granted') consentModeAllowed = true;
      }
    }
    if (consentModeAllowed === false) return false;
  }

  const doc =
    target?.document !== undefined
      ? target.document
      : typeof document !== 'undefined'
        ? document
        : null;
  if (doc?.cookie) {
    for (const key of CONSENT_PREFERENCE_KEYS) {
      if (isDeniedPreferenceValue(readCookieValue(doc.cookie, key))) return false;
    }
  }

  const storage =
    target?.storage !== undefined
      ? target.storage
      : (() => {
          try {
            return typeof window !== 'undefined' ? window.localStorage : null;
          } catch {
            return null;
          }
        })();
  if (storage) {
    for (const key of CONSENT_PREFERENCE_KEYS) {
      try {
        if (isDeniedPreferenceValue(storage.getItem(key))) return false;
      } catch {
        // Ignore storage read errors in restricted browsing modes.
      }
    }
  }

  return true;
}

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
    if (!hasAnalyticsConsent()) return;

    const page = getAnalyticsPage(pathname);
    if (page) {
      try {
        gtag('event', 'page_view', {
          send_to: GA_MEASUREMENT_ID,
          page_path: page.path,
          page_location: `${ANALYTICS_ORIGIN}${page.path}`,
          page_title: page.title,
          page_referrer: previousPage ? `${ANALYTICS_ORIGIN}${previousPage.path}` : '',
          // Event-only marker: automatic/enhanced-measurement events never receive it.
          amptrail_page_view: '1',
        });
      } catch {
        // Analytics failures must never interrupt navigation.
      }
    }
    previousPage = page;
  };
}

/**
 * A signup is complete only when Supabase Auth returns a newly created user record
 * without error. When email confirmation is enabled and an already-registered email
 * is submitted, Supabase returns an obfuscated user with an empty identities array;
 * that must not be counted as a new signup conversion.
 */
export function isCompletedSignUp(result: SignUpAuthResult | null | undefined): boolean {
  if (!result || result.error) return false;
  const user = result.data?.user;
  if (!user || typeof user.id !== 'string' || !user.id.trim()) return false;
  if (Array.isArray(user.identities) && user.identities.length === 0) return false;
  return true;
}

/**
 * Queue a single sanitized GA4 `sign_up` conversion event for a completed registration.
 * Deduplicates in memory and sessionStorage so rerenders, refreshes, or repeated callbacks
 * cannot emit duplicate conversion events.
 */
export function createSignUpTracker(options?: {
  storage?: SignUpStorage | null;
  hasConsent?: () => boolean;
}) {
  let tracked = false;

  const resolveStorage = (): SignUpStorage | null => {
    if (options && 'storage' in options) return options.storage ?? null;
    try {
      return typeof window !== 'undefined' ? window.sessionStorage : null;
    } catch {
      return null;
    }
  };

  const checkConsent = options?.hasConsent ?? (() => hasAnalyticsConsent());

  return (gtag: Gtag, result?: SignUpAuthResult): boolean => {
    if (result !== undefined && !isCompletedSignUp(result)) return false;
    if (!checkConsent()) return false;
    if (tracked) return false;

    const storage = resolveStorage();
    try {
      if (storage?.getItem(SIGN_UP_STORAGE_KEY) === '1') {
        tracked = true;
        return false;
      }
    } catch {
      // Ignore restricted sessionStorage access.
    }

    tracked = true;
    try {
      storage?.setItem(SIGN_UP_STORAGE_KEY, '1');
    } catch {
      // In-memory flag still deduplicates within the current runtime.
    }

    try {
      gtag('event', 'sign_up', {
        send_to: GA_MEASUREMENT_ID,
        method: 'email',
        page_path: '/signup',
        page_location: `${ANALYTICS_ORIGIN}/signup`,
        page_title: `AmpTrail · ${pages['/signup']}`,
        page_referrer: '',
        // Event-only marker: automatic/enhanced-measurement events never receive it.
        amptrail_sign_up: '1',
      });
    } catch {
      // Analytics failures must never interrupt authentication workflows.
    }

    return true;
  };
}

const windowSignUpTrackers = new WeakMap<
  object,
  { tracker: ReturnType<typeof createSignUpTracker>; waitingForReady: boolean }
>();

/**
 * Browser entrypoint for tracking a completed account creation. Safe to call before
 * or after the `afterInteractive` Google tag initialization script has run.
 */
export function trackSignUp(result?: SignUpAuthResult): boolean {
  if (result !== undefined && !isCompletedSignUp(result)) return false;
  if (typeof window === 'undefined') return false;
  if (!hasAnalyticsConsent()) return false;

  const win = window as Window & {
    gtag?: Gtag;
    __amptrailGaInitialized?: boolean;
  };

  let state = windowSignUpTrackers.get(win);
  if (!state) {
    state = { tracker: createSignUpTracker(), waitingForReady: false };
    windowSignUpTrackers.set(win, state);
  }

  if (win.__amptrailGaInitialized && typeof win.gtag === 'function') {
    return state.tracker(win.gtag, result);
  }

  try {
    if (win.sessionStorage?.getItem(SIGN_UP_STORAGE_KEY) === '1') return false;
  } catch {
    // Ignore restricted sessionStorage access.
  }

  if (!state.waitingForReady && typeof win.addEventListener === 'function') {
    state.waitingForReady = true;
    const onReady = () => {
      if (state) state.waitingForReady = false;
      win.removeEventListener?.(GA_READY_EVENT, onReady);
      if (win.__amptrailGaInitialized && typeof win.gtag === 'function') {
        state?.tracker(win.gtag, result);
      }
    };
    win.addEventListener(GA_READY_EVENT, onReady);
  }

  return true;
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
  if (input.get('v') !== '2' || input.get('tid') !== GA_MEASUREMENT_ID) return null;

  const eventName = input.get('en');
  const isPageView = eventName === 'page_view' && input.get('ep.amptrail_page_view') === '1';
  const isSignUp = eventName === 'sign_up' && input.get('ep.amptrail_sign_up') === '1';
  if (!isPageView && !isSignUp) return null;

  // Drop hits when Google Consent Mode explicitly denies analytics_storage.
  // The last character of the consent string is the analytics state
  // (1 = granted, 0 = denied), so any middle-character encoding (G100, G110,
  // G1-0, G1x0, …) that ends in 0 must be treated as a denial.
  const gcs = input.get('gcs');
  if (gcs && /^G1.0$/.test(gcs)) return null;

  const rawPage = getSafeLocation(input.get('dl'));
  const clientId = input.get('cid') || '';
  // The tag's anonymous cookie ID, never an AmpTrail account/workspace ID.
  if (!rawPage || !/^\d{1,20}\.\d{1,20}$/.test(clientId)) return null;

  const page = isSignUp ? { path: '/signup', title: `AmpTrail · ${pages['/signup']}` } : rawPage;
  const referrer = getSafeLocation(input.get('dr'));
  const output = new URLSearchParams({
    v: '2',
    tid: GA_MEASUREMENT_ID,
    cid: clientId,
    en: isSignUp ? 'sign_up' : 'page_view',
    dl: `${ANALYTICS_ORIGIN}${page.path}`,
    dt: page.title,
    dr: referrer ? `${ANALYTICS_ORIGIN}${referrer.path}` : '',
    'ep.page_path': page.path,
    ...(isSignUp ? { 'ep.method': 'email' } : {}),
    npa: '1',
  });

  // Numeric session/engagement metadata preserves GA's page-view/session counts.
  for (const key of ['_p', '_s', '_ss', '_fv', '_et', 'sid', 'sct', 'seg']) {
    const value = input.get(key);
    if (value && /^\d{1,20}$/.test(value)) output.set(key, value);
  }

  // Preserve valid consent signals; never forward arbitrary strings from a request.
  // (Denied analytics states were already dropped above; x/- mean unset, not denied.)
  for (const [key, pattern] of [
    ['gcs', /^G1[01x-]{2}$/],
    ['gcd', /^[a-z0-9]{1,32}$/i],
    ['dma', /^[01]$/],
  ] as const) {
    const value = input.get(key);
    if (value && pattern.test(value)) output.set(key, value);
  }

  return output;
}
