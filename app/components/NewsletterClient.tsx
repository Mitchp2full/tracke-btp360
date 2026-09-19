'use client';

import { useEffect, useState, useMemo } from 'react';

type Tag = { id: number; name: string; count: number };
type Contact = { id: number; email: string; firstName: string; registeredAt: string; unsubscribed: boolean; bounced: boolean; tags: { id: number; name: string }[] };
type Stats = { total: number; newThisMonth: number; newThisWeek: number; unsubscribed: number; bounced: number };
type SubData = { stats: Stats; tags: Tag[]; contacts: Contact[]; growth: Record<string, number> };
type Campaign = { id: number; subject: string; tags: string; sent_count: number; open_rate: number; click_rate: number; sent_at: string };

const TABS = ['📧 Campagnes', '👥 Abonnés', '📈 Croissance'];

const pill = (active: boolean) => ({
  background: active ? '#3b82f6' : '#1a1a1a',
  color: active ? '#fff' : '#666',
  border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: active ? 600 : 400,
});

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: 280 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1e1e1e', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <p className="mt-3 text-sm" style={{ color: '#555' }}>Chargement...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── CAMPAIGNS TAB ──────────────────────────────────────────────────────────
function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [setup, setSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: '', tags: '', sent_count: '', open_rate: '', click_rate: '', sent_at: '' });

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns || []); setSetup(!!d.setup); })
      .finally(() => setLoading(false));
  }, []);

  async function addCampaign() {
    setSaving(true);
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: form.subject,
        tags: form.tags,
        sent_count: parseInt(form.sent_count) || 0,
        open_rate: parseFloat(form.open_rate) || 0,
        click_rate: parseFloat(form.click_rate) || 0,
        sent_at: form.sent_at || null,
      }),
    });
    const data = await res.json();
    if (!data.error) {
      setCampaigns(prev => [data, ...prev]);
      setForm({ subject: '', tags: '', sent_count: '', open_rate: '', click_rate: '', sent_at: '' });
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteCampaign(id: number) {
    await fetch('/api/campaigns', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }

  if (loading) return <Spinner />;

  if (setup) return (
    <div style={{ background: '#141414', border: '1px solid #1e3a1a' }} className="rounded-xl p-10 text-center">
      <div className="text-4xl mb-3">⚙️</div>
      <p className="text-white font-semibold mb-2">Une dernière étape pour les campagnes</p>
      <p className="text-sm mb-5" style={{ color: '#888' }}>Colle ce SQL dans <strong style={{ color: '#fff' }}>Supabase → SQL Editor</strong> et clique Run :</p>
      <pre style={{ background: '#0d1f0d', border: '1px solid #1e3a1a', color: '#86efac', borderRadius: 8, padding: '14px 18px', fontSize: 12, textAlign: 'left', display: 'inline-block', maxWidth: 560 }}>
{`create table newsletter_campaigns (
  id serial primary key,
  subject text not null,
  tags text default '',
  sent_count int default 0,
  open_rate numeric(5,2) default 0,
  click_rate numeric(5,2) default 0,
  sent_at timestamptz,
  created_at timestamptz default now()
);`}
      </pre>
      <div className="mt-5">
        <button onClick={() => { setLoading(true); fetch('/api/campaigns').then(r => r.json()).then(d => { setCampaigns(d.campaigns || []); setSetup(!!d.setup); }).finally(() => setLoading(false)); }}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}>
          Vérifier
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#555' }}>{campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#141414', border: '1px solid #2a2a2a' }} className="rounded-xl p-5 mb-5">
          <p className="text-sm font-semibold text-white mb-4">Nouvelle campagne</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="text-xs mb-1 block" style={{ color: '#555' }}>Sujet de la newsletter</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Ex : Ne dis plus jamais je suis artisan"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#f1f1f1', fontSize: 13 }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#555' }}>Tag(s)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Ex : Newsletter BTP 360"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#f1f1f1', fontSize: 13 }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#555' }}>Nombre d'envois</label>
              <input type="number" value={form.sent_count} onChange={e => setForm(f => ({ ...f, sent_count: e.target.value }))} placeholder="330"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#f1f1f1', fontSize: 13 }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#555' }}>Taux d'ouverture (%)</label>
              <input type="number" step="0.01" value={form.open_rate} onChange={e => setForm(f => ({ ...f, open_rate: e.target.value }))} placeholder="53.03"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#f1f1f1', fontSize: 13 }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#555' }}>Taux de clics (%)</label>
              <input type="number" step="0.01" value={form.click_rate} onChange={e => setForm(f => ({ ...f, click_rate: e.target.value }))} placeholder="0.61"
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#f1f1f1', fontSize: 13 }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#555' }}>Date d'envoi</label>
              <input type="date" value={form.sent_at} onChange={e => setForm(f => ({ ...f, sent_at: e.target.value }))}
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#f1f1f1', fontSize: 13 }} />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={addCampaign} disabled={!form.subject || saving}
              style={{ background: form.subject ? '#3b82f6' : '#1a1a1a', color: form.subject ? '#fff' : '#444', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: '#1a1a1a', color: '#666', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl overflow-hidden">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f0f0f', borderBottom: '1px solid #1e1e1e' }}>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>Sujet</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>Tag(s)</th>
              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#555' }}>Envois</th>
              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#555' }}>Taux d'ouverture</th>
              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#555' }}>Taux de clics</th>
              <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#555' }}>Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#444' }}>Aucune campagne — clique sur + Ajouter</td></tr>
            ) : campaigns.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td className="px-4 py-3" style={{ color: '#c9d1d9', fontSize: 13, maxWidth: 280 }}>
                  <span className="truncate block">{c.subject}</span>
                </td>
                <td className="px-4 py-3">
                  <span style={{ background: '#1e2a3a', color: '#93c5fd', fontSize: 11, padding: '2px 7px', borderRadius: 4 }}>{c.tags || '—'}</span>
                </td>
                <td className="px-4 py-3 text-center tabular-nums text-sm" style={{ color: '#888' }}>{c.sent_count.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-center tabular-nums text-sm" style={{ color: c.open_rate >= 40 ? '#22c55e' : c.open_rate >= 25 ? '#f59e0b' : '#ef4444' }}>
                  {c.open_rate}%
                </td>
                <td className="px-4 py-3 text-center tabular-nums text-sm" style={{ color: '#888' }}>{c.click_rate}%</td>
                <td className="px-4 py-3 text-center text-xs tabular-nums" style={{ color: '#555' }}>
                  {c.sent_at ? new Date(c.sent_at).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => deleteCampaign(c.id)} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SUBSCRIBERS TAB ─────────────────────────────────────────────────────────
function SubscribersTab({ data }: { data: SubData }) {
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { tags, contacts } = data;

  const filtered = useMemo(() => {
    let list = contacts;
    if (selectedTag !== null) list = list.filter(c => c.tags?.some(t => t.id === selectedTag));
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(c => c.email.toLowerCase().includes(q) || c.firstName?.toLowerCase().includes(q)); }
    return list;
  }, [contacts, selectedTag, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <input type="text" placeholder="Rechercher email ou prénom..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 14px', color: '#f1f1f1', fontSize: 13, width: 260, outline: 'none' }} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedTag(null)} style={{ ...(!selectedTag ? { background: '#3b82f6', color: '#fff' } : { background: '#1a1a1a', color: '#666' }), border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Tous</button>
          {tags.filter(t => t.count > 0).slice(0, 8).map(t => (
            <button key={t.id} onClick={() => setSelectedTag(t.id === selectedTag ? null : t.id)}
              style={{ ...(selectedTag === t.id ? { background: '#3b82f6', color: '#fff' } : { background: '#1a1a1a', color: '#666' }), border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
              {t.name} ({t.count})
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl overflow-hidden">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f0f0f', borderBottom: '1px solid #1e1e1e' }}>
              {['Email', 'Prénom', 'Inscription', 'Tags', 'Statut'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#555' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td className="px-4 py-3" style={{ color: '#c9d1d9', fontSize: 13 }}>{c.email}</td>
                <td className="px-4 py-3" style={{ color: '#888', fontSize: 13 }}>{c.firstName || '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#555' }}>{new Date(c.registeredAt).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags?.slice(0, 3).map(t => <span key={t.id} style={{ background: '#1e2a3a', color: '#93c5fd', fontSize: 11, padding: '2px 7px', borderRadius: 4 }}>{t.name}</span>)}
                    {c.tags?.length > 3 && <span style={{ color: '#555', fontSize: 11 }}>+{c.tags.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {c.unsubscribed ? <span style={{ color: '#ef4444', fontSize: 11 }}>Désabonné</span>
                    : c.bounced ? <span style={{ color: '#f59e0b', fontSize: 11 }}>Bounce</span>
                    : <span style={{ color: '#22c55e', fontSize: 11 }}>Actif</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 text-xs" style={{ color: '#444', borderTop: '1px solid #1a1a1a' }}>
          {filtered.length} contact{filtered.length > 1 ? 's' : ''} affichés
        </div>
      </div>
    </div>
  );
}

// ─── GROWTH TAB ──────────────────────────────────────────────────────────────
function GrowthTab({ growth }: { growth: Record<string, number> }) {
  const entries = Object.entries(growth).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Nouveaux abonnés par mois</h3>
      <div className="space-y-2">
        {entries.map(([month, count]) => (
          <div key={month} className="flex items-center gap-3">
            <span className="text-xs w-16 tabular-nums" style={{ color: '#555' }}>{month}</span>
            <div style={{ background: '#1a1a1a', borderRadius: 4, height: 10, flex: 1 }}>
              <div style={{ width: `${Math.round((count / max) * 100)}%`, height: '100%', background: '#3b82f6', borderRadius: 4 }} />
            </div>
            <span className="text-xs w-12 text-right tabular-nums" style={{ color: '#aaa' }}>+{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function NewsletterClient() {
  const [tab, setTab] = useState(0);
  const [subData, setSubData] = useState<SubData | null>(null);
  const [subError, setSubError] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    fetch('/api/newsletter')
      .then(r => r.json())
      .then(d => { if (d.error) setSubError(d.error); else setSubData(d); })
      .catch(e => setSubError(e.message))
      .finally(() => setSubLoading(false));
  }, []);

  const stats = subData?.stats;

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Abonnés', value: subLoading ? '…' : stats ? stats.total.toLocaleString('fr-FR') : '—', icon: '👥' },
          { label: 'Nouveaux ce mois', value: subLoading ? '…' : stats ? `+${stats.newThisMonth}` : '—', icon: '📈' },
          { label: 'Cette semaine', value: subLoading ? '…' : stats ? `+${stats.newThisWeek}` : '—', icon: '🆕' },
          { label: 'Désabonnés', value: subLoading ? '…' : stats ? stats.unsubscribed.toLocaleString('fr-FR') : '—', icon: '🚪' },
          { label: 'Bounces', value: subLoading ? '…' : stats ? stats.bounced.toLocaleString('fr-FR') : '—', icon: '⚠️' },
        ].map(card => (
          <div key={card.label} style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-4">
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-xs mt-1" style={{ color: '#555' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {subError && (
        <div style={{ background: '#1a0a0a', border: '1px solid #3a1a1a', color: '#ef4444' }} className="rounded-xl p-4 text-sm mb-6">
          Erreur systeme.io : {subError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={pill(tab === i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && <CampaignsTab />}
      {tab === 1 && (subLoading ? <Spinner /> : subData ? <SubscribersTab data={subData} /> : null)}
      {tab === 2 && (subLoading ? <Spinner /> : subData ? <GrowthTab growth={subData.growth} /> : null)}
    </div>
  );
}
