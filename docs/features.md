# Features

What Applywise does, and which files implement each part.

**Source:** `backend/src/`, `frontend/src/`

---

## Application tracking

Create, edit, and delete job applications. Each carries a title, company,
location type, salary range, posting URL, notice period, tags, a rich-text
description, and a configurable staleness timeout.

The list view shows every field except `description`, which the API omits from
list responses because it is the only large field on the document. Opening the
edit form fetches the single job to get it.

*Implemented in:* `backend/src/controllers/job.controller.ts`,
`frontend/src/components/jobs/JobCard.tsx`, `frontend/src/components/jobs/JobForm.tsx`

## Automatic stale detection

Each job has a `timeoutDays` value, defaulting to 14. A cron job at midnight
finds every `applied` or `interviewing` job that has had no activity within its
own window and marks it `stale`, then emails each affected user a single digest
listing all of their newly stale jobs.

"Activity" means a write through the API, tracked by `lastActivityAt` rather than
`updatedAt` — see [data-model.md](data-model.md#lastactivityat) for why, and for
a known issue with jobs that are revived after going stale.

Stale cards render at reduced opacity with a struck-through title.

*Implemented in:* `backend/src/jobs/staleChecker.ts`, `backend/src/models/Job.model.ts`

## Follow-up tracking

Mark a follow-up as sent and record its date. A second cron job, at 9am, finds
every job still in `applied` with no follow-up sent and an application date at
least seven days old, and emails one reminder per job.

The seven-day threshold is fixed in code, unlike the per-job staleness timeout.

*Implemented in:* `backend/src/jobs/followUpReminder.ts`

## Analytics

Totals, response rate, interview rate, offer rate, average days to response, a
weekly and monthly application count, the status distribution, and the ten most
used tags — computed server-side by five MongoDB aggregation pipelines run in
parallel.

`avgDaysToResponse` is an approximation; see
[api-reference.md](api-reference.md#get-apijobsanalytics).

*Implemented in:* `backend/src/controllers/job.controller.ts` (`getAnalytics`),
`frontend/src/app/(dashboard)/analytics/page.tsx`

## Filtering and search

Filter by status, tags, and application-date range; search across title and
company. Filters live in Redux and feed the React Query key, so changing one
refetches automatically — see
[architecture.md](architecture.md#frontend-the-state-split).

Search is debounced by 300ms. Changing any filter resets pagination to page one.

Filter state is **not** reflected in the URL, so a filtered view cannot be
shared or bookmarked and the browser back button does not undo a filter change.
Tracked in [accessibility.md](accessibility.md#outstanding).

*Implemented in:* `frontend/src/store/filterSlice.ts`,
`frontend/src/components/jobs/JobFilters.tsx`, `frontend/src/hooks/useJobs.ts`

## Authentication

Email and password registration and login, with bcrypt hashing at 12 rounds.
Access tokens are short-lived and refreshed silently by an axios interceptor;
refresh tokens rotate on every use and are stored on the user document, so
logout genuinely revokes access.

One session per user at a time — see
[architecture.md](architecture.md#authentication).

Registration and login are rate limited to 10 requests per 15 minutes per IP.

*Implemented in:* `backend/src/controllers/auth.controller.ts`,
`backend/src/middleware/auth.middleware.ts`, `frontend/src/lib/axios.ts`

## Password reset

Request a link from the sign-in page, receive an email, choose a new password.

The token is 32 random bytes; only its SHA-256 hash is stored, so the raw value
exists solely in the email. Links last 60 minutes, work once, and are superseded
the moment a newer one is requested. Completing a reset also clears the stored
refresh token, ending every other session.

`forgot-password` always answers identically whether or not the address has an
account, so the endpoint cannot be used to discover who is registered.

If SMTP is unconfigured the request still succeeds — the email simply never
arrives, matching how every other send in the app behaves.

*Implemented in:* `backend/src/controllers/auth.controller.ts`
(`forgotPassword`, `resetPassword`), `backend/src/utils/email.ts`,
`frontend/src/app/auth/forgot-password/page.tsx`,
`frontend/src/app/auth/reset-password/page.tsx`

## Email notifications

Four transactional emails, all sent through Nodemailer:

| Email | Trigger |
| --- | --- |
| Welcome | First registration |
| Password reset | A reset link is requested |
| Stale digest | Stale checker run, one per affected user |
| Follow-up reminder | Follow-up cron, one per qualifying job |

Every send is fire-and-forget. If SMTP is unconfigured or failing, requests still
succeed and cron jobs still complete — the messages simply do not go out.

*Implemented in:* `backend/src/utils/email.ts`
