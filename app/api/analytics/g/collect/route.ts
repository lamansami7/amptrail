import { filterAnalyticsHit } from '@/lib/analytics/google-analytics';

const MAX_BODY_LENGTH = 64 * 1024;
const MAX_BATCH_EVENTS = 20;

async function collect(request: Request) {
  try {
  const query = new URL(request.url).searchParams;
  if (Number(request.headers.get('content-length')) > MAX_BODY_LENGTH) {
    return new Response(null, { status: 204 });
  }

  const body = request.method === 'POST' ? await request.text() : '';
  if (body.length > MAX_BODY_LENGTH) return new Response(null, { status: 204 });

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

  return new Response(null, { status: 204 });
  } catch (error) {
    // TEMPORARY DIAGNOSTIC (remove before final): surface the exact failure.
    const details = {
      handlerError: true,
      node: process.version,
      type: typeof error,
      isErr: error instanceof Error,
      name: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : undefined,
      text: error instanceof Error ? undefined : (() => {
        try {
          return JSON.stringify(error)?.slice(0, 400);
        } catch {
          return String(error);
        }
      })(),
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 8) : undefined,
      url: typeof request?.url === 'string' ? request.url : null,
      method: request?.method ?? null,
    };
    return new Response(JSON.stringify(details), {
      status: 599,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export const GET = collect;
export const POST = collect;
