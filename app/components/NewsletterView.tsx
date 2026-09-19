'use client';

import { useState, useMemo } from 'react';

type Tag = { id: number; name: string; count: number };
type Contact = {
  id: number;
  email: string;
  firstName: string;
  registeredAt: string;
  unsubscribed: boolean;
  bounced: boolean;
  tags: { id: number; name: string }[];
};
type Stats = { total: number; newThisMonth: number; newThisWeek: number; unsubscribed: number; bounced: number };
type Data = { stats: Stats; tags: Tag[]; contacts: Contact[]; growth: Record<string, number> };

const TABS = ['👥 Abonnés', '🏷️ Par tag', '📈 Croissance'];

export default function NewsletterView({ data }: { data: Data }) {
  const [tab, setTab]           = useState(0);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [search, setSearch]     = useState('');

  const { stats, tags, contacts, growth } = data;

  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (selectedTag !== null) {
      list = list.filter(c => c.tags?.some(t => t.id === selectedTag));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.email.toLowerCase().includes(q) || c.firstName?.toLowerCase().includes(q));
    }
    return list;
  }, [contacts, selectedTag, search]);

  const growthEntries = Object.entries(growth).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const maxGrowth = Math.max(...growthEntries.map(([, v]) => v), 1);

  const pillBase = 'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer border-0';

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Abonnés total',     value: stats.total.toLocaleString('fr-FR'),         icon: '👥' },
          { label: 'Nouveaux ce mois',  value: `+${stats.newThisMonth}`,                    icon: '📈' },
          { label: 'Nouveaux ce semaine', value: `+${stats.newThisWeek}`,                   icon: '🆕' },
          { label: 'Désabonnés',        value: stats.unsubscribed.toLocaleString('fr-FR'),  icon: '🚪' },
          { label: 'Bounces',           value: stats.bounced.toLocaleString('fr-FR'),       icon: '⚠️' },
        ].map(card => (
          <div key={card.label} style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-4">
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-xs mt-1" style={{ color: '#555' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={pillBase}
            style={tab === i ? { background: '#3b82f6', color: '#fff' } : { background: '#1a1a1a', color: '#666' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Abonnés */}
      {tab === 0 && (
        <div>
          {/* Filtres */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text" placeholder="Rechercher un email ou prénom..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 14px', color: '#f1f1f1', fontSize: 13, width: 260, outline: 'none' }}
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedTag(null)}
                style={{ background: selectedTag === null ? '#3b82f6' : '#1a1a1a', color: selectedTag === null ? '#fff' : '#666', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                Tous
              </button>
              {tags.filter(t => t.count > 0).slice(0, 8).map(t => (
                <button key={t.id} onClick={() => setSelectedTag(t.id === selectedTag ? null : t.id)}
                  style={{ background: selectedTag === t.id ? '#3b82f6' : '#1a1a1a', color: selectedTag === t.id ? '#fff' : '#666', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                  {t.name} ({t.count})
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl overflow-hidden">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0f0f0f', borderBottom: '1px solid #1e1e1e' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>Prénom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>Inscription</th>
                  <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>Tags</th>
                  <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#555' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td className="px-4 py-3" style={{ color: '#c9d1d9', fontSize: 13 }}>{c.email}</td>
                    <td className="px-4 py-3" style={{ color: '#888', fontSize: 13 }}>{c.firstName || '—'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#555' }}>
                      {new Date(c.registeredAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.slice(0, 3).map(t => (
                          <span key={t.id} style={{ background: '#1e2a3a', color: '#93c5fd', fontSize: 11, padding: '2px 7px', borderRadius: 4 }}>
                            {t.name}
                          </span>
                        ))}
                        {c.tags?.length > 3 && <span style={{ color: '#555', fontSize: 11 }}>+{c.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.unsubscribed
                        ? <span style={{ color: '#ef4444', fontSize: 11 }}>Désabonné</span>
                        : c.bounced
                        ? <span style={{ color: '#f59e0b', fontSize: 11 }}>Bounce</span>
                        : <span style={{ color: '#22c55e', fontSize: 11 }}>Actif</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs" style={{ color: '#444', borderTop: '1px solid #1a1a1a' }}>
              {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''} affichés (50 plus récents)
            </div>
          </div>
        </div>
      )}

      {/* Par tag */}
      {tab === 1 && (
        <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Abonnés par tag</h3>
          <div className="space-y-3">
            {tags.filter(t => t.count > 0).map(t => {
              const pct = Math.round((t.count / stats.total) * 100);
              return (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="text-xs w-48 truncate" style={{ color: '#888' }}>{t.name}</span>
                  <div style={{ background: '#1a1a1a', borderRadius: 4, height: 8, flex: 1 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                  </div>
                  <span className="text-xs w-20 text-right tabular-nums" style={{ color: '#555' }}>
                    {t.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Croissance */}
      {tab === 2 && (
        <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Nouveaux abonnés par mois</h3>
          <div className="space-y-2">
            {growthEntries.map(([month, count]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs w-16 tabular-nums" style={{ color: '#555' }}>{month}</span>
                <div style={{ background: '#1a1a1a', borderRadius: 4, height: 10, flex: 1 }}>
                  <div style={{ width: `${Math.round((count / maxGrowth) * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
                </div>
                <span className="text-xs w-12 text-right tabular-nums" style={{ color: '#aaa' }}>+{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
