import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  return NextResponse.json({ campaigns: data || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('newsletter_campaigns')
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabase.from('newsletter_campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
