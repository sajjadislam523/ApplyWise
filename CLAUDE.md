# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

Project documentation lives in [docs/](docs/), one concern per file, with
[docs/README.md](docs/README.md) as the index. This file is the agent-facing
companion to that set — it carries the conventions; the docs carry the reference
material. Prefer reading the relevant doc over re-deriving a fact from source.

**After changing behaviour, update the matching document.** This table is the
contract, and is duplicated in [CONTRIBUTING.md](CONTRIBUTING.md) and
[docs/README.md](docs/README.md):

| Changed | Update |
| --- | --- |
| Anything a user would notice | [CHANGELOG.md](CHANGELOG.md), under `[Unreleased]` |
| An endpoint, parameter, or response | [docs/api-reference.md](docs/api-reference.md) |
| A schema field, index, or hook | [docs/data-model.md](docs/data-model.md) |
| Environment variables | the relevant `.env.example` |
| A convention spanning several files | [docs/architecture.md](docs/architecture.md) and this file |
| A user-facing feature | [docs/features.md](docs/features.md) and the README feature list |
| Deployment, CORS, or cron behaviour | [docs/deployment.md](docs/deployment.md) |
| UI markup or styling | check against [docs/accessibility.md](docs/accessibility.md) |

Two rules keep those documents accurate. **One fact, one home** — never restate a
fact that already lives elsewhere; link to it. Version numbers belong only in
`package.json`, environment variables only in the `.env.example` files. **Every
document names its sources** in a `Source:` line at the top, so when you edit a
file you can find the documents that describe it.

## Known issues

Confirmed, unfixed, and easy to trip over:

