# Deployment

How Applywise is deployed, and the serverless constraints that shape it.

**Source:** `backend/vercel.json`, `frontend/vercel.json`, `render.yaml`, `backend/src/app.ts`

---

## Overview

Both projects deploy to Vercel as **two separate projects from the same
repository**, each with its own root directory. `render.yaml` describes an
alternative Render deployment; it is not currently used, but it is the path to
take if you want real cron jobs (see below).

## Backend

Set the root directory to `backend/`. Environment variables go in
*Settings → Environment Variables* — the full list with descriptions is in
[`backend/.env.example`](../backend/.env.example). `NODE_ENV` should be
`production`; the SMTP keys are optional.

### `backend/vercel.json` is load-bearing

```json
{
  "version": 2,
  "builds": [{ "src": "src/app.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/app.ts" }]
}
```

Without those two entries Vercel has no idea an Express app exists and serves a
404 with no CORS headers for every request, which presents in the browser as a
CORS failure rather than a routing one.

The same file also sets `Access-Control-Allow-*` headers, and **hard-codes the
production frontend origin** in the `Access-Control-Allow-Origin` value. Changing
the frontend domain therefore means editing two places: this file and the
`CLIENT_URL` environment variable.

## Frontend

Set the root directory to `frontend/`. Vercel auto-detects Next.js. The only
required variable is `NEXT_PUBLIC_API_URL`, pointing at the deployed API with no
trailing slash — `frontend/src/lib/axios.ts` appends `/api` itself, so a trailing
slash produces `//api` and 404s.

Note that `frontend/vercel.json` also declares `NEXT_PUBLIC_API_URL` in its `env`
block. A dashboard value and this file can disagree; keep them in step or remove
one.

## CORS

`backend/src/app.ts` configures CORS with a **single origin string**:

```ts
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
```

One origin, not a list. There is no explicit `app.options()` preflight handler —
the `cors` middleware handles preflight itself. Supporting a second origin (a
custom domain alongside the Vercel URL, say) means changing this call to accept
an array or a validator function; adding another value to `CLIENT_URL` will not
work.

When CORS fails in production, check in this order:

1. `CLIENT_URL` on the backend exactly matches the frontend origin, no trailing slash.
2. `NEXT_PUBLIC_API_URL` on the frontend exactly matches the backend origin.
3. The hard-coded origin in `backend/vercel.json` matches too.
4. Both projects have been redeployed since those values changed.

## Cron on serverless

`node-cron` schedules both background jobs when the server boots. On Vercel there
is no long-lived process — functions spin up per request and stop — so **neither
job ever fires in production**.

Production drives the stale check externally instead: a scheduler such as
[cron-job.org](https://cron-job.org) POSTs daily to

```http
POST https://<your-api>/api/internal/run-stale-check
x-internal-secret: <INTERNAL_SECRET>
```

There is no equivalent endpoint for the follow-up reminder, so **follow-up
reminder emails do not go out on the Vercel deployment at all**. Adding one would
mean extracting the job's body the way `runStaleCheckManually` already is in
`backend/src/jobs/staleChecker.ts`.

Deploying the backend to Render using `render.yaml` avoids the whole problem —
the paid tier keeps a process alive, so both crons fire normally.

## Known limitations on Vercel

| Limitation | Consequence | Workaround |
| --- | --- | --- |
| No persistent process | `node-cron` never fires | External scheduler hitting the internal endpoint |
| Cold starts | 1–3s on the first request after idle | Fluid compute, or a paid plan |
| Function timeout | 10s on Hobby, 60s on Pro | Current queries finish well inside this |
| No WebSockets | No real-time updates | Not used today; would need Ably or Pusher |
