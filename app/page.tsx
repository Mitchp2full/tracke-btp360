import { supabase } from '@/lib/supabase';
import DashboardTabs from './components/DashboardTabs';

type Post = {
  id: string;
  linkedin_urn: string;
  text: string | null;
  published_at: string | null;
  media_url: string | null;
  media_type: string | null;
  impressions: number;
  members_reached: number;
  reactions: number;
  reposts: number;
  comments: number;
  profile_views: number;
  new_followers: number;
  saves: number;
  link_clicks: number;
  updated_at: string;
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function Dashboard() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false });

  const list = (posts as Post[] | null) ?? [];
  const totalPosts = list.length;
  const totalImpressions = list.reduce((s, p) => s + (p.impressions ?? 0), 0);
  const totalReactions = list.reduce((s, p) => s + (p.reactions ?? 0), 0);
  const avgImpressions = totalPosts > 0 ? Math.round(totalImpressions / totalPosts) : 0;

  const stats = [
    { label: 'Posts publiés', value: totalPosts.toLocaleString('fr-FR'), icon: '📝' },
    { label: 'Impressions totales', value: totalImpressions.toLocaleString('fr-FR'), icon: '👁️' },
    { label: 'Moy. / post', value: avgImpressions.toLocaleString('fr-FR'), icon: '📈' },
    { label: 'Réactions totales', value: totalReactions.toLocaleString('fr-FR'), icon: '❤️' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f1f1f1' }}>
      <header style={{ background: '#111', borderBottom: '1px solid #1e1e1e' }} className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <span className="text-lg font-bold text-white">
            TRACKER <span style={{ color: '#3b82f6' }}>BTP360</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#555' }}>
            {list[0]?.updated_at ? `Sync : ${formatDate(list[0].updated_at)}` : 'Pas encore synchronisé'}
          </span>
          <div className="flex gap-2">
            <a href="/" style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              LinkedIn
            </a>
            <a href="/newsletter" style={{ background: '#1a1a1a', color: '#666', padding: '6px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
              Newsletter
            </a>
          </div>
        </div>
      </header>

      <main className="px-8 py-6 max-w-screen-xl mx-auto">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(card => (
            <div key={card.label} style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-4">
              <div className="text-xl mb-2">{card.icon}</div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-xs mt-1" style={{ color: '#555' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#1e1e1e', border: '1px solid #7f1d1d', color: '#fca5a5' }} className="rounded-xl p-6 text-sm">
            <strong>Erreur Supabase :</strong> {error.message}
          </div>
        )}

        {!error && list.length === 0 && (
          <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">🔌</div>
            <p className="text-white font-semibold mb-2">Aucun post synchronisé</p>
            <p className="text-sm" style={{ color: '#555' }}>
              Clique sur &quot;Scan complet&quot; dans l&apos;extension
            </p>
          </div>
        )}

        {!error && list.length > 0 && <DashboardTabs posts={list} />}
      </main>
    </div>
  );
}
