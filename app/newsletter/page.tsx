import NewsletterView from '../components/NewsletterView';

const BASE = 'https://api.systeme.io/api';

async function sioFetch(path: string) {
  const key = process.env.SYSTEMEIO_API_KEY;
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': key! },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`systeme.io ${res.status}`);
  return res.json();
}

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

async function getData(): Promise<{ stats: { total: number; newThisMonth: number; newThisWeek: number; unsubscribed: number; bounced: number }; tags: { id: number; name: string; count: number }[]; growth: Record<string, number>; contacts: { id: number; email: string; registeredAt: string; unsubscribed: boolean; bounced: boolean; tags: { id: number; name: string }[]; firstName: string }[] } | { error: string }> {
  if (!process.env.SYSTEMEIO_API_KEY) {
    return { error: 'Clé API SYSTEMEIO_API_KEY manquante — vérifie les variables d\'environnement Vercel.' };
  }
  try {
    const [contacts, tagsData] = await Promise.all([
      getAllContacts(),
      sioFetch('/tags?limit=100'),
    ]);

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
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      growth[key] = (growth[key] || 0) + 1;
    }

    const recentContacts = contacts
      .sort((a, b) => new Date(b.registeredAt as string).getTime() - new Date(a.registeredAt as string).getTime())
      .slice(0, 50)
      .map(c => ({
        id: c.id as number,
        email: c.email as string,
        registeredAt: c.registeredAt as string,
        unsubscribed: c.unsubscribed as boolean,
        bounced: c.bounced as boolean,
        tags: c.tags as { id: number; name: string }[],
        firstName: (c.fields as { slug: string; value: string }[])?.find(f => f.slug === 'first_name')?.value || '',
      }));

    return { stats: { total, newThisMonth, newThisWeek, unsubscribed, bounced }, tags: tagsWithCount, growth, contacts: recentContacts };
  } catch (err) {
    console.error('[Newsletter]', err);
    return { error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

export default async function NewsletterPage() {
  const result = await getData();
  const error = result && 'error' in result ? result.error : null;
  const data = result && !('error' in result) ? result : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f1f1' }}>
      <header style={{ background: '#111', borderBottom: '1px solid #1e1e1e' }} className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <span className="text-lg font-bold text-white">
            TRACKER <span style={{ color: '#3b82f6' }}>BTP360</span>
          </span>
        </div>
        <div className="flex gap-2">
          <a href="/" style={{ background: '#1a1a1a', color: '#666', padding: '6px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>LinkedIn</a>
          <a href="/newsletter" style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Newsletter</a>
        </div>
      </header>

      <main className="px-8 py-6 max-w-screen-xl mx-auto">
        {error ? (
          <div style={{ background: '#141414', border: '1px solid #2a1a1a' }} className="rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-white font-semibold mb-2">Erreur de connexion à systeme.io</p>
            <p className="text-sm mt-2 font-mono" style={{ color: '#ef4444' }}>{error}</p>
            <p className="text-xs mt-4" style={{ color: '#444' }}>Vérifie que SYSTEMEIO_API_KEY est bien ajoutée dans les variables d&apos;environnement Vercel</p>
          </div>
        ) : data ? (
          <NewsletterView data={data} />
        ) : null}
      </main>
    </div>
  );
}
