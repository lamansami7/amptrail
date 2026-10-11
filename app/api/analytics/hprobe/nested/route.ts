/**
 * TEMPORARY DIAGNOSTIC ROUTE — remove before final deployment.
 * Same handler as hprobe but at a nested path (mirrors g/collect's depth).
 */
import type { NextRequest } from 'next/server';

async function probe(request: NextRequest) {
  const shape = new URL(request.url).searchParams.get('shape') ?? 'json';
  if (shape === 'null204') return new Response(null, { status: 204 });
  if (shape === 'empty200') return new Response('', { status: 200 });
  if (shape === 'null200') return new Response(null, { status: 200 });
  return Response.json({ ok: true, shape, method: request.method, nested: true });
}

export const GET = probe;
export const POST = probe;
