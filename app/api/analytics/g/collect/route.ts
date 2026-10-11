import { filterAnalyticsHit } from '@/lib/analytics/google-analytics';

const MAX_BODY_LENGTH = 64 * 1024;
const MAX_BATCH_EVENTS = 20;

/**
 * The Google tag never reads the relay's response (sendBeacon/image/fetch all
 * fire-and-forget), so the status and body are a platform concern.
 *
 * This stack (Next 16 on Vercel's Node 22 runtime) crashes with an opaque
 * 500 when serializing null- or empty-body route-handler responses (verified
 * in production: null+204, null+200, ''+200 all 500), while Node's fetch
 * implementation rejects non-null bodies on 204. The one response shape that
 * is valid on Node AND serializes cleanly on Vercel is a small non-empty
 * JSON 200 — verified in production before this fix.
 */
function ok() {
  return Response.json({ ok: true });
}

async function collect(request: Request) {
  const query = new URL(request.url).searchParams;
  if (Number(request.headers.get('content-length')) > MAX_BODY_LENGTH) {
    return ok();
  }

  const body = request.method === 'POST' ? await request.text() : '';
  if (body.length > MAX_BODY_LENGTH) return ok();

  // Google tag may batch event-specific parameters as newline-separated form data.
  const events = body ? body.split(/\r?\n/).filter(Boolean) : [''];
  await Promise.all(events.slice(0, MAX_BATCH_EVENTS).map(async (event) => {
    const input = new URLSearchParams(query);
    new URLSearchParams(event).forEach((value, key) => input.set(key, value));
    const safeHit = filterAnalyticsHit(input);
    if (!safeHit) return;

    try {
      // Fixed destination, fresh allowlisted payload, no browser headers/cookies/IP.
      // GA4 ingests server-to-server hits as a form-encoded POST body. Query-
      // string-only POSTs from a server IP are not treated as valid hits by
      // google-analytics.com/g/collect, so the reconstructed parameters go in
      // the body, never the URL.
      await fetch('https://www.google-analytics.com/g/collect', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: safeHit.toString(),
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Analytics failures must never affect the website or expose request data in logs.
    }
  }));

  return ok();
}

export const GET = collect;
export const POST = collect;
