import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

// Construction dynamique de la ligne : n'inclut que les champs définis
// (évite d'écraser des données existantes avec undefined)
function buildRow(p: Record<string, unknown>) {
  const row: Record<string, unknown> = {
    linkedin_urn: p.linkedin_urn,
    updated_at: new Date().toISOString(),
  };
  const fields = [
    'text', 'published_at', 'media_url', 'media_type',
    'impressions', 'reactions', 'comments', 'reposts',
    'members_reached', 'profile_views', 'new_followers', 'saves', 'link_clicks',
  ];
  for (const f of fields) {
    if (p[f] !== undefined && p[f] !== null) row[f] = p[f];
  }
  return row;
}

export async function POST(req: NextRequest) {
  try {
    const { posts } = await req.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'Aucun post reçu' }, { status: 400, headers: CORS_HEADERS });
    }

    const { data, error } = await supabase
      .from('posts')
      .upsert(
        posts.map((p: Record<string, unknown>) => buildRow(p)),
        { onConflict: 'linkedin_urn' }
      );

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: true, count: posts.length, data }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error('[API] Error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}
