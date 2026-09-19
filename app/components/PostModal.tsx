'use client';

import { useEffect } from 'react';

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

const STATS = [
  { key: 'impressions',     icon: '👁️',  label: 'Impressions'       },
  { key: 'members_reached', icon: '👥',  label: 'Membres atteints'  },
  { key: 'reactions',       icon: '❤️',  label: 'Réactions'         },
  { key: 'comments',        icon: '💬',  label: 'Commentaires'      },
  { key: 'reposts',         icon: '🔁',  label: 'Reposts'           },
  { key: 'profile_views',   icon: '👤',  label: 'Visites profil'    },
  { key: 'new_followers',   icon: '➕',  label: 'Nouveaux abonnés'  },
  { key: 'saves',           icon: '🔖',  label: 'Sauvegardes'       },
  { key: 'link_clicks',     icon: '🔗',  label: 'Clics liens'       },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PostModal({ post, onClose }: { post: Post; onClose: () => void }) {
  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const linkedinUrl = `https://www.linkedin.com/feed/update/${post.linkedin_urn}/`;
  const analyticsUrl = `https://www.linkedin.com/analytics/post-summary/${post.linkedin_urn}/`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#141414', border: '1px solid #2a2a2a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <span className="text-sm font-medium" style={{ color: '#888' }}>{formatDate(post.published_at)}</span>
          <div className="flex items-center gap-3">
            <a
              href={analyticsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#1e1e1e', color: '#888' }}
            >
              📊 Analytics
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: '#0a66c2', color: '#fff' }}
            >
              Voir sur LinkedIn ↗
            </a>
            <button
              onClick={onClose}
              className="text-xl leading-none"
              style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Image / vidéo */}
        {post.media_url && (
          <div className="relative w-full" style={{ maxHeight: '320px', overflow: 'hidden', background: '#1a1a1a' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media_url}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: '320px' }}
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
            {post.media_type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <span className="text-5xl">▶</span>
              </div>
            )}
          </div>
        )}

        {/* Texte du post */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#d1d5db' }}>
            {post.text || <span style={{ color: '#555', fontStyle: 'italic' }}>Pas de texte</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-3">
            {STATS.map(s => {
              const val = post[s.key as keyof Post] as number;
              return (
                <div key={s.key} className="rounded-xl p-3 text-center" style={{ background: '#1a1a1a' }}>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-xl font-bold text-white">
                    {val > 0 ? val.toLocaleString('fr-FR') : <span style={{ color: '#333' }}>—</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#555' }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Hint analytics */}
          <p className="text-xs mt-4 text-center" style={{ color: '#333' }}>
            Visites profil, abonnés et sauvegardes se mettent à jour en cliquant sur "Analytics"
          </p>
        </div>
      </div>
    </div>
  );
}
