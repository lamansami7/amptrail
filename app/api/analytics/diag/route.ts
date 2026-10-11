/**
 * TEMPORARY DIAGNOSTIC ROUTE — remove before final deployment.
 *
 * Reproduces the /api/analytics/g/collect handler inside the same function
 * runtime and reports the exact failure instead of the opaque
 * {"error":"undefined: undefined"} 500 body.
 */
import type { NextRequest } from 'next/server';

function describe(value: unknown): Record<string, unknown> {
  if (value instanceof Error) {
    return { type: 'Error', name: value.name, message: value.message, stack: value.stack?.split('\n').slice(0, 6) };
  }
  let text: string;
  try {
    text = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    text = String(value);
  }
  return { type: typeof value, ctor: (value as object | null)?.constructor?.name ?? null, text: text?.slice(0, 500) };
}

export async function GET(request: NextRequest) {
  const report: Record<string, unknown> = {
    node: process.version,
    nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  };

  try {
    const mod = await import('@/lib/analytics/google-analytics');
    report.analyticsModule = { loaded: true, origin: mod.ANALYTICS_ORIGIN, measurementId: mod.GA_MEASUREMENT_ID };
  } catch (error) {
    report.analyticsModule = { loaded: false, error: describe(error) };
    return Response.json(report, { status: 500 });
  }

  try {
    const route = await import('@/app/api/analytics/g/collect/route');
    for (const qs of ['', 'foo=bar', 'v=2&tid=G-MBG985L02V&en=page_view']) {
      const key = `handler:${qs || 'empty'}`;
      try {
        const res = await route.GET(new Request(`${request.nextUrl.origin}/api/analytics/g/collect?${qs}`));
        const text = await res.text();
        report[key] = { ok: true, status: res.status, body: text.slice(0, 300) };
      } catch (error) {
        report[key] = { ok: false, error: describe(error) };
      }
    }
  } catch (error) {
    report.handlerImport = { ok: false, error: describe(error) };
  }

  return Response.json(report);
}
