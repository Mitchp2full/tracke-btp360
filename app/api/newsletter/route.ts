import { NextResponse } from 'next/server';

export const maxDuration = 60;

const BASE = 'https://api.systeme.io/api';

async function sioFetch(path: string) {
  const key = process.env.SYSTEMEIO_API_KEY;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': key! },
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!res.ok) throw new Error(`systeme.io ${path} → ${res.status}`);
  return res.json();
}

// Récupère tous les contacts en paginant
async function getAllContacts() {
  const contacts: Record<string, unknown>[] = [];
  let after: number | null = null;

  while (true) {
    const url = `/contacts?limit=100${after ? `&after=${after}` : ''}`;
    const data = await sioFetch(url);
    const items: Record<string, unknown>[] = data.items || [];
    contacts.push(...items);
    if (!data.hasMore || items.length === 0) break;
    after = items[items.length - 1].id as number;
  }
  return contacts;
}

export async function GET() {
  try {
    const [contacts, tagsData] = await Promise.all([
      getAllContacts(),
      sioFetch('/tags?limit=100'),
    ]);

    const tags: { id: number; name: string }[] = tagsData.items || [];

    // Stats globales
    const total = contacts.length;
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo  = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);

    const newThisMonth = contacts.filter(c => new Date(c.registeredAt as string) > thirtyDaysAgo).length;
    const newThisWeek  = contacts.filter(c => new Date(c.registeredAt as string) > sevenDaysAgo).length;
    const unsubscribed = contacts.filter(c => c.unsubscribed).length;
    const bounced      = contacts.filter(c => c.bounced).length;

    // Abonnés par tag
    const tagCount: Record<number, number> = {};
    for (const contact of contacts) {
      const ctags = (contact.tags as { id: number }[]) || [];
      for (const t of ctags) {
        tagCount[t.id] = (tagCount[t.id] || 0) + 1;
      }
    }
    const tagsWithCount = tags.map(t => ({ ...t, count: tagCount[t.id] || 0 }))
      .sort((a, b) => b.count - a.count);

    // Croissance par mois (12 derniers mois)
    const growth: Record<string, number> = {};
    for (const c of contacts) {
      const d = new Date(c.registeredAt as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      growth[key] = (growth[key] || 0) + 1;
    }

    // Liste contacts simplifiée (50 plus récents)
    const recentContacts = contacts
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

    return NextResponse.json({
      stats: { total, newThisMonth, newThisWeek, unsubscribed, bounced },
      tags: tagsWithCount,
      growth,
      contacts: recentContacts,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 });
  }
}
