'use client';

import { useState, useRef, useEffect } from 'react';

type Post = Record<string, unknown>;

type Message = {
  role: 'user' | 'ai';
  text: string;
};

const SUGGESTIONS = [
  'Quel type de post marche le mieux ?',
  'À quelle heure je dois poster ?',
  'Quel est mon meilleur post et pourquoi ?',
  'Quels sujets génèrent le plus d\'engagement ?',
  'Comment améliorer mes stats ?',
];

export default function ChatView({ posts }: { posts: Post[] }) {
  void posts; // Les posts sont maintenant lus directement depuis Supabase côté serveur
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Salut ! J'ai analysé tes ${posts.length} posts LinkedIn. Pose-moi n'importe quelle question sur tes performances — je te réponds avec tes vraies données.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.answer || data.error || 'Erreur inconnue',
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Erreur réseau, réessaie.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Historique */}
      <div
        style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: 12, minHeight: 300, maxHeight: 480, overflowY: 'auto' }}
        className="p-4 space-y-3 mb-4"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? '#3b82f6' : '#1e1e1e',
                color: m.role === 'user' ? '#fff' : '#c9d1d9',
                fontSize: 14,
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div style={{ background: '#1e1e1e', borderRadius: '12px 12px 12px 2px', padding: '10px 16px', color: '#555', fontSize: 14 }}>
              Analyse en cours...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={loading}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', fontSize: 12, borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Pose une question sur tes posts..."
          disabled={loading}
          style={{
            flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '10px 14px', color: '#f1f1f1',
            fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{
            background: '#3b82f6', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.5 : 1,
          }}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
