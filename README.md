# Mint Investment Strategies Front-End

Premium, dark-mode, multi-page React + TypeScript + Vite site for Mint Investment Strategies, now with a login-gated Multiplayer Sims MVP and backend ingestion endpoints.

## Stack
- React + TypeScript + Vite
- TailwindCSS
- Framer Motion
- React Router
- Supabase (Auth + PostgREST API)
- Render Node service (`backend-render/`) for run creation/results ingestion/leaderboard API

## Required environment variables
Set these in local `.env` and in Render:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=https://your-render-api.onrender.com
```

For the Render API service (`backend-render`), configure:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=4000
```

## Run locally
### Frontend
```bash
npm install
npm run dev
```

### Render API service
```bash
cd backend-render
npm install
npm start
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
  - `VITE_BACKEND_URL`

## Deploy Render API service
- Root directory: `backend-render`
- Start command: `npm start`
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Multiplayer routes
- `/multiplayer`: join event by code, see active events, see personal runs.
- `/multiplayer/runs/:runId`: run detail + metrics.
- `/multiplayer/events/:eventCode`: event page + top-20 leaderboard.

## Render API endpoints
- `POST /api/runs/create`
  - Input: `{ eventCode, userId }`
  - Output: `{ runId, simUrl }` where `simUrl` already includes `?run_id=<uuid>`.
- `POST /api/runs/submit`
  - Input: `{ runId, score, pnl?, sharpe?, max_drawdown?, win_rate?, extra? }`
  - Duplicate submissions are blocked.
- `GET /api/events/:code/leaderboard?limit=20`
  - Returns ranked rows joined with masked user identity/display name.

## Dev sim integration helper
- File: `public/sim-dev.html`
- Usage:
  1. Join from `/multiplayer` to open a sim URL with `run_id`.
  2. Load `/sim-dev.html?run_id=<uuid>`.
  3. Click **Submit Results** to POST mock metrics to `/api/runs/submit`.

## Manual MVP test checklist
1. Sign up at `/signup`.
2. Sign in at `/login`.
3. Open `/multiplayer`.
4. Enter a valid event code and press Join.
5. Verify external sim opens in new tab with `?run_id=<uuid>`.
6. Submit results from your sim (or use `/sim-dev.html`).
7. Confirm run status becomes finished in **Your runs**.
8. Open run detail page and verify metrics.
9. Open event page and verify leaderboard ranking/order.
