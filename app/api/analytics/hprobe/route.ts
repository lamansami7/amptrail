/**
 * TEMPORARY DIAGNOSTIC ROUTE — remove before final deployment.
 * Tests which response shape / path shape Vercel/Next 500s on.
 */
import type { NextRequest } from 'next/server';

async function probe(request: NextRequest) {
  const shape = new URL(request.url).searchParams.get('shape') ?? 'json';
  if (shape === 'null204') return new Response(null, { status: 204 });
  if (shape === 'empty200') return new Response('', { status: 200 });
  if (shape === 'null200') return new Response(null, { status: 200 });
  if (shape === 'ct204empty') return new Response('', { status: 204, headers: { 'content-type': 'text/plain' } });
  if (shape === 'ct200null') return new Response(null, { status: 200, headers: { 'content-type': 'text/plain' } });
  if (shape === 'ct200empty') return new Response('', { status: 200, headers: { 'content-type': 'text/plain' } });
  if (shape === 'body204') return new Response('ok', { status: 204, headers: { 'content-type': 'text/plain' } });
  return Response.json({ ok: true, shape, method: request.method });
}

export const GET = probe;
export const POST = probe;
