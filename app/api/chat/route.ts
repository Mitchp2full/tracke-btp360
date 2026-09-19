import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent';

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question) return NextResponse.json({ error: 'Question manquante' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Clé API Gemini manquante' }, { status: 500 });

  // Récupère tous les posts depuis Supabase
  const { data: posts, error } = await supabase
    .from('posts')
    .select('published_at, media_type, impressions, reactions, comments, reposts, text, profile_views, new_followers, saves, link_clicks')
    .order('published_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prompt = `Tu es un analyste LinkedIn expert. Tu travailles pour Youcef Zouaoui, fondateur de BTP 360 (coaching pour dirigeants du BTP).

Tu as accès à tous ses posts LinkedIn dans cette base de données (${posts?.length} posts) :
${JSON.stringify(posts)}

Instructions :
- Réponds UNIQUEMENT à la question posée, en cherchant dans les données ci-dessus
- Tutoie Youcef, sois direct et précis
- Donne des chiffres réels tirés des données
- Texte brut uniquement, pas de markdown, pas de **, pas de #
- Si la question demande une liste, fais une liste simple avec des tirets

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
