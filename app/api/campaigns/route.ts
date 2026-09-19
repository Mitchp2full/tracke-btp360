import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ campaigns: [], setup: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ campaigns: data || [] }, { headers: CORS });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.bulk && Array.isArray(body.campaigns)) {
    await supabase.from('newsletter_campaigns').delete().neq('id', 0);
    const cleaned = body.campaigns.map((c: Record<string, unknown>) => ({
      subject:     String(c.subject || '').slice(0, 500),
      tags:        String(c.tags || ''),
      sent_count:  Number(c.sent_count) || 0,
      open_rate:   Number(c.open_rate) || 0,
      click_rate:  Number(c.click_rate) || 0,
      sent_at:     c.sent_at || null,
    }));
    const { error } = await supabase.from('newsletter_campaigns').insert(cleaned);
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
    return NextResponse.json({ ok: true, count: cleaned.length }, { headers: CORS });
  }

  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data, { headers: CORS });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabase.from('newsletter_campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
