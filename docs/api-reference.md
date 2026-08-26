# API reference

Every endpoint the API exposes.

**Source:** `backend/src/routes/`, `backend/src/controllers/`

---

Base URL — local `http://localhost:5000`, production `https://apply-wise-htx9.vercel.app`.

Routes marked 🔒 require an access token:

```http
Authorization: Bearer <access_token>
```

Every response uses the same envelope, built by `backend/src/utils/apiResponse.ts`:

```json
{ "success": true, "message": "Success", "data": {}, "meta": {} }
```

`meta` appears only on paginated responses. Errors carry `success: false` and a
`message`, and omit `data`.

---

## Health

### `GET /health`

Unauthenticated liveness check. Used as Render's `healthCheckPath` and handy for
confirming a local server is up.

```json
{ "status": "ok", "app": "Applywise API", "timestamp": "2024-11-15T09:00:00.000Z" }
```

Note it answers as soon as Express is listening; it does not check the database
connection. The server exits on a failed Mongo connect, so a running process
does imply a connected database — but a dropped connection later will not show
up here.

---

## Auth

### `POST /api/auth/register`

Rate limited to 10 requests per 15 minutes per IP.

```json
{ "name": "Your Name", "email": "you@example.com", "password": "minimum8chars" }
```

`201` on success:

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Your Name", "email": "you@example.com" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

`409` if the email is already registered. The password minimum of 8 characters is
enforced by the schema, so a shorter one surfaces as a validation error.

### `POST /api/auth/login`

Rate limited to 10 requests per 15 minutes per IP.

```json
{ "email": "you@example.com", "password": "yourpassword" }
```

`200` with the same body shape as register. A wrong password and an unknown email
both return the same `401` message — the API never reveals whether an address is
registered.

### `POST /api/auth/refresh`

```json
{ "refreshToken": "eyJ..." }
```

`200` returns a new `accessToken` **and** a new `refreshToken`; the old one stops
working immediately. A correctly signed token that is no longer the one stored on
the user returns `401 Refresh token revoked`.

### `POST /api/auth/logout`

```json
{ "refreshToken": "eyJ..." }
```

Clears the stored refresh token. Always `200`, including for a token that was
already invalid.

### `POST /api/auth/forgot-password`

Rate limited to 5 requests per hour **per IP** — not per email address, since
each request sends mail. A shared IP therefore shares the budget.

```json
{ "email": "you@example.com" }
```

Always `200`, with the same body whether or not an account exists:

```json
{ "success": true, "data": null, "message": "If an account exists for that email, a reset link is on its way." }
```

Varying the response would turn this into a way to discover which addresses have
accounts. When the address does exist, a single-use token is generated, its
SHA-256 hash stored on the user with a 60-minute expiry, and a link emailed.
Requesting a new link immediately invalidates any previous one.

### `POST /api/auth/reset-password`

Rate limited to 10 requests per 15 minutes per IP — deliberately looser than
`forgot-password`, because this sends no mail and a user fumbling the password
rules should not be locked out while holding a valid link.

```json
{ "token": "<the token from the emailed link>", "password": "atleast8chars" }
```

`200` on success. `400` if the token is unknown, already used, or expired — all
three return the same message, `"This reset link is invalid or has expired"`.
`400` if the password is under 8 characters.

Resetting also clears the stored `refreshToken`, so every existing session ends
and the user must sign in again everywhere.

### `GET /api/auth/me` 🔒

```json
{ "success": true, "data": { "id": "...", "name": "Your Name", "email": "you@example.com" } }
```

---

## Jobs

All job routes are protected and scoped to the authenticated user. A job
belonging to someone else is indistinguishable from one that does not exist —
both return `404`.

### `GET /api/jobs` 🔒

