'use client';

import { useState, useMemo } from 'react';
import PostModal from './PostModal';

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
};

type SortKey = keyof Omit<Post, 'id' | 'linkedin_urn' | 'text' | 'media_url' | 'media_type'>;
type Period = '7' | '30' | '90' | 'all';

const COLUMNS: { key: SortKey; label: string; icon: string; tip: string }[] = [
  { key: 'impressions',     icon: '👁️',  label: 'Impressions',       tip: 'Nombre de fois que le post a été vu' },
  { key: 'members_reached', icon: '👥',  label: 'Membres atteints',  tip: 'Personnes uniques qui ont vu le post' },
  { key: 'reactions',       icon: '❤️',  label: 'Réactions',         tip: 'Likes et autres réactions' },
  { key: 'reposts',         icon: '🔁',  label: 'Reposts',           tip: 'Republications du post' },
  { key: 'comments',        icon: '💬',  label: 'Commentaires',      tip: 'Nombre de commentaires' },
  { key: 'profile_views',   icon: '👤',  label: 'Visites profil',    tip: 'Visites de ton profil depuis ce post' },
  { key: 'new_followers',   icon: '➕',  label: 'Nouveaux abonnés',  tip: 'Abonnés gagnés grâce à ce post' },
  { key: 'saves',           icon: '🔖',  label: 'Sauvegardes',       tip: 'Fois où le post a été sauvegardé' },
  { key: 'link_clicks',     icon: '🔗',  label: 'Clics liens',       tip: 'Clics sur les liens du post' },
];

const PERIODS: { label: string; value: Period }[] = [
  { label: '7j',   value: '7'   },
  { label: '30j',  value: '30'  },
  { label: '90j',  value: '90'  },
  { label: 'Tout', value: 'all' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
}

function Num({ value }: { value: number }) {
  if (!value) return <span style={{ color: '#333' }}>—</span>;
  return <span>{value.toLocaleString('fr-FR')}</span>;
}

function Thumb({ url, type }: { url: string | null; type: string | null }) {
  if (!url) return <div className="w-12 h-12 rounded flex-shrink-0" style={{ background: '#1e1e1e' }} />;
  return (
    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0" style={{ background: '#1e1e1e' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      {type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="text-white text-sm">▶</span>
        </div>
      )}
    </div>
  );
}

export default function PostsView({ posts }: { posts: Post[] }) {
  const [sort, setSort]         = useState<SortKey>('published_at');
  const [sortDir, setSortDir]   = useState<'desc' | 'asc'>('desc');
  const [period, setPeriod]     = useState<Period>('all');
  const [search, setSearch]     = useState('');
  const [modalPost, setModalPost] = useState<Post | null>(null);

  function handleSort(key: SortKey) {
    if (sort === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSort(key);
      setSortDir('desc');
    }
  }

  const filtered = useMemo(() => {
    let result = [...posts];

    if (period !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(period));
      result = result.filter(p => p.published_at && new Date(p.published_at) > cutoff);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.text?.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      let valA: number, valB: number;
      if (sort === 'published_at') {
        valA = new Date(a.published_at || 0).getTime();
        valB = new Date(b.published_at || 0).getTime();
      } else {
        valA = (a[sort] as number) ?? 0;
        valB = (b[sort] as number) ?? 0;
      }
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });

    return result;
  }, [posts, sort, sortDir, period, search]);

  const pillBase = 'px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border-0';

  return (
    <div>
      {modalPost && <PostModal post={modalPost} onClose={() => setModalPost(null)} />}
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-200 outline-none"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', width: '200px' }}
        />

        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: '#1a1a1a' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={pillBase}
              style={period === p.value
                ? { background: '#3b82f6', color: '#fff' }
                : { background: 'transparent', color: '#666' }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <span className="text-xs ml-auto" style={{ color: '#444' }}>
          {filtered.length} post{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-12 text-center">
          <p className="text-sm" style={{ color: '#555' }}>Aucun post pour cette période</p>
        </div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e1e', background: '#0f0f0f' }}>
                  <th className="px-3 py-3 w-14" />
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555', minWidth: '280px' }}>Post</th>

                  {/* Date — cliquable */}
                  <th
                    className="px-3 py-3 text-left text-xs font-medium whitespace-nowrap cursor-pointer select-none"
                    style={{ color: sort === 'published_at' ? '#3b82f6' : '#555' }}
                    onClick={() => handleSort('published_at')}
                  >
                    Date {sort === 'published_at' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>

                  {/* Colonnes métriques — cliquables */}
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="px-3 py-3 text-center text-xs font-medium whitespace-nowrap cursor-pointer select-none"
                      style={{ color: sort === col.key ? '#3b82f6' : '#555' }}
                      onClick={() => handleSort(col.key)}
                      title={col.tip}
                    >
                      {col.icon} {sort === col.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                  ))}

                  <th className="px-3 py-3 w-8" />
                </tr>

                {/* Labels sous les icônes */}
                <tr style={{ borderBottom: '1px solid #1e1e1e', background: '#0a0a0a' }}>
                  <th /><th /><th />
                  {COLUMNS.map(col => (
                    <th
                      key={col.key}
                      className="px-3 pb-2 text-center cursor-pointer select-none"
                      style={{ fontSize: '9px', color: sort === col.key ? '#3b82f6' : '#333', letterSpacing: '0.03em' }}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label.toUpperCase()}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>

              <tbody>
                {filtered.map((post) => (
                  <tr
                    key={post.id}
                    style={{ borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}
                    className="hover:bg-white/[0.015] transition-colors"
                    onClick={() => setModalPost(post)}
                  >
                    <td className="px-3 py-3">
                      <Thumb url={post.media_url} type={post.media_type} />
                    </td>
                    <td className="px-4 py-3" style={{ maxWidth: '280px' }}>
                      <p style={{
                        color: '#c9d1d9',
                        fontSize: '13px',
                        lineHeight: '1.45',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {post.text || <span style={{ color: '#333', fontStyle: 'italic' }}>Post sans texte</span>}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: '#555' }}>
                      {formatDate(post.published_at)}
                    </td>

                    {COLUMNS.map(col => (
                      <td key={col.key} className="px-3 py-3 text-center text-xs tabular-nums" style={{ color: '#aaa' }}>
                        <Num value={post[col.key] as number} />
                      </td>
                    ))}

                    <td className="px-2 py-3">
                      <a
                        href={`https://www.linkedin.com/feed/update/${post.linkedin_urn}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-base opacity-20 hover:opacity-60 transition-opacity"
                        title="Voir sur LinkedIn"
                      >
                        ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
