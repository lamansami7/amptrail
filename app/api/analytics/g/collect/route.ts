import { filterAnalyticsHit } from '@/lib/analytics/google-analytics';

const MAX_REQUEST_LENGTH = 64 * 1024;
const MAX_BATCH_EVENTS = 20;
const GOOGLE_COLLECTION_ENDPOINT = 'https://www.google-analytics.com/g/collect';

type ForwardResult =
  | { ok: true; status: number }
  | { ok: false; status: number | null };

/**
 * The Google tag treats collection as fire-and-forget, but a non-empty JSON
 * response is intentional: this Next/Vercel stack has previously returned an
 * opaque 500 while serializing empty route-handler responses.
 *
 * Never include request parameters in this response or in logs. Even rejected
 * browser payloads can contain data that is outside the relay's allowlist.
 */
function resultResponse(options: {
  accepted: number;
  forwarded: number;
  failed: number;
  statuses?: number[];
}) {
  const { accepted, forwarded, failed, statuses = [] } = options;
  return Response.json(
    {
      ok: failed === 0,
      accepted,
      forwarded,
      failed,
      // A Google 2xx proves only that the collection endpoint received the
      // HTTP request. It does not prove that GA processed the event.
      upstream_statuses: [...new Set(statuses)],
    },
    {
      status: failed === 0 ? 200 : 502,
      headers: { 'cache-control': 'no-store' },
    }
  );
}

async function forwardHit(safeHit: URLSearchParams): Promise<ForwardResult> {
  // GA4 web collection protocol v2 puts shared fields (v/tid/cid) in the URL.
  // A single event is also placed in that URL; only additional batched events
  // use newline-delimited request bodies. Putting the entire hit in an
  // application/x-www-form-urlencoded POST body gets a misleading 204 from
  // /g/collect but is not a valid gtag.js wire request and is silently dropped.
  const upstream = new URL(GOOGLE_COLLECTION_ENDPOINT);
  safeHit.forEach((value, key) => upstream.searchParams.append(key, value));

  try {
    const response = await fetch(upstream, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok
      ? { ok: true, status: response.status }
      : { ok: false, status: response.status };
  } catch {
    return { ok: false, status: null };
  }
}

async function collect(request: Request) {
  if (
    request.url.length > MAX_REQUEST_LENGTH ||
    Number(request.headers.get('content-length')) > MAX_REQUEST_LENGTH
  ) {
    return resultResponse({ accepted: 0, forwarded: 0, failed: 0 });
  }

  const query = new URL(request.url).searchParams;
  const body = request.method === 'POST' ? await request.text() : '';
  if (body.length > MAX_REQUEST_LENGTH) {
    return resultResponse({ accepted: 0, forwarded: 0, failed: 0 });
  }

  // gtag.js can put shared fields in the query and one or more event-specific
  // field sets in a newline-delimited text body. Rebuild every event from the
  // privacy allowlist before making any request to Google.
  const events = body ? body.split(/\r?\n/).filter(Boolean) : [''];
  const safeHits: URLSearchParams[] = [];
  for (const event of events.slice(0, MAX_BATCH_EVENTS)) {
    const input = new URLSearchParams(query);
    new URLSearchParams(event).forEach((value, key) => input.set(key, value));
    const safeHit = filterAnalyticsHit(input);
    if (safeHit) safeHits.push(safeHit);
  }

  const results = await Promise.all(safeHits.map(forwardHit));
  const statuses = results
    .map((result) => result.status)
    .filter((status): status is number => status !== null);
  const forwarded = results.filter((result) => result.ok).length;
  const failed = results.length - forwarded;

  // Structured operational evidence without client IDs, URLs, titles, headers,
  // user data, or raw Google payloads. Vercel runtime logs can distinguish an
  // allowlist rejection, an upstream 2xx, and an actual delivery failure.
  if (safeHits.length > 0) {
    const summary = {
      accepted: safeHits.length,
      forwarded,
      failed,
      upstream_statuses: [...new Set(statuses)],
    };
    if (failed > 0) {
      console.error('[amptrail-ga4-relay] upstream failure', summary);
    } else {
      console.info('[amptrail-ga4-relay] upstream response', summary);
    }
  }

  return resultResponse({
    accepted: safeHits.length,
    forwarded,
    failed,
    statuses,
  });
}

export const GET = collect;
export const POST = collect;