- **`isStale` is never cleared.** Only the stale checker writes it, always to
  `true`, and it is excluded from `CreateJobInput`. A revived job therefore keeps
  rendering struck-through and is permanently skipped by both cron jobs, which
  query `isStale: false`. See [docs/data-model.md](docs/data-model.md#status-and-staleness).
- **Follow-up reminders never fire in production.** Only the stale check has an
  external trigger endpoint; `node-cron` does not run on Vercel.
- **Filter and pagination state is not in the URL.**

## Repository layout

Two independent npm projects with no workspace root — `backend/` (Express 5 + Mongoose API) and `frontend/` (Next.js 16 App Router). There is no root `package.json`. Every command below must be run from inside `backend/` or `frontend/`; running npm at the repo root does nothing.

## Commands

```bash
# Backend — from backend/
npm run dev      # nodemon + ts-node, watches src/**/*.ts → http://localhost:5000
npm run build    # tsc → dist/
npm start        # node dist/app.js (requires build first)

# Frontend — from frontend/
npm run dev      # → http://localhost:3000
npm run build
npm start
```

Both servers must be running for the app to work locally.

### Verification

There is **no test suite and no `lint` script** in either project (`eslint-config-next` is a dependency but no ESLint config file exists, so `npx next lint` will not work as-is). The verification loop is the compiler plus a manual request:

```bash
cd frontend && npx tsc --noEmit     # frontend typecheck (strict: true)
cd backend  && npm run build        # backend typecheck (strict: false)
curl http://localhost:5000/health   # {"status":"ok","app":"Applywise API",...}
```

Trigger the stale-check cron on demand instead of waiting for midnight:

```bash
curl -X POST http://localhost:5000/api/internal/run-stale-check \
  -H "x-internal-secret: $INTERNAL_SECRET"
```

### Environment files

`backend/.env.example` and `frontend/.env.example` are committed and are the
canonical list of keys — copy them to `.env` and `.env.local` respectively. Do
not restate the variable list in any other file; add new keys to the example
instead. The frontend needs only `NEXT_PUBLIC_API_URL` (no trailing slash — the
axios instance appends `/api` itself). SMTP vars are optional; the app runs fine
without email configured.

## Architecture

### The state-management split (frontend)

This is the single most important convention in the codebase:

- **Redux Toolkit owns client state only** — `authSlice` (user + tokens), `filterSlice` (status/search/tags/sort/date range), `uiSlice` (modal open state, editing/deleting job IDs).
- **React Query owns all server state.** Server data, loading flags, and error states never go in Redux.

The two connect at exactly one point, in [useJobs.ts:23](frontend/src/hooks/useJobs.ts#L23): the query key is built from the Redux filter state (`jobKeys.filtered({ ...filters, page, userId })`). Changing any filter produces a new key, so React Query refetches automatically — never wire up a manual refetch trigger. All keys live in the `jobKeys` object in that file; add new keys there so invalidation stays consistent.

### Auth flow

Access token (15m) + refresh token (7d), with rotation on every refresh. The current refresh token is stored on the `User` document, so there is exactly **one valid refresh token per user** — logging in elsewhere or refreshing invalidates the previous one, and logout `$unset`s it.

[axios.ts](frontend/src/lib/axios.ts) is the choke point: a request interceptor injects the token from the Redux store, and a response interceptor performs a silent refresh on any 401, queueing concurrent requests in `failedQueue` while a refresh is in flight. If the refresh fails it dispatches `logout()` and hard-redirects to `/auth/login`. Always call the API through this instance — bypassing it loses token injection and refresh.

Auth is mirrored into `localStorage` (`applywise_access` / `applywise_refresh` / `applywise_user`) by the `setCredentials`, `refreshed`, and `logout` reducers, and restored by the `rehydrate` action dispatched from [Providers.tsx](frontend/src/providers/Providers.tsx). Route protection is client-side only: [(dashboard)/layout.tsx](frontend/src/app/(dashboard)/layout.tsx) waits for `isInitialised` before deciding, then redirects when there is no user. Guard on `isInitialised` in any new protected surface — checking `user` alone flashes a redirect on every reload.

### Backend conventions

- **Every query is scoped to the owner.** Job controllers filter on `{ _id: req.params.id, user: req.user!.id }` rather than fetching then checking — a missing match returns 404, never a 403. `updateJob` also strips a client-supplied `user` field. Any new job endpoint must follow this.
- **Every async controller is wrapped in `asyncHandler`** ([error.middleware.ts](backend/src/middleware/error.middleware.ts)) so rejections reach the global `errorHandler`.
- **Responses always go through `sendSuccess` / `sendError`** ([apiResponse.ts](backend/src/utils/apiResponse.ts)), producing `{ success, message, data, meta? }`. The frontend's [api.ts](frontend/src/lib/api.ts) unwraps `data.data` — except `jobsApi.getAll`, which returns the whole envelope because the paginated list needs `meta`.
- **Route order matters:** `GET /api/jobs/analytics` is registered before `/:id` in [job.routes.ts](backend/src/routes/job.routes.ts), otherwise Express matches `analytics` as an id.
- **Emails are fire-and-forget everywhere** — never awaited in a request path or cron loop, so SMTP failure can't break a response.

### `lastActivityAt` and the stale checker

`lastActivityAt` exists alongside Mongoose's `updatedAt` because it is only touched by application business logic — the `pre('save')` and `pre('findOneAndUpdate')` hooks in [Job.model.ts:58-64](backend/src/models/Job.model.ts#L58-L64). That gives the stale checker a signal that migrations and admin writes can't pollute. Editing a job through the API therefore restarts its stale countdown.

The stale checker's own `Job.updateMany` deliberately bypasses those hooks (`updateMany` doesn't fire `findOneAndUpdate`), so marking a job stale does not reset its own activity timestamp.

`node-cron` schedules both jobs from `start()` in [app.ts](backend/src/app.ts) — stale check at midnight, follow-up reminders at 9am. **Crons never fire on Vercel**, which has no long-lived process; production relies on an external scheduler POSTing to `/api/internal/run-stale-check`. To test a cron locally, temporarily change its schedule to `*/1 * * * *` and revert before committing.

### List vs. detail payloads

`GET /api/jobs` does `.select('-description')` for performance, so job cards never have a `description`. Anything needing the rich-text body (e.g. populating the edit form) must fetch the single job via `useJob(id)`.

## Styling

Tailwind **v4** with CSS-first configuration — the design tokens, fonts, keyframes, and custom `@utility` classes (`status-*`, `card-stale`, `job-title`) all live in [globals.css](frontend/src/app/globals.css). **There is no `tailwind.config.ts`.** Add new tokens and utilities to the `@theme` / `@utility` blocks.

In practice components hard-code the palette as Tailwind arbitrary values rather than reading the tokens — `#6EE7B7` accent, `#080C10` page base, `#0F1419` surface, `#161C24` elevated, `#8B98A8` secondary text. Match the surrounding file rather than mixing the two approaches mid-component. The UI is dark-only (`<html className="dark">`); there is no light theme.

`cn()` in [utils.ts](frontend/src/lib/utils.ts) is **clsx only — no `tailwind-merge`**. Conflicting classes do not get deduplicated, so a `className` prop passed to `Button` or `JobCard` won't reliably override the base classes.

## Deployment notes

Both apps deploy to Vercel as separate projects from this monorepo (`render.yaml` is an unused alternative config for Render).

`backend/vercel.json` is load-bearing: without its `builds`/`routes` entries pointing at `src/app.ts`, Vercel doesn't know Express exists and 404s everything with no CORS headers. That file **also hard-codes the production frontend origin** in its `headers` block, so changing the frontend domain means editing `vercel.json` *and* the `CLIENT_URL` env var.

CORS in [app.ts:17-20](backend/src/app.ts#L17-L20) passes a single origin string from `CLIENT_URL` (defaulting to `http://localhost:3000`) — one origin, not a list. Supporting an additional origin requires changing that call to accept an array or a validator function; adding another value to `CLIENT_URL` will not work. See [docs/deployment.md](docs/deployment.md#cors).

Note `frontend/` contains both `postcss.config.js` and `postcss.config.mjs` with identical contents, and `next.config.ts` uses CommonJS `module.exports`. These work but are inconsistent; don't take them as a pattern to follow.

## Conventions

Backend `tsconfig` is `strict: false`, frontend is `strict: true` — new frontend code must be fully typed. Frontend imports use the `@/*` path alias for `src/*`.

Commits follow conventional prefixes (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`). Work happens on a `development` branch and merges to `main` via PR.
