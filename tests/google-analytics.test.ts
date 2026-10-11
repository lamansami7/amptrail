import { runInNewContext } from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/analytics/g/collect/route';
import {
  ANALYTICS_ORIGIN,
  createPageViewTracker,
  createSignUpTracker,
  filterAnalyticsHit,
  GA_CONSENT_EVENT,
  GA_INITIALIZATION_SCRIPT,
  GA_MEASUREMENT_ID,
  GA_READY_EVENT,
  getAnalyticsPage,
  hasAnalyticsConsent,
  isCompletedSignUp,
  SIGN_UP_STORAGE_KEY,
  trackSignUp,
} from '@/lib/analytics/google-analytics';

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

function hit(overrides: Record<string, string> = {}) {
  return new URLSearchParams({
    v: '2',
    tid: GA_MEASUREMENT_ID,
    cid: '123456789.1760200000',
    en: 'page_view',
    dl: `${ANALYTICS_ORIGIN}/projects/[id]`,
    dt: 'Private customer/project name must not be trusted',
    dr: `${ANALYTICS_ORIGIN}/projects`,
    'ep.amptrail_page_view': '1',
    sid: '1760200000',
    sct: '1',
    seg: '1',
    _ss: '1',
    _et: '25',
    ...overrides,
  });
}

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Google tag initialization', () => {
  it('initializes the correct tag once, disables automatic views/advertising, and uses the privacy relay', () => {
    const dataLayer: unknown[][] = [];
    const window = Object.assign(new EventTarget(), {
      location: { origin: 'https://preview.example.test' },
      dataLayer,
    });
    const ready = vi.fn();
    const consentChanged = vi.fn();
    window.addEventListener(GA_READY_EVENT, ready);
    window.addEventListener(GA_CONSENT_EVENT, consentChanged);
    const context = { window, Event };

    runInNewContext(GA_INITIALIZATION_SCRIPT, context);
    runInNewContext(GA_INITIALIZATION_SCRIPT, context);

    const calls = dataLayer.map((entry) => Array.from(entry));
    expect(calls).toHaveLength(2);
    expect(calls[0][0]).toBe('js');
    expect(calls[1]).toEqual(['config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      allow_enhanced_conversions: false,
      page_location: `${ANALYTICS_ORIGIN}/`,
      page_title: 'AmpTrail',
      page_referrer: '',
      server_container_url: 'https://preview.example.test/api/analytics',
      transport_url: 'https://preview.example.test/api/analytics',
    }]);
    expect(ready).toHaveBeenCalledTimes(1);

    const initializedWindow = window as typeof window & {
      gtag: (...args: unknown[]) => void;
    };
    initializedWindow.gtag('consent', 'update', { analytics_storage: 'granted' });
    expect(consentChanged).toHaveBeenCalledTimes(1);
    expect(Array.from(dataLayer[2])).toEqual([
      'consent',
      'update',
      { analytics_storage: 'granted' },
    ]);
  });
});

describe('privacy-safe route names', () => {
  it.each([
    ['/', '/'],
    ['/contact', '/contact'],
    ['/privacy', '/privacy'],
    ['/terms', '/terms'],
    ['/login?next=%2Ftickets%2Fprivate-id&email=person@example.test', '/login'],
    ['/signup', '/signup'],
    ['/forgot-password', '/forgot-password'],
    ['/reset-password#access_token=private-token', '/reset-password'],
    ['/workspace-setup', '/workspace-setup'],
    ['/dashboard', '/dashboard'],
    ['/projects/', '/projects'],
    ['/projects/new', '/projects/new'],
    ['/projects/customer-project-name?customer=private#photo', '/projects/[id]'],
    ['/projects/private-id/edit', '/projects/[id]/edit'],
    ['/tickets', '/tickets'],
    ['/tickets/new', '/tickets/new'],
    ['/tickets/private-ticket-number', '/tickets/[id]'],
    ['/tickets/private-id/edit?token=private', '/tickets/[id]/edit'],
    ['/evidence', '/evidence'],
    ['/settings', '/settings'],
  ])('reduces %s to %s', (pathname, expected) => {
    expect(getAnalyticsPage(pathname)?.path).toBe(expected);
  });

  it.each(['/auth/callback?code=private', '/customer/person@example.test', '/unknown', '/tickets/a/photos/b'])('does not track unknown route %s', (pathname) => {
    expect(getAnalyticsPage(pathname)).toBeNull();
  });
});

