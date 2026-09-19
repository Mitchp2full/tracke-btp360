import NewsletterClient from '../components/NewsletterClient';

export default function NewsletterPage() {
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
        <NewsletterClient />
      </main>
    </div>
  );
}
