'use client';

import { useMemo } from 'react';

type Post = {
  published_at: string | null;
  impressions: number;
  reactions: number;
  comments: number;
  reposts: number;
};

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function parisHour(iso: string): number {
  return parseInt(
    new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Paris', hour: 'numeric', hour12: false })
  ) % 24;
}

function parisDay(iso: string): number {
  return new Date(
    new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Paris' })
  ).getDay();
}

function engagement(p: Post) {
  return p.impressions + p.reactions * 5 + p.comments * 8 + p.reposts * 6;
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: '#1a1a1a', borderRadius: 4, height: 8, flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  );
}

export default function BestTimesView({ posts }: { posts: Post[] }) {
  const validPosts = posts.filter(p => p.published_at);

  const { byHour, byDay, bestHours, bestDays, insight } = useMemo(() => {
    // Agrégation par heure
    const hourMap: Record<number, { total: number; count: number }> = {};
    const dayMap: Record<number, { total: number; count: number }> = {};

    for (const p of validPosts) {
      const h = parisHour(p.published_at!);
      const d = parisDay(p.published_at!);
      const score = engagement(p);

      if (!hourMap[h]) hourMap[h] = { total: 0, count: 0 };
      hourMap[h].total += score;
      hourMap[h].count += 1;

      if (!dayMap[d]) dayMap[d] = { total: 0, count: 0 };
      dayMap[d].total += score;
      dayMap[d].count += 1;
    }

    const byHour = Array.from({ length: 24 }, (_, h) => ({
      h,
      label: `${String(h).padStart(2, '0')}h`,
      avg: hourMap[h] ? Math.round(hourMap[h].total / hourMap[h].count) : 0,
      count: hourMap[h]?.count || 0,
    }));

    const byDay = Array.from({ length: 7 }, (_, d) => ({
      d,
      label: DAYS[d],
      avg: dayMap[d] ? Math.round(dayMap[d].total / dayMap[d].count) : 0,
      count: dayMap[d]?.count || 0,
    }));

    const sorted = [...byHour].filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
    const bestHours = sorted.slice(0, 3);

    const sortedDays = [...byDay].filter(x => x.count > 0).sort((a, b) => b.avg - a.avg);
    const bestDays = sortedDays.slice(0, 2);

    const insight = bestHours.length > 0
      ? `Tes meilleurs créneaux : ${bestDays.map(d => d.label).join(', ')} entre ${bestHours.map(d => d.label).join(', ')}`
      : null;

    return { byHour, byDay, bestHours, bestDays, insight };
  }, [validPosts]);

  const maxHour = Math.max(...byHour.map(x => x.avg), 1);
  const maxDay  = Math.max(...byDay.map(x => x.avg), 1);

  if (validPosts.length < 5) {
    return (
      <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-12 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-white font-semibold mb-1">Pas encore assez de données</p>
        <p className="text-sm" style={{ color: '#555' }}>Il faut au moins 5 posts avec des dates pour analyser tes meilleurs créneaux.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insight */}
      {insight && (
        <div style={{ background: '#0f1f3d', border: '1px solid #1e3a5f', borderRadius: 12 }} className="px-5 py-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">Recommandation</p>
            <p className="text-sm" style={{ color: '#93c5fd' }}>{insight}</p>
            <p className="text-xs mt-1" style={{ color: '#4b6891' }}>
              Basé sur l&apos;engagement pondéré (impressions + réactions × 5 + commentaires × 8 + reposts × 6)
            </p>
          </div>
        </div>
      )}

      {/* Par heure */}
      <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Par heure de publication</h3>
        <div className="space-y-1.5">
          {byHour.map(({ h, label, avg, count }) => {
            const isBest = bestHours.some(b => b.h === h);
            return (
              <div key={h} className="flex items-center gap-3">
                <span className="text-xs w-8 text-right tabular-nums" style={{ color: isBest ? '#3b82f6' : '#444' }}>
                  {label}
                </span>
                <Bar value={avg} max={maxHour} color={isBest ? '#3b82f6' : '#2a2a2a'} />
                <span className="text-xs w-16 text-right tabular-nums" style={{ color: count > 0 ? '#666' : '#2a2a2a' }}>
                  {count > 0 ? `${count} post${count > 1 ? 's' : ''}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Par jour */}
      <div style={{ background: '#141414', border: '1px solid #1e1e1e' }} className="rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Par jour de la semaine</h3>
        <div className="space-y-2">
          {byDay.map(({ d, label, avg, count }) => {
            const isBest = bestDays.some(b => b.d === d);
            return (
              <div key={d} className="flex items-center gap-3">
                <span className="text-xs w-8" style={{ color: isBest ? '#3b82f6' : '#444' }}>{label}</span>
                <Bar value={avg} max={maxDay} color={isBest ? '#3b82f6' : '#2a2a2a'} />
                <span className="text-xs w-16 text-right tabular-nums" style={{ color: count > 0 ? '#666' : '#2a2a2a' }}>
                  {count > 0 ? `${count} post${count > 1 ? 's' : ''}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 3 heures */}
      {bestHours.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {bestHours.map((h, i) => (
            <div key={h.h} style={{ background: '#141414', border: `1px solid ${i === 0 ? '#1e3a5f' : '#1e1e1e'}` }} className="rounded-xl p-4 text-center">
              <div className="text-lg mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="text-2xl font-bold" style={{ color: i === 0 ? '#3b82f6' : '#fff' }}>{h.label}</div>
              <div className="text-xs mt-1" style={{ color: '#555' }}>{h.count} post{h.count > 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