describe('manual page views', () => {
  it('tracks the initial view, client navigation, and return visits without duplicate effects', () => {
    const gtag = vi.fn();
    const track = createPageViewTracker();
    track('/', gtag);
    track('/', gtag);
    track('/contact', gtag);
    track('/contact', gtag);
    track('/', gtag);

    expect(gtag).toHaveBeenCalledTimes(3);
    expect(gtag.mock.calls.map((call) => call[2].page_path)).toEqual(['/', '/contact', '/']);
    expect(gtag.mock.calls[0]).toEqual(['event', 'page_view', {
      send_to: GA_MEASUREMENT_ID,
      page_path: '/',
      page_location: `${ANALYTICS_ORIGIN}/`,
      page_title: 'AmpTrail · Home',
      page_referrer: '',
      user_data: {},
      amptrail_page_view: '1',
    }]);
    expect(gtag.mock.calls[1][2].page_referrer).toBe(`${ANALYTICS_ORIGIN}/`);
  });

  it('counts separate records without putting their IDs, query strings, or fragments in the payload', () => {
    const gtag = vi.fn();
    const track = createPageViewTracker();
    track('/projects/private-customer-one?email=private@example.test#private-token', gtag);
    track('/projects/private-customer-two', gtag);
    track('/tickets/private-work-ticket/edit', gtag);

    expect(gtag).toHaveBeenCalledTimes(3);
    expect(gtag.mock.calls.map((call) => call[2].page_path)).toEqual([
      '/projects/[id]', '/projects/[id]', '/tickets/[id]/edit',
    ]);
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('private');
  });

  it('skips unknown pages and never uses them as referrers', () => {
    const gtag = vi.fn();
    const track = createPageViewTracker();
    track('/', gtag);
    track('/auth/callback?code=private', gtag);
    track('/', gtag);
    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag.mock.calls[1][2].page_referrer).toBe('');
  });

  it('tracks the current page once when analytics consent changes from denied to granted', () => {
    const gtag = vi.fn();
    const consentWindow: Record<string, unknown> = { __amptrailAnalyticsConsent: false };
    vi.stubGlobal('window', consentWindow);
    const track = createPageViewTracker();

    track('/', gtag);
    expect(gtag).not.toHaveBeenCalled();

    consentWindow.__amptrailAnalyticsConsent = true;
    track('/', gtag);
    track('/', gtag);
    expect(gtag).toHaveBeenCalledTimes(1);
  });
});

