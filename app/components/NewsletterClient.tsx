'use client';

import { useEffect, useState } from 'react';
import NewsletterView from './NewsletterView';

type Data = {
  stats: { total: number; newThisMonth: number; newThisWeek: number; unsubscribed: number; bounced: number };
  tags: { id: number; name: string; count: number }[];
  contacts: { id: number; email: string; firstName: string; registeredAt: string; unsubscribed: boolean; bounced: boolean; tags: { id: number; name: string }[] }[];
  growth: Record<string, number>;
};

export default function NewsletterClient() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/newsletter')
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 300 }}>
        <div style={{ width: 36, height: 36, border: '3px solid #1e1e1e', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p className="mt-4 text-sm" style={{ color: '#555' }}>Chargement des abonnés...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#141414', border: '1px solid #2a1a1a' }} className="rounded-xl p-16 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-white font-semibold mb-2">Erreur de connexion à systeme.io</p>
        <p className="text-sm mt-2 font-mono" style={{ color: '#ef4444' }}>{error}</p>
        <p className="text-xs mt-4" style={{ color: '#444' }}>Vérifie que SYSTEMEIO_API_KEY est bien dans les variables Vercel</p>
      </div>
    );
  }

  if (!data) return null;

  return <NewsletterView data={data} />;
}
