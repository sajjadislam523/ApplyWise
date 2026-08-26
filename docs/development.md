# Development

Getting Applywise running locally, and how to check your changes.

**Source:** `backend/package.json`, `frontend/package.json`, `backend/.env.example`, `frontend/.env.example`

---

## Prerequisites

| Tool | Minimum |
| --- | --- |
| Node.js | 18.x |
| npm | 9.x |
| MongoDB Atlas account | Free tier (M0) is enough |
| SMTP credentials | Optional — only for email features |

## Repository layout

Two independent npm projects with no workspace root:

```text
applywise/
├── backend/     Express API      → http://localhost:5000
├── frontend/    Next.js app      → http://localhost:3000
└── docs/
```

There is **no root `package.json`**. Every command below runs from inside
`backend/` or `frontend/`; npm at the repository root does nothing.

## Setup

`node_modules` is not committed, so install in both projects:

```bash
cd backend  && npm install
cd frontend && npm install
```

Then create the environment files from their committed templates:

```bash
cd backend  && cp .env.example .env
cd frontend && cp .env.example .env.local
```

Each template lists every key with a placeholder and an inline comment. Fill in
the values marked required — the notes below cover the two that need setting up
somewhere else first.

### Getting a `MONGODB_URI`

Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas),
add a database user, and allow your IP under Network Access. Copy the connection
string from *Connect → Drivers* and append the database name, so it ends
`.mongodb.net/applywise`. The server exits immediately if it cannot reach Atlas
within five seconds, so a missing IP allowance surfaces as a fast, clear failure.

### Getting SMTP credentials

Optional. For Gmail, enable 2-factor authentication and create an
[App Password](https://support.google.com/accounts/answer/185833) — your normal
account password will not work. Leave the SMTP keys blank to run without email;
every send is fire-and-forget, so nothing breaks, the messages simply never go
out.

### Generating the JWT secrets

```bash
openssl rand -base64 64
```

Run it twice. `JWT_SECRET` and `JWT_REFRESH_SECRET` must differ.

## Running

Two terminals:

```bash
cd backend  && npm run dev    # nodemon + ts-node, watches src/**/*.ts
cd frontend && npm run dev
```

| Project | Command | Does |
| --- | --- | --- |
| backend | `npm run dev` | Watch mode on port 5000 |
| backend | `npm run build` | `tsc` → `dist/` |
| backend | `npm start` | `node dist/app.js` (needs a build first) |
| frontend | `npm run dev` | Next dev server on port 3000 |
| frontend | `npm run build` | Production build |
| frontend | `npm start` | Serve the production build |

Confirm the API is up:

```bash
curl http://localhost:5000/health
# {"status":"ok","app":"Applywise API","timestamp":"..."}
```

## Verification

**There is no test suite and no `lint` script.** `eslint-config-next` is a
frontend dependency but no ESLint config file exists, so `npx next lint` will not
work as things stand. Until that changes, the loop is the compiler plus a manual
request:

```bash
cd frontend && npx tsc --noEmit     # strict: true
cd backend  && npm run build        # strict: false
cd frontend && npm run build        # catches Next-specific errors tsc misses
curl http://localhost:5000/health
```

Run the frontend build, not just `tsc` — the type checker alone will not catch a
bad `viewport` export, an invalid route segment, or a prerender failure.

## Triggering the cron jobs

Both scheduled jobs are registered by `node-cron` when the server boots: the
stale check at midnight, follow-up reminders at 9am. To exercise the stale check
without waiting, POST to the internal endpoint with the secret from your `.env`:

```bash
curl -X POST http://localhost:5000/api/internal/run-stale-check \
  -H "x-internal-secret: $INTERNAL_SECRET"
# {"success":true,"marked":3,"checked":47}
```

To test either job on its real schedule, temporarily change the cron expression
to `*/1 * * * *` and watch the console. Revert before committing.

See [features.md](features.md) for what each job actually does.

## Troubleshooting

**`npx tsc` reports "This is not the tsc command you are looking for".**
Dependencies are not installed in that project. Run `npm install` first — `npx`
is falling through to a lookalike package on the registry.

**CORS errors in the browser.** The API honours exactly one origin, read from
`CLIENT_URL`. Check it matches your frontend origin with no trailing slash, and
that `NEXT_PUBLIC_API_URL` matches your backend origin. See
[deployment.md](deployment.md#cors).

**Requests 404 with `//api/...` in the URL.** `NEXT_PUBLIC_API_URL` has a
trailing slash. `frontend/src/lib/axios.ts` appends `/api` itself.

**Server exits on boot with a MongoDB error.** Deliberate — `backend/src/config/db.ts`
calls `process.exit(1)` rather than serving traffic without a database. Check the
connection string and your Atlas IP allowlist.

**Login succeeds, then every request 401s.** Only one refresh token is valid per
user at a time. Signing in from a second browser invalidates the first session's
token. See [architecture.md](architecture.md#authentication).
