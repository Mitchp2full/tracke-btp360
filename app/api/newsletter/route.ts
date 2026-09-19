import { NextResponse } from 'next/server';

const BASE = 'https://api.systeme.io/api';

async function sioFetch(path: string) {
  const key = process.env.SYSTEMEIO_API_KEY;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': key! },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`systeme.io ${path} → ${res.status}`);
  return res.json();
}

export async function GET() {
  const key = process.env.SYSTEMEIO_API_KEY;
  if (!key) return NextResponse.json({ error: 'SYSTEMEIO_API_KEY manquante' }, { status: 500 });

  try {
    const [contactsData, tagsData] = await Promise.all([
      sioFetch('/contacts?limit=100'),
      sioFetch('/tags?limit=100'),
    ]);

    const contacts: Record<string, unknown>[] = contactsData.items || [];
    const tags: { id: number; name: string }[] = tagsData.items || [];

    const total = contacts.length;
    const now = new Date();
    const d30 = new Date(now); d30.setDate(now.getDate() - 30);
    const d7  = new Date(now); d7.setDate(now.getDate() - 7);

    const newThisMonth = contacts.filter(c => new Date(c.registeredAt as string) > d30).length;
    const newThisWeek  = contacts.filter(c => new Date(c.registeredAt as string) > d7).length;
    const unsubscribed = contacts.filter(c => c.unsubscribed).length;
    const bounced      = contacts.filter(c => c.bounced).length;

    const tagCount: Record<number, number> = {};
    for (const c of contacts) {
      for (const t of (c.tags as { id: number }[]) || []) {
        tagCount[t.id] = (tagCount[t.id] || 0) + 1;
      }
    }
    const tagsWithCount = tags
      .map(t => ({ ...t, count: tagCount[t.id] || 0 }))
      .sort((a, b) => b.count - a.count);

    const growth: Record<string, number> = {};
    for (const c of contacts) {
      const d = new Date(c.registeredAt as string);
      const key2 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      growth[key2] = (growth[key2] || 0) + 1;
    }

    const recentContacts = [...contacts]
      .sort((a, b) => new Date(b.registeredAt as string).getTime() - new Date(a.registeredAt as string).getTime())
      .slice(0, 50)
      .map(c => ({
        id: c.id,
        email: c.email,
        registeredAt: c.registeredAt,
        unsubscribed: c.unsubscribed,
        bounced: c.bounced,
        tags: c.tags,
        firstName: (c.fields as { slug: string; value: string }[])?.find(f => f.slug === 'first_name')?.value || '',
      }));

    return NextResponse.json({ stats: { total, newThisMonth, newThisWeek, unsubscribed, bounced }, tags: tagsWithCount, growth, contacts: recentContacts });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 });
  }
}