describe('signup conversion tracking (sign_up)', () => {
  it('recognizes completed new-account registrations for both immediate-session and email-verification flows', () => {
    expect(
      isCompletedSignUp({
        data: {
          user: { id: 'private-user-uuid', identities: [{ id: 'identity-1' }] },
          session: { access_token: 'private-session-token' },
        },
        error: null,
      })
    ).toBe(true);

    expect(
      isCompletedSignUp({
        data: {
          user: { id: 'private-user-uuid', identities: [{ id: 'identity-1' }] },
          session: null,
        },
        error: null,
      })
    ).toBe(true);
  });

  it('rejects failed signups, missing users, and Supabase obfuscated already-registered responses', () => {
    expect(isCompletedSignUp(null)).toBe(false);
    expect(
      isCompletedSignUp({
        data: { user: { id: 'private-user-uuid', identities: [{ id: 'identity-1' }] }, session: null },
        error: new Error('User already registered'),
      })
    ).toBe(false);
    expect(isCompletedSignUp({ data: { user: null, session: null }, error: null })).toBe(false);
    expect(isCompletedSignUp({ data: { user: { id: '   ' }, session: null }, error: null })).toBe(false);
    expect(
      isCompletedSignUp({
        data: { user: { id: 'obfuscated-existing-user', identities: [] }, session: null },
        error: null,
      })
    ).toBe(false);
  });

  it('queues a single sanitized sign_up event without PII, user IDs, or company names', () => {
    const gtag = vi.fn();
    const storage = memoryStorage();
    const track = createSignUpTracker({ storage });

    const sent = track(gtag, {
      data: {
        user: {
          id: '00000000-0000-4000-8000-000000000001',
          identities: [{ id: 'identity-1' }],
        },
        session: null,
      },
      error: null,
    });

    expect(sent).toBe(true);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith('event', 'sign_up', {
      send_to: GA_MEASUREMENT_ID,
      method: 'email',
      page_path: '/signup',
      page_location: `${ANALYTICS_ORIGIN}/signup`,
      page_title: 'AmpTrail · Sign up',
      page_referrer: '',
      user_data: {},
      amptrail_sign_up: '1',
    });
    expect(storage.getItem(SIGN_UP_STORAGE_KEY)).toBe('1');
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('00000000-0000-4000-8000-000000000001');
  });

  it('prevents duplicate sign_up events across rerenders, page refreshes, and repeated callbacks', () => {
    const gtag = vi.fn();
    const sharedSessionStorage = memoryStorage();
    const result = {
      data: {
        user: { id: 'private-user-id', identities: [{ id: 'identity-1' }] },
        session: null,
      },
      error: null,
    };

    const firstTracker = createSignUpTracker({ storage: sharedSessionStorage });
    expect(firstTracker(gtag, result)).toBe(true);
    // Repeated invocation in the same render lifecycle / callback:
    expect(firstTracker(gtag, result)).toBe(false);

    // Simulated page refresh or remount sharing the tab's sessionStorage:
    const refreshedTracker = createSignUpTracker({ storage: sharedSessionStorage });
    expect(refreshedTracker(gtag, result)).toBe(false);

    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it('does not lock out tracking when an earlier signup attempt fails', () => {
    const gtag = vi.fn();
    const storage = memoryStorage();
    const track = createSignUpTracker({ storage });

    expect(
      track(gtag, {
        data: { user: null, session: null },
        error: new Error('Invalid password'),
      })
    ).toBe(false);
    expect(gtag).not.toHaveBeenCalled();

    expect(
      track(gtag, {
        data: { user: { id: 'new-user-id', identities: [{ id: 'identity-1' }] }, session: null },
        error: null,
      })
    ).toBe(true);
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it('queues sign_up once when trackSignUp is called before GA_INITIALIZATION_SCRIPT finishes', () => {
    const gtag = vi.fn();
    const sessionStorage = memoryStorage();
    const mockWindow = Object.assign(new EventTarget(), {
      sessionStorage,
      gtag,
      __amptrailGaInitialized: false,
    });
    vi.stubGlobal('window', mockWindow);

    const validResult = {
      data: { user: { id: 'new-user-id', identities: [{ id: 'identity-1' }] }, session: null },
      error: null,
    };

    expect(trackSignUp(validResult)).toBe(true);
    // Duplicate call before ready event should not schedule a second emission:
    expect(trackSignUp(validResult)).toBe(true);
    expect(gtag).not.toHaveBeenCalled();

    mockWindow.__amptrailGaInitialized = true;
    mockWindow.dispatchEvent(new Event(GA_READY_EVENT));
    expect(gtag).toHaveBeenCalledTimes(1);

    // Subsequent calls after ready event are also deduplicated:
    expect(trackSignUp(validResult)).toBe(false);
    expect(gtag).toHaveBeenCalledTimes(1);
  });
});

describe('cookie-consent preferences', () => {
  it('respects ga-disable, explicit consent globals, Google Consent Mode, cookies, and storage', () => {
    expect(hasAnalyticsConsent({ window: { [`ga-disable-${GA_MEASUREMENT_ID}`]: true } })).toBe(false);
    expect(hasAnalyticsConsent({ window: { __amptrailAnalyticsConsent: false } })).toBe(false);
    expect(
      hasAnalyticsConsent({
        window: {
          dataLayer: [['consent', 'default', { analytics_storage: 'denied' }]],
        },
      })
    ).toBe(false);
    expect(
      hasAnalyticsConsent({
        window: {
          dataLayer: [
            ['consent', 'default', { analytics_storage: 'denied' }],
            ['consent', 'update', { analytics_storage: 'granted' }],
          ],
        },
      })
    ).toBe(true);
    expect(
      hasAnalyticsConsent({
        window: {},
        document: { cookie: 'theme=light; amptrail_consent=denied' },
      })
    ).toBe(false);
    expect(
      hasAnalyticsConsent({
        window: {},
        storage: memoryStorage({ cookie_consent: JSON.stringify({ analytics: false }) }),
      })
    ).toBe(false);
  });

  it('suppresses client-side sign_up and page_view tracking when consent is denied', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', {
      __amptrailGaInitialized: true,
      gtag,
      dataLayer: [['consent', 'default', { analytics_storage: 'denied' }]],
    });

    const trackPage = createPageViewTracker();
    trackPage('/signup', gtag);
    expect(
      trackSignUp({
        data: { user: { id: 'new-user-id', identities: [{ id: 'identity-1' }] }, session: null },
        error: null,
      })
    ).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe('collection privacy boundary', () => {
  it('reconstructs titles/referrers and forwards only safe page/session metadata', () => {
    const input = hit({
      dr: 'https://customer.example.test/private?email=private@example.test',
      uid: 'private-account-id',
      uip: '192.0.2.1',
      'up.email': 'private@example.test',
      em: 'hashed-private-email',
      ec_mode: 'a',
      'ep.user_data.email': 'private@example.test',
      'ep.project_name': 'private-project',
      'ep.link_url': 'https://storage.example.test/private-photo?token=private',
      'ep.form_destination': '/tickets/private-work-ticket',
      gclid: 'private-ad-id',
      npa: '0',
      _s: 'private',
      gcs: 'G111',
      gcd: '13l3l3l3l1',
      dma: '0',
    });
    const output = filterAnalyticsHit(input);
    expect(output).not.toBeNull();
    expect(Object.fromEntries(output!)).toEqual({
      v: '2',
      tid: GA_MEASUREMENT_ID,
      cid: '123456789.1760200000',
      en: 'page_view',
      dl: `${ANALYTICS_ORIGIN}/projects/[id]`,
      dt: 'AmpTrail · Project',
      dr: '',
      'ep.page_path': '/projects/[id]',
      npa: '1',
      sid: '1760200000',
      sct: '1',
      seg: '1',
      _ss: '1',
      _et: '25',
      gcs: 'G111',
      gcd: '13l3l3l3l1',
      dma: '0',
    });
    expect(output!.toString()).not.toContain('private');
    expect(output!.has('ep.amptrail_page_view')).toBe(false);
  });

  it('permits sanitized sign_up events while stripping internal markers and all private user/company fields', () => {
    const input = hit({
      en: 'sign_up',
      dl: `${ANALYTICS_ORIGIN}/signup`,
      dt: 'Miller Electric — foreman@company.com',
      dr: `${ANALYTICS_ORIGIN}/`,
      'ep.amptrail_page_view': '',
      'ep.amptrail_sign_up': '1',
      'ep.method': 'private-should-be-overwritten',
      'ep.email': 'foreman@company.com',
      'ep.password': 'super-secret-password',
      'ep.full_name': 'David Miller',
      'ep.company_name': 'Miller Electric',
      'ep.user_id': '00000000-0000-4000-8000-000000000001',
      uid: '00000000-0000-4000-8000-000000000001',
      'up.email': 'foreman@company.com',
      'up.company': 'Miller Electric',
      gcs: 'G101',
    });
    const output = filterAnalyticsHit(input);
    expect(output).not.toBeNull();
    expect(Object.fromEntries(output!)).toEqual({
      v: '2',
      tid: GA_MEASUREMENT_ID,
      cid: '123456789.1760200000',
      en: 'sign_up',
      dl: `${ANALYTICS_ORIGIN}/signup`,
      dt: 'AmpTrail · Sign up',
      dr: `${ANALYTICS_ORIGIN}/`,
      'ep.page_path': '/signup',
      'ep.method': 'email',
      npa: '1',
      sid: '1760200000',
      sct: '1',
      seg: '1',
      _ss: '1',
      _et: '25',
      gcs: 'G101',
    });
    const serialized = output!.toString();
    expect(serialized).not.toContain('foreman');
    expect(serialized).not.toContain('Miller');
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('00000000');
    expect(output!.has('ep.amptrail_sign_up')).toBe(false);
    expect(output!.has('ep.amptrail_page_view')).toBe(false);
  });

  it('preserves only a previously sanitized same-site referrer', () => {
    expect(filterAnalyticsHit(hit())?.get('dr')).toBe(`${ANALYTICS_ORIGIN}/projects`);
    expect(filterAnalyticsHit(hit({ dr: `${ANALYTICS_ORIGIN}/tickets/private-id` }))?.get('dr')).toBe('');
  });

  it.each<Record<string, string>>([
    { en: 'page_view', 'ep.amptrail_page_view': '' },
    { en: 'page_view', 'ep.amptrail_page_view': '', 'ep.amptrail_sign_up': '1' },
    { en: 'sign_up', 'ep.amptrail_page_view': '', 'ep.amptrail_sign_up': '' },
    { en: 'sign_up', 'ep.amptrail_page_view': '1', 'ep.amptrail_sign_up': '' },
    { en: 'login', 'ep.amptrail_sign_up': '1' },
    { en: 'form_submit' },
    { en: 'file_download' },
    { en: 'click' },
    // Every analytics_storage-denied consent encoding (last character 0):
    { gcs: 'G100' },
    { gcs: 'G110' },
    { gcs: 'G1-0' },
    { gcs: 'G1x0' },
    { en: 'sign_up', 'ep.amptrail_sign_up': '1', gcs: 'G110' },
    { en: 'sign_up', 'ep.amptrail_sign_up': '1', gcs: 'G1x0' },
    { tid: 'G-OTHER' },
    { v: '1' },
    { cid: 'private@example.test' },
    { dl: `${ANALYTICS_ORIGIN}/projects/private-id` },
    { dl: `${ANALYTICS_ORIGIN}/login?email=private@example.test` },
    { dl: `${ANALYTICS_ORIGIN}/reset-password#access_token=private` },
    { dl: `${ANALYTICS_ORIGIN}/unknown` },
    { dl: 'https://customer.example.test/projects' },
    { dl: 'not a URL' },
  ])('drops automatic, unconsented, malformed, or unsanitized hits: %j', (overrides) => {
    expect(filterAnalyticsHit(hit(overrides))).toBeNull();
  });

  it('forwards consent signals whose analytics state is granted or unset', () => {
    // Unset (no Consent Mode) is the normal browser state and must not block data.
    expect(filterAnalyticsHit(hit({ gcs: 'G1-1' }))?.get('gcs')).toBe('G1-1');
    // Unknown ad states with granted analytics must preserve the exact signal.
    expect(filterAnalyticsHit(hit({ gcs: 'G1x1' }))?.get('gcs')).toBe('G1x1');
    expect(filterAnalyticsHit(hit({ gcs: 'G111' }))?.get('gcs')).toBe('G111');
  });
});

describe('first-party GA4 collection endpoint', () => {
  const responseBody = (overrides: Record<string, unknown> = {}) => ({
    ok: true,
    accepted: 1,
    forwarded: 1,
    failed: 0,
    upstream_statuses: [204],
    ...overrides,
  });

  function forwardedParams(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
    const [rawUrl, options] = fetchMock.mock.calls[call];
    const url = new URL(String(rawUrl));
    expect(`${url.origin}${url.pathname}`).toBe('https://www.google-analytics.com/g/collect');
    expect(options).toMatchObject({
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
    });
    expect(options.body).toBeUndefined();
    return url.searchParams;
  }

  it('forwards one sanitized hit in the GA4 web-collection query, never in a form POST body', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const response = await GET(new Request(`https://preview.example.test/api/analytics/g/collect?${hit()}`, {
      headers: { cookie: 'private-session', 'x-forwarded-for': '192.0.2.1', 'user-agent': 'private-browser' },
    }));

    // Keep a non-empty response because this deployed Next/Vercel stack has
    // previously failed while serializing empty route-handler responses.
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual(responseBody());
    expect(fetch).toHaveBeenCalledTimes(1);

    // Protocol-v2 shared fields and a single event belong in /g/collect's URL.
    // The old all-fields-in-a-form-body request received 204 but was not a
    // valid gtag.js wire request and produced zero events in GA.
    expect(forwardedParams(fetch).toString()).toBe(filterAnalyticsHit(hit())!.toString());
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('private');
  });

  it('accepts the real gtag.js GET wire format and forwards only the allowlisted reconstruction', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    // Captured shape of a real gtag.js beacon: protocol/shared parameters plus
    // device metadata and experiment flags on the query string.
    const wireQuery = [
      'v=2',
      `tid=${GA_MEASUREMENT_ID}`,
      'gtm=45je63p1h1v9104254764za200zd9104254764',
      '_p=1774633611846',
      '_gaz=1',
      'gcs=G1-1',
      'gcd=13l3t3l3l5l1',
      'npa=0',
      'dma=0',
      'cid=1943252256.1774633612',
      'ul=en-us',
      'sr=1280x720',
      'uaa=arm',
      'uab=64',
      'uafvl=Not%3AA-Brand%3B99.0.0.0%7CHeadlessChrome%3B145.0.7632.6',
      'uamb=0',
      'uam=',
      'uap=macOS',
      'uapv=26.3.1',
      'uaw=0',
      'are=1',
      'frm=0',
      'pscdl=noapi',
      '_eu=AAAAAGA',
      '_s=1',
      'tag_exp=0~115938466~115938468',
      'sid=1774633612',
      'sct=1',
      'seg=0',
      'en=page_view',
      '_fv=1',
      '_nsi=1',
      '_ss=1',
      '_ee=1',
      '_dbg=1',
      'dt=AmpTrail+%C2%B7+Home',
      `dl=${encodeURIComponent(`${ANALYTICS_ORIGIN}/`)}`,
      'dr=',
      'ep.page_path=%2F',
      'ep.amptrail_page_view=1',
    ].join('&');

    const response = await GET(new Request(`https://preview.example.test/api/analytics/g/collect?${wireQuery}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(responseBody());
    expect(fetch).toHaveBeenCalledTimes(1);
    const forwarded = forwardedParams(fetch);
    expect(forwarded.toString()).toBe(filterAnalyticsHit(new URLSearchParams(wireQuery))!.toString());
    // Reconstructed, never trusted from the request:
    expect(forwarded.get('dt')).toBe('AmpTrail · Home');
    expect(forwarded.get('dl')).toBe(`${ANALYTICS_ORIGIN}/`);
    // Session metadata and non-user protocol markers needed by GA are preserved:
    expect(forwarded.get('sid')).toBe('1774633612');
    expect(forwarded.get('sct')).toBe('1');
    expect(forwarded.get('_ss')).toBe('1');
    expect(forwarded.get('_fv')).toBe('1');
    expect(forwarded.get('_nsi')).toBe('1');
    expect(forwarded.get('gtm')).toBe('45je63p1h1v9104254764za200zd9104254764');
    expect(forwarded.get('_dbg')).toBe('1');
    expect(forwarded.get('gcs')).toBe('G1-1');
    // Everything private or outside the allowlist must not reach Google:
    for (const blocked of ['_gaz', '_eu', '_ee', 'tag_exp', 'ul', 'sr', 'uaa', 'uab', 'uafvl', 'uamb', 'uam', 'uap', 'uapv', 'uaw', 'are', 'frm', 'pscdl', 'ep.amptrail_page_view']) {
      expect(forwarded.has(blocked), `must not forward ${blocked}`).toBe(false);
    }
    // Non-personalized-ads signal is forced on, never trusted from the request:
    expect(forwarded.get('npa')).toBe('1');
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('HeadlessChrome');
  });

  it('accepts the gtag.js hybrid POST used with transport_url and emits a valid single-event GET', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const shared = [
      'v=2',
      `tid=${GA_MEASUREMENT_ID}`,
      'gtm=45je63p1h1v9104254764za200zd9104254764',
      'gcs=G1-1',
      'gcd=13l3t3l3l5l1',
      'dma=0',
      'cid=1943252256.1774633612',
      'frm=0',
      'sid=1774633612',
      'sct=1',
      'seg=0',
    ].join('&');
    // navigator.sendBeacon posts text/plain form data with a \n batch boundary.
    const response = await POST(new Request(`https://preview.example.test/api/analytics/g/collect?${shared}`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=UTF-8' },
      body:
        'en=page_view&dt=AmpTrail+%C2%B7+Home&dl=' +
        encodeURIComponent(`${ANALYTICS_ORIGIN}/`) +
        '&dr=&ep.page_path=%2F&ep.amptrail_page_view=1&_ss=1&_fv=1&_et=25',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(responseBody());
    expect(fetch).toHaveBeenCalledTimes(1);
    const forwarded = forwardedParams(fetch);
    expect(forwarded.get('en')).toBe('page_view');
    expect(forwarded.get('cid')).toBe('1943252256.1774633612');
    expect(forwarded.get('dl')).toBe(`${ANALYTICS_ORIGIN}/`);
    expect(forwarded.get('_et')).toBe('25');
    expect(forwarded.get('gcs')).toBe('G1-1');
  });

  it('accepts a real-wire sign_up event and strips its marker, keeping only method=email', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const shared = `v=2&tid=${GA_MEASUREMENT_ID}&gcs=G111&dma=0&cid=1943252256.1774633612&sid=1774633612&sct=1&seg=1`;
    const response = await POST(new Request(`https://preview.example.test/api/analytics/g/collect?${shared}`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=UTF-8' },
      body:
        'en=sign_up&dt=AmpTrail+%C2%B7+Sign+up&dl=' +
        encodeURIComponent(`${ANALYTICS_ORIGIN}/signup`) +
        '&dr=&ep.page_path=%2Fsignup&ep.amptrail_sign_up=1&ep.method=email&_et=1',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(responseBody());
    expect(fetch).toHaveBeenCalledTimes(1);
    const forwarded = forwardedParams(fetch);
    expect(forwarded.get('en')).toBe('sign_up');
    expect(forwarded.get('ep.method')).toBe('email');
    expect(forwarded.get('dl')).toBe(`${ANALYTICS_ORIGIN}/signup`);
    expect(forwarded.get('dt')).toBe('AmpTrail · Sign up');
    expect(forwarded.has('ep.amptrail_sign_up')).toBe(false);
  });

  it('accepts newline-batched POST events while dropping automatic events and all form/user data', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const query = hit({ dl: `${ANALYTICS_ORIGIN}/signup` });
    query.delete('en');
    query.delete('ep.amptrail_page_view');
    const response = await POST(new Request(`https://preview.example.test/api/analytics/g/collect?${query}`, {
      method: 'POST',
      body: [
        'en=page_view',
        'en=sign_up&ep.email=private@example.test',
        'en=form_submit&ep.form_name=private-customer',
        'en=page_view&ep.amptrail_page_view=1&ep.customer=private&em=hashed-private-email',
        'en=sign_up&ep.amptrail_sign_up=1&ep.email=private@example.test&ep.password=private-password&ep.company_name=Private+Electric',
      ].join('\n'),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual(responseBody({ accepted: 2, forwarded: 2 }));
    expect(fetch).toHaveBeenCalledTimes(2);
    const forwarded = fetch.mock.calls.map((_, index) => forwardedParams(fetch, index));
    expect(forwarded.some((params) => params.get('en') === 'page_view')).toBe(true);
    expect(forwarded.some((params) => params.get('en') === 'sign_up' && params.get('ep.method') === 'email')).toBe(true);
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('private');
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('Private');
    expect(forwarded.every((params) => !params.has('em'))).toBe(true);
  });

  it('reports allowlist rejections without making a downstream request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await GET(new Request(`https://preview.example.test/api/analytics/g/collect?${hit({ 'ep.amptrail_page_view': '' })}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(responseBody({
      accepted: 0,
      forwarded: 0,
      upstream_statuses: [],
    }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects oversized URL and body payloads', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const bodyResponse = await POST(new Request('https://preview.example.test/api/analytics/g/collect', {
      method: 'POST',
      body: 'x'.repeat(64 * 1024 + 1),
    }));
    const urlResponse = await GET(new Request(
      `https://preview.example.test/api/analytics/g/collect?value=${'x'.repeat(64 * 1024)}`
    ));
    const expected = responseBody({ accepted: 0, forwarded: 0, upstream_statuses: [] });
    expect(await bodyResponse.json()).toEqual(expected);
    expect(await urlResponse.json()).toEqual(expected);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('surfaces a Google non-2xx without exposing or treating it as successful forwarding', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('rejected', { status: 500 }));
    vi.stubGlobal('fetch', fetch);
    const response = await GET(new Request(`https://preview.example.test/api/analytics/g/collect?${hit()}`));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual(responseBody({
      ok: false,
      forwarded: 0,
      failed: 1,
      upstream_statuses: [500],
    }));
    expect(console.error).toHaveBeenCalledWith(
      '[amptrail-ga4-relay] upstream failure',
      expect.objectContaining({ accepted: 1, forwarded: 0, failed: 1 })
    );
  });

  it('isolates Google network failures from application workflows but reports relay failure honestly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('unavailable')));
    const response = await POST(new Request(`https://preview.example.test/api/analytics/g/collect?${hit()}`, { method: 'POST' }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual(responseBody({
      ok: false,
      forwarded: 0,
      failed: 1,
      upstream_statuses: [],
    }));
  });
});
