import { filterAnalyticsHit } from '@/lib/analytics/google-analytics';

const MAX_BODY_LENGTH = 64 * 1024;
const MAX_BATCH_EVENTS = 20;

async function collect(request: Request) {
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
      await fetch(`https://www.google-analytics.com/g/collect?${safeHit}`, {
        method: 'POST',
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
}

export const GET = collect;
export const POST = collect;
