# Data model

The two collections, their indexes, and the hooks that write to them.

**Source:** `backend/src/models/User.model.ts`, `backend/src/models/Job.model.ts`

---

## User

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | |
| `name` | String | Required, trimmed, max 60 |
| `email` | String | Required, unique, lowercased, trimmed |
| `password` | String | Required, min 8, `select: false` |
| `refreshToken` | String | `select: false` |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

**Index:** `{ email: 1 }` unique.

`password` and `refreshToken` are both `select: false`, so they are absent from
query results unless explicitly requested. The login controller opts back in with
`.select('+password')`, and the refresh controller with `.select('+refreshToken')`.
Nothing else reads them, which is what keeps them out of API responses by
default rather than by remembering to strip them.

A `pre('save')` hook hashes the password with bcrypt at 12 rounds, but only when
the field was actually modified — so re-saving a user for any other reason does
not double-hash it. `comparePassword()` on the document wraps `bcrypt.compare`.

Because the refresh token is stored here as a single value, only one session per
user can be valid at a time. See
[architecture.md](architecture.md#one-refresh-token-per-user).

---

## Job

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | |
| `user` | ObjectId → User | Required, indexed. Every query filters on it |
| `title` | String | Required, trimmed, max 120 |
| `company` | String | Required, trimmed, max 100 |
| `location` | String | `remote` \| `onsite` \| `hybrid` |
| `salary` | String | Free text, e.g. `"$80k–$100k"` |
| `applicationDate` | Date | Required |
| `status` | String | `applied` \| `interviewing` \| `offer` \| `rejected` \| `stale`. Default `applied`, indexed |
| `noticePeriod` | String | Free text |
| `description` | String | HTML. Excluded from list responses |
| `jobLink` | String | URL to the posting |
| `tags` | [String] | Trimmed, no cap |
| `followUpSent` | Boolean | Default `false` |
| `followUpDate` | Date | |
| `timeoutDays` | Number | Default 14, min 1, max 365 |
| `isStale` | Boolean | Default `false`, indexed. Set by the stale checker |
| `lastActivityAt` | Date | Default now. See below |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### Indexes

| Index | Serves |
| --- | --- |
| `{ user: 1 }` | Scopes every query to its owner |
| `{ user: 1, status: 1 }` | The common filtered list query |
| `{ user: 1, applicationDate: -1 }` | The default date-sorted list |
| `{ user: 1, isStale: 1, status: 1 }` | The stale checker's candidate scan |

`user` and `status` also carry field-level `index: true`, so those two are
declared twice — once inline and once as part of a compound index.

### `lastActivityAt`

This field exists because Mongoose's `updatedAt` is too eager. `updatedAt` moves
on *any* write — a migration, an admin fix, a bulk script — and the stale checker
needs a timestamp that only real user activity moves. Without the distinction, a
one-off maintenance script would silently reset every user's stale countdown.

Two hooks maintain it:

```ts
jobSchema.pre('save',             function () { this.lastActivityAt = new Date(); });
jobSchema.pre('findOneAndUpdate', function () { this.set({ lastActivityAt: new Date() }); });
```

So creating or editing a job through the API restarts its countdown, and touching
the document any other way does not.

**The stale checker deliberately escapes these hooks.** It marks jobs with
`Job.updateMany`, which fires neither hook, so flagging a job as stale does not
reset the timestamp that made it stale. Any future bulk write that *should* count
as activity must use a method that triggers the hooks, or set the field itself.

### Status and staleness

`status: 'stale'` and `isStale: true` are set together by the stale checker, and
are effectively one piece of state stored twice — the enum drives the UI badge,
the boolean drives the checker's own candidate query.

> **Known issue: `isStale` is never cleared.**
>
> Nothing in either project sets `isStale` back to `false`. The stale checker only
> ever sets it to `true`, and the field is excluded from `CreateJobInput`
> (`frontend/src/types/job.ts`), so the edit form cannot send it either.
>
> Once a job has gone stale that flag is permanent, with three consequences:
>
> 1. Editing the job and setting its status back to `interviewing` leaves
>    `isStale: true`, so `JobCard` still renders it at 50% opacity with a
>    struck-through title and the line "No activity for N days" — while the badge
>    reads Interviewing.
> 2. The stale checker queries `isStale: false`, so a revived job is never
>    evaluated for staleness again.
> 3. The follow-up reminder also queries `isStale: false`, so it never sends for
>    that job again.
>
> A fix means clearing `isStale` whenever a job's status moves off `stale` —
> most cleanly in the `pre('findOneAndUpdate')` hook alongside `lastActivityAt`,
> so it holds for every write path rather than just the edit form.
