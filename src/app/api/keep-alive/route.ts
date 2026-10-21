import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({
      ok: true,
      mode: 'local-first',
      message: 'Running in local-first mode without external cloud dependency',
      timestamp: new Date().toISOString(),
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    // 1. Ping no serviço de Auth do Supabase
    await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // 2. Ping no banco PostgreSQL via PostgREST
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase
      .from('cliente')
      .select('id_cliente')
      .limit(1);

    return NextResponse.json({
      ok: true,
      mode: error ? 'local-first-fallback' : 'cloud-active',
      message: error ? error.message : 'Supabase keep-alive ping successful',
      timestamp: new Date().toISOString(),
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({
      ok: true,
      mode: 'local-first-autonomous',
      message: 'App operating autonomously in local-first mode',
      timestamp: new Date().toISOString(),
    });
  }
}
