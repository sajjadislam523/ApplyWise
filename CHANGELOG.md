# Changelog

All notable changes to Applywise are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **Password reset.** Request a link from the sign-in page, receive an email,
  choose a new password. Tokens are 32 random bytes stored only as a SHA-256
  hash, valid for 60 minutes, single-use, and superseded when a newer link is
  requested. `forgot-password` answers identically whether or not the address has
  an account, so it cannot be used to discover who is registered. Completing a
  reset clears the stored refresh token, ending every other session.
- Documentation system under `docs/` — architecture, API reference, data model,
  features, development, deployment, and accessibility, each with a stated source
  and a routing table describing which document a given change belongs in.
- `CONTRIBUTING.md` covering branch and commit conventions and a definition of done.
- Committed `backend/.env.example` and `frontend/.env.example`. These were
  previously listed in `.gitignore`, so the README's `cp .env.example .env`
  setup step could not work.
- `aria-live` announcement of the application count on the jobs page.

### Fixed

- **Login errors never appeared.** `frontend/src/lib/axios.ts` treated every 401
  as an expired access token, so a failed login triggered the silent-refresh
  flow. With no refresh token to send, `/auth/refresh` failed, the handler
  hard-redirected via `window.location.href`, and the resulting page reload
  destroyed React state before the message could paint — the form simply blanked.
  The promise also rejected with the refresh error rather than the login error,
  so even without the redirect the wrong message would have shown. Credential
  endpoints are now excluded from the refresh path.
- **Search fired one API request per keystroke.** The search box dispatched to
  Redux on every character, and the Redux filter state is part of the React Query
  key, so typing an eight-letter company name issued eight requests. Input is now
  held locally and pushed to Redux after a 300ms pause.
- **Pagination did not reset when filters changed.** Narrowing the filter while on
  a later page requested a page that no longer existed and rendered an empty list
  with no explanation.
- **Dashboard greeting caused a hydration mismatch.** The time-of-day greeting
  called `new Date().getHours()` during render, which resolves against the
  server's timezone during SSR and the viewer's on the client. It is now computed
  after mount.
- **Native form controls rendered light on the dark theme.** `color-scheme: dark`
  was missing, leaving date pickers, `<select>` dropdowns, and scrollbars in the
  browser's light styling — the job form's date picker glyph was a dark icon on a
  dark field.
- **Form control ids collided.** `Input` and `Select` derived their `id` from the
  label text, so two fields sharing a label on one page produced duplicate ids and
  silently broke `htmlFor`. Both now use `useId()`.

### Changed

- Accessibility pass against the
  [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines):
  `aria-label` on all icon-only buttons, `aria-hidden` on decorative icons,
  `role="dialog"` / `aria-modal` / `aria-labelledby` on both modals, `autoComplete`
  on all auth fields, `focus:` → `focus-visible:` throughout, every
  `transition: all` replaced with an explicit property list, `overscroll-contain`
  on the scrollable modal, and `…` in place of `...`.
- `DeleteConfirmModal` now closes on Escape and locks body scroll, matching
  `JobModal`.
- README rewritten as a short entry point that links to `docs/`, replacing the
  813-line single-file manual. Corrected along the way: the documented Tailwind
  version and config file, the framework versions, and a description of CORS
  handling that did not match the code.

### Known issues

- `isStale` is never cleared once set, so a job revived after going stale still
  renders struck-through and is permanently skipped by both cron jobs. See
  [docs/data-model.md](docs/data-model.md#status-and-staleness).
- Follow-up reminder emails never send on the Vercel deployment — only the stale
  check has an external trigger endpoint. See
  [docs/deployment.md](docs/deployment.md#cron-on-serverless).
- Filter and pagination state is not reflected in the URL. See
  [docs/accessibility.md](docs/accessibility.md#outstanding).

---

## [1.0.0]

First working version: a full-stack job application tracker.

### Added

- Job application CRUD with title, company, location type, salary, posting URL,
  notice period, tags, rich-text description, and a per-job staleness timeout.
- JWT authentication with access and refresh tokens, refresh rotation, bcrypt
  password hashing, and rate limiting on the auth routes.
- Automatic stale detection — a nightly cron marks jobs with no activity inside
  their timeout window and emails each affected user a digest.
- Follow-up reminders — a daily cron emails a reminder for any applied job with
  no follow-up sent after seven days.
- Analytics dashboard: response, interview, and offer rates, average days to
  response, weekly and monthly application counts, status distribution, and top
  tags, computed with parallel MongoDB aggregation pipelines.
- Filtering by status, tags, and date range, plus search across title and company.
- Transactional email via Nodemailer: welcome, stale digest, and follow-up reminder.
- Deployment configuration for Vercel, with an unused Render alternative.

[Unreleased]: https://github.com/sajjadislam523/ApplyWise/compare/main...HEAD
