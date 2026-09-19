import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: 'Question manquante' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clé API Gemini manquante' }, { status: 500 });

  const { data: posts, error } = await supabase
    .from('posts')
    .select('published_at, media_type, impressions, reactions, comments, reposts, text, profile_views, new_followers, saves, link_clicks')
    .order('impressions', { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Résume chaque post pour économiser les tokens
  const postsResume = (posts || []).map(p => ({
    date: p.published_at?.slice(0, 10),
    type: p.media_type || 'text',
    imp: p.impressions,
    react: p.reactions,
    com: p.comments,
    rep: p.reposts,
    saves: p.saves,
    clicks: p.link_clicks,
    extrait: p.text ? p.text.slice(0, 120) : '',
  }));

  const prompt = `Tu es un analyste LinkedIn expert pour Youcef Zouaoui, fondateur de BTP 360 (coaching dirigeants BTP).

Données de ses ${postsResume.length} meilleurs posts (triés par impressions) :
${JSON.stringify(postsResume)}

Légende : date=date, type=type de post, imp=impressions, react=réactions, com=commentaires, rep=reposts, saves=sauvegardes, clicks=clics lien, extrait=début du texte

Règles :
- Réponds uniquement à la question, avec des chiffres réels
- Tutoie Youcef, sois direct
- Texte brut, pas de markdown, pas de **, pas de #
- Listes avec tirets simples

Question : ${question}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2500 },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse';
    return NextResponse.json({ answer: text });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 });
  }
}