| Parameter | Type | Notes |
| --- | --- | --- |
| `status` | string | `applied`, `interviewing`, `offer`, `rejected`, `stale` |
| `tags` | string | Comma-separated; matches any (`remote,startup`) |
| `startDate` | ISO date | Lower bound on `applicationDate` |
| `endDate` | ISO date | Upper bound on `applicationDate` |
| `search` | string | Case-insensitive regex across `title` and `company` |
| `sortBy` | string | `applicationDate` (default), `company`, `title`, `createdAt`, `lastActivityAt`. Anything else falls back to `applicationDate` |
| `order` | string | `asc` or `desc` (default) |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, clamped to `100` |

```json
{
  "success": true,
  "data": [],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

**The `description` field is excluded from this response.** It is the only large
field on the document, and the list view never shows it. Fetch a single job to
get it — this is why the edit form loads the job by id rather than reusing the
list entry.

### `POST /api/jobs` 🔒

```json
{
  "title": "Senior Engineer",
  "company": "Acme Corp",
  "applicationDate": "2024-11-15",
  "status": "applied",
  "location": "remote",
  "salary": "$120k–$140k",
  "jobLink": "https://acme.com/jobs/123",
  "tags": ["typescript", "remote"],
  "timeoutDays": 14,
  "followUpSent": false
}
```

`title`, `company`, and `applicationDate` are required; everything else has a
schema default or is optional. Returns `201` with the created job.

### `GET /api/jobs/analytics` 🔒

Registered before `/:id` — see [architecture.md](architecture.md#backend-conventions).

```json
{
  "success": true,
  "data": {
    "total": 45,
    "byStatus": { "applied": 20, "interviewing": 10, "offer": 3, "rejected": 8, "stale": 4 },
    "rates": { "response": 46.7, "interview": 22.2, "offer": 6.7, "stale": 8.9 },
    "avgDaysToResponse": 12.4,
    "weekly": [{ "_id": { "year": 2024, "week": 45 }, "count": 4, "firstDate": "2024-11-04T..." }],
    "monthly": [{ "_id": { "year": 2024, "month": 11 }, "count": 12 }],
    "topTags": [{ "_id": "remote", "count": 18 }]
  }
}
```

Computed by five MongoDB aggregation pipelines issued in parallel. Notes on the
numbers:

- `rates` are percentages rounded to one decimal. `response` counts
  `interviewing + offer + rejected` over the total.
- **`avgDaysToResponse` is an approximation.** There is no stored first-response
  timestamp, so it averages `updatedAt − applicationDate` across jobs whose
  status is no longer `applied`. Any later edit to such a job inflates it. It is
  `null` when no job has moved past `applied`.
- `weekly` covers the last 12 weeks by ISO week. `monthly` covers the last 360
  days grouped by calendar month, so the earliest month may be partial.
- `topTags` returns at most 10, highest count first.

### `GET /api/jobs/:id` 🔒

The full job, including `description`.

### `PUT /api/jobs/:id` 🔒

Accepts any subset of job fields. A `user` field in the body is stripped
server-side. Any update resets `lastActivityAt`, restarting the stale countdown —
see [data-model.md](data-model.md#lastactivityat).

### `DELETE /api/jobs/:id` 🔒

```json
{ "success": true, "data": null, "message": "Job deleted" }
```

---

## Internal

### `POST /api/internal/run-stale-check`

Runs the stale check immediately. Exists because `node-cron` never fires on
Vercel — see [deployment.md](deployment.md#cron-on-serverless).

Requires the header `x-internal-secret` matching the `INTERNAL_SECRET`
environment variable. Not authenticated as a user; `403` on a mismatch.

```json
{ "success": true, "marked": 3, "checked": 47 }
```

---

## Status codes

| Code | Meaning |
| --- | --- |
| `400` | Missing or invalid fields |
| `401` | Missing, invalid, or expired token |
| `403` | Wrong internal secret |
| `404` | Not found, or owned by another user |
| `409` | Email already registered |
| `429` | Rate limit exceeded on an auth route |
| `500` | Unhandled server error |

Stack traces are included in the error body only when `NODE_ENV=development`.
