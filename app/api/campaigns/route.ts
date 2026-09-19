import { NextResponse } from 'next/server';

export const maxDuration = 60;

const BASE = 'https://api.systeme.io/api';

async function tryFetch(path: string, key: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': key },
    cache: 'no-store',
  });
  return { status: res.status, ok: res.ok, data: res.ok ? await res.json() : null };
}

export async function GET() {
  const key = process.env.SYSTEMEIO_API_KEY;
  if (!key) return NextResponse.json({ error: 'SYSTEMEIO_API_KEY manquante' }, { status: 500 });

  // Try all plausible newsletter/campaign endpoints
  const endpoints = [
    '/newsletters?limit=25',
    '/email-campaigns?limit=25',
    '/email_campaigns?limit=25',
    '/broadcasts?limit=25',
    '/campaigns?limit=25',
    '/emails?limit=25',
  ];

  const results: Record<string, unknown> = {};
  for (const ep of endpoints) {
    const r = await tryFetch(ep, key);
    results[ep] = { status: r.status, hasItems: r.data?.items?.length ?? null, sample: r.data?.items?.[0] ?? null };
  }

  return NextResponse.json(results);
}
