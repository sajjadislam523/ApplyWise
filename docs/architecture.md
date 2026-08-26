# Architecture

How the two projects fit together, and why the code is shaped the way it is.

**Source:** `backend/src/`, `frontend/src/lib/`, `frontend/src/store/`, `frontend/src/hooks/`

---

## Shape of the system

```text
Browser
  │
  ├── Next.js App Router (frontend/)
  │     Redux Toolkit ──── client state (auth, filters, UI)
  │     React Query ────── server state (jobs, analytics)
  │     axios instance ─── token injection + silent refresh
  │
  ▼ HTTPS
Express API (backend/)
  │     protect middleware ── verifies the access token
  │     controllers ───────── owner-scoped queries
  │     node-cron ─────────── stale check, follow-up reminders
  │
  ▼
MongoDB Atlas
```

Both projects are TypeScript. The frontend compiles with `strict: true`, the
backend with `strict: false` — new frontend code must be fully typed.

---

## Frontend: the state split

This is the most important convention in the codebase.

**Redux Toolkit owns client state only.** Three slices, in `frontend/src/store/`:

| Slice | Holds |
| --- | --- |
| `authSlice` | Current user, access and refresh tokens, `isInitialised` |
| `filterSlice` | Status, search text, tags, sort field and order, date range |
| `uiSlice` | Modal open state, the job being edited, the job being deleted |

**React Query owns everything that comes from the API.** Server data, loading
flags, and error states never go into Redux.

The two meet at exactly one point. `useJobs` in `frontend/src/hooks/useJobs.ts`
builds its query key out of the Redux filter state:

```ts
queryKey: jobKeys.filtered({ ...filters, page, userId })
```

Change any filter and the key changes, so React Query refetches on its own.
**Never add a manual refetch trigger** — that is what this wiring exists to avoid.

All query keys live in the `jobKeys` object in the same file. Add new ones there
so invalidation stays consistent; the mutations invalidate by `jobKeys.all`, which
only works because every list key is namespaced under it.

Because the search box feeds a query key, it is debounced by 300ms in
`frontend/src/components/jobs/JobFilters.tsx`. Dispatching to Redux on every
keystroke would fire one request per character.

---

## Authentication

A short-lived access token plus a longer-lived refresh token, both signed in
`backend/src/utils/jwt.ts` with separate secrets.

The current refresh token is stored on the User document, so **exactly one
refresh token is valid per user at a time**. Refreshing rotates it, and logout
`$unset`s it. A token that has been superseded is rejected as revoked even though
its signature is still valid.

`frontend/src/lib/axios.ts` is the choke point on the client:

1. A request interceptor attaches the access token from the Redux store.
2. A response interceptor catches any 401, calls `/auth/refresh`, and retries the
   original request. Requests arriving mid-refresh queue in `failedQueue` rather
   than each firing their own refresh.
3. If the refresh itself fails, it dispatches `logout()` and hard-redirects to
   `/auth/login`.

**Always call the API through this instance.** Bypassing it loses both token
injection and the refresh handling.

Auth state is mirrored to `localStorage` under `applywise_access`,
`applywise_refresh`, and `applywise_user`, and restored by the `rehydrate` action
dispatched from `frontend/src/providers/Providers.tsx`.

Route protection is client-side only. `frontend/src/app/(dashboard)/layout.tsx`
waits for `isInitialised` before deciding anything, then redirects when there is
no user. **Guard on `isInitialised` in any new protected surface** — checking
`user` alone redirects on every page load, before rehydration has run.

---

## Backend conventions

**Every query is scoped to its owner.** Controllers filter on
`{ _id: req.params.id, user: req.user!.id }` rather than fetching a document and
then checking who owns it, so a mismatch returns 404 and never leaks the
existence of another user's record. `updateJob` additionally strips any
client-supplied `user` field. Any new job endpoint must do the same.

**Every async controller is wrapped in `asyncHandler`** from
`backend/src/middleware/error.middleware.ts`, so a rejected promise reaches the
global error handler instead of hanging the request.

**Every response goes through `sendSuccess` or `sendError`** from
`backend/src/utils/apiResponse.ts`, producing a consistent
`{ success, message, data, meta? }` envelope. On the client,
`frontend/src/lib/api.ts` unwraps `data.data` — with one exception:
`jobsApi.getAll` returns the whole envelope, because the paginated list needs
`meta`.

**Route order matters.** `GET /api/jobs/analytics` is registered before
`/:id` in `backend/src/routes/job.routes.ts`. Reverse them and Express matches
`analytics` as an id.

**Email is fire-and-forget everywhere.** No send is ever awaited in a request
path or a cron loop, so an SMTP outage cannot fail a registration or block the
stale check.

---

## Design decisions

Four choices in this codebase are not obvious from reading it. Their rationale:

### `lastActivityAt` exists alongside Mongoose's `updatedAt`

`updatedAt` changes on *any* write, including migrations, admin scripts, and
bulk fixes. The stale checker needs a signal that only application business logic
moves, otherwise a one-off maintenance script would silently reset every user's
stale countdown.

`lastActivityAt` is set only by the `pre('save')` and `pre('findOneAndUpdate')`
hooks in `backend/src/models/Job.model.ts`. Editing a job through the API
restarts its countdown; touching the document any other way does not.

The stale checker's own `Job.updateMany` deliberately bypasses those hooks —
`updateMany` does not fire `findOneAndUpdate` — so marking a job stale does not
reset the very timestamp that made it stale.

### Server data never enters Redux

Redux and React Query overlap enough that using both invites putting server data
in Redux "just this once," at which point you own cache invalidation by hand. The
hard rule keeps each tool doing the thing it is good at, and makes the
filter-to-refetch wiring possible: filters are client state, so they can live in
Redux and be read synchronously into a query key.

### One refresh token per user

Storing the current refresh token on the User document, rather than accepting any
correctly signed token, makes logout actually revoke access. The cost is that a
user can hold only one active session — signing in on a second device
invalidates the first. For a single-user job tracker that trade is worth it; a
product needing multi-device sessions would store a set of tokens instead.

### Route protection is client-side only

There is no middleware guarding `/dashboard`, `/jobs`, or `/analytics`. The pages
render, then redirect if Redux has no user after rehydration. This is acceptable
only because the pages hold no server-rendered secrets — every piece of real data
arrives from the API, which authenticates each request independently. The guard
is a UX convenience, not a security boundary, and should not be mistaken for one.

---

## Known inconsistencies

Present in the codebase, working, but not patterns to copy:

- `frontend/` contains both `postcss.config.js` and `postcss.config.mjs` with
  identical contents.
- `frontend/next.config.ts` is a `.ts` file using CommonJS `module.exports`.
- `frontend/src/lib/utils.ts` exports `cn()` backed by `clsx` alone, with no
  `tailwind-merge`. Conflicting Tailwind classes are not deduplicated, so a
  `className` prop will not reliably override a component's base classes.
- `backend/src/models/User.model.ts` declares the email index twice — once via
  `unique: true` on the field and again with an explicit `schema.index()`.
