# Mint Investment Strategies Front-End

Premium, dark-mode, multi-page React + TypeScript + Vite site for Mint Investment Strategies, now with a login-gated Multiplayer Sims MVP.

## Stack
- React + TypeScript + Vite
- TailwindCSS
- Framer Motion
- React Router
- Supabase (Auth + PostgREST API)

## Required environment variables
Set these in local `.env` and in Render:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy (Render static site)
- Build command: `npm run build`
- Publish directory: `dist`
- In Render dashboard, add:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Multiplayer routes
- `/multiplayer`: join event by code, see active events, see personal runs.
- `/multiplayer/runs/:runId`: run detail + metrics.
- `/multiplayer/events/:eventCode`: event page + top-20 leaderboard.

## Supabase Edge Function: `submit_results`
This function ingests completed sim results and finalizes the run.

### Function path
- `supabase/functions/submit_results/index.ts`

### Request payload
```json
{
  "run_id": "uuid",
  "score": 82.1,
  "pnl": 1450.8,
  "sharpe": 1.25,
  "max_drawdown": -6.4,
  "win_rate": 57.3,
  "extra": { "notes": "optional json" }
}
```

### Deploy steps
1. Install and authenticate Supabase CLI.
2. Link your project:
   ```bash
   supabase link --project-ref <project-ref>
   ```
3. Deploy function:
   ```bash
   supabase functions deploy submit_results
   ```
4. Set required function secret (if not present):
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
5. Sim posts results to:
   ```
   https://<project-ref>.functions.supabase.co/submit_results
   ```

## Manual MVP test checklist
1. Sign up at `/signup`.
2. Sign in at `/login`.
3. Open `/multiplayer`.
4. Enter a valid event code and press Join.
5. Verify external sim opens in new tab with `?run_id=<uuid>`.
6. POST results to `submit_results`.
7. Confirm run status becomes finished in **Your runs**.
8. Open run detail page and verify metrics.
9. Open event page and verify leaderboard ranking/order.
