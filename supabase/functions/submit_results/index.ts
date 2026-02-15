import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SubmitResultsBody {
  run_id: string;
  score?: number;
  pnl?: number;
  sharpe?: number;
  max_drawdown?: number;
  win_rate?: number;
  extra?: Record<string, unknown>;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = (await request.json()) as SubmitResultsBody;

    if (!payload.run_id) {
      return new Response(JSON.stringify({ error: 'run_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: insertError } = await supabase.from('run_results').insert({
      run_id: payload.run_id,
      score: payload.score ?? null,
      pnl: payload.pnl ?? null,
      sharpe: payload.sharpe ?? null,
      max_drawdown: payload.max_drawdown ?? null,
      win_rate: payload.win_rate ?? null,
      extra: payload.extra ?? null,
    });

    if (insertError) {
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from('runs')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', payload.run_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
