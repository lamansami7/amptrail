import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/analytics/g/collect/route';
import {
  ANALYTICS_ORIGIN,
  createPageViewTracker,
  createSignUpTracker,
  filterAnalyticsHit,
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Google tag initialization', () => {
  it('initializes the correct tag once, disables automatic views/advertising, and uses the privacy relay', () => {
    const dataLayer: unknown[][] = [];
    const window = Object.assign(new EventTarget(), {
      location: { origin: 'https://preview.example.test' },
      dataLayer,
    });
    const ready = vi.fn();
    window.addEventListener(GA_READY_EVENT, ready);
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
    { gcs: 'G100' },
    { en: 'sign_up', 'ep.amptrail_sign_up': '1', gcs: 'G110' },
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
});

describe('first-party GA4 collection endpoint', () => {
  it('forwards a sanitized GET hit without browser cookies, headers, or IP addresses', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const response = await GET(new Request(`https://preview.example.test/api/analytics/g/collect?${hit()}`, {
      headers: { cookie: 'private-session', 'x-forwarded-for': '192.0.2.1', 'user-agent': 'private-browser' },
    }));

    expect(response.status).toBe(204);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(`https://www.google-analytics.com/g/collect?${filterAnalyticsHit(hit())}`);
    expect(options).toMatchObject({ method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store' });
    expect(options).not.toHaveProperty('headers');
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('private');
  });

  it('accepts newline-batched POST events including sanitized sign_up while dropping automatic page views and form data', async () => {
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
        'en=page_view&ep.amptrail_page_view=1&ep.customer=private',
        'en=sign_up&ep.amptrail_sign_up=1&ep.email=private@example.test&ep.company_name=Private+Electric',
      ].join('\n'),
    }));

    expect(response.status).toBe(204);
    expect(fetch).toHaveBeenCalledTimes(2);
    const urls = fetch.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('en=page_view'))).toBe(true);
    expect(urls.some((url) => url.includes('en=sign_up') && url.includes('ep.method=email'))).toBe(true);
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('private');
    expect(JSON.stringify(fetch.mock.calls)).not.toContain('Private');
  });

  it('drops automatic GET events without making any downstream request', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await GET(new Request(`https://preview.example.test/api/analytics/g/collect?${hit({ 'ep.amptrail_page_view': '' })}`));
    expect(response.status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects oversized payloads', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const response = await POST(new Request('https://preview.example.test/api/analytics/g/collect', {
      method: 'POST',
      body: 'x'.repeat(64 * 1024 + 1),
    }));
    expect(response.status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('isolates Google network failures from the application', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('unavailable')));
    const response = await POST(new Request(`https://preview.example.test/api/analytics/g/collect?${hit()}`, { method: 'POST' }));
    expect(response.status).toBe(204);
  });
});
