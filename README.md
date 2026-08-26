# Applywise

**A job application tracker that notices when your leads go cold.**

Track every application, get stale ones flagged automatically, receive follow-up
reminders by email, and see what your job search is actually converting at.

[![Live Demo — Frontend](https://img.shields.io/badge/Frontend-apply--wise--jade.vercel.app-6EE7B7?style=flat-square&logo=vercel&logoColor=black)](https://apply-wise-jade.vercel.app)
[![Live Demo — API](https://img.shields.io/badge/API-apply--wise--htx9.vercel.app-6EE7B7?style=flat-square&logo=vercel&logoColor=black)](https://apply-wise-htx9.vercel.app/health)

---

## Why

A job search runs to dozens of applications over months. Without a system, leads
go cold quietly, follow-ups get missed, and there is no way to tell what is
working. Applywise is one place to log applications, and it does the noticing for
you: if a job sees no activity inside a window you set per application, it gets
flagged as stale and you get an email about it.

## What it does

- **Track applications** — title, company, location type, salary, posting URL,
  notice period, tags, and notes.
- **Detect stale leads** — a nightly job flags anything untouched past its own
  timeout and emails you a digest.
- **Chase follow-ups** — a daily job reminds you about applications you never
  followed up on after a week.
- **Show your numbers** — response, interview, and offer rates, average days to
  a reply, and application volume over time.
- **Filter and search** — by status, tags, and date range, or across title and
  company.
- **Reset a forgotten password** — emailed single-use link, valid for an hour.

Details, and the files behind each, in [docs/features.md](docs/features.md).

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Client state | Redux Toolkit |
| Server state | TanStack React Query |
| HTTP | Axios, with silent token refresh |
| Backend | Express, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT access + refresh tokens |
| Email | Nodemailer |
| Scheduling | node-cron |
| Charts | Recharts |
| Hosting | Vercel (both projects) |

Versions live in the `package.json` files, so this table never goes stale.

## Quick start

You need Node 18+ and a MongoDB Atlas connection string.

```bash
# 1. Install — two independent projects, no workspace root
cd backend  && npm install
cd frontend && npm install

# 2. Configure
cd backend  && cp .env.example .env        # fill in MONGODB_URI and the JWT secrets
cd frontend && cp .env.example .env.local  # defaults to localhost:5000

# 3. Run, in two terminals
cd backend  && npm run dev   # → http://localhost:5000
cd frontend && npm run dev   # → http://localhost:3000
```

```bash
curl http://localhost:5000/health
# {"status":"ok","app":"Applywise API","timestamp":"..."}
```

Each `.env.example` documents every key inline. Full setup notes, including how
to get an Atlas string and a Gmail App Password, are in
[docs/development.md](docs/development.md).

## Documentation

| Document | Covers |
| --- | --- |
| [docs/development.md](docs/development.md) | Setup, commands, verification, troubleshooting |
| [docs/architecture.md](docs/architecture.md) | How the pieces fit, and why the code is shaped this way |
| [docs/api-reference.md](docs/api-reference.md) | Every endpoint and response shape |
| [docs/data-model.md](docs/data-model.md) | Schemas, indexes, and Mongoose hooks |
| [docs/features.md](docs/features.md) | Each feature and the files behind it |
| [docs/deployment.md](docs/deployment.md) | Vercel and Render, CORS, cron on serverless |
| [docs/accessibility.md](docs/accessibility.md) | UI standard, current baseline, outstanding work |

[CHANGELOG.md](CHANGELOG.md) records what changed.
[CONTRIBUTING.md](CONTRIBUTING.md) covers workflow and what "done" means.
[docs/README.md](docs/README.md) explains how the documentation is organised.

## Known issues

Three worth knowing before you deploy this:

- **Follow-up reminder emails do not send on Vercel.** Serverless has no
  long-lived process, so `node-cron` never fires; only the stale check has an
  external trigger endpoint. [Details](docs/deployment.md#cron-on-serverless).
- **A job that goes stale stays flagged forever.** Nothing clears `isStale`, so a
  revived application still renders struck-through and is skipped by both cron
  jobs. [Details](docs/data-model.md#status-and-staleness).
- **Filters are not in the URL**, so a filtered view cannot be shared or
  bookmarked. [Details](docs/accessibility.md#outstanding).

## Contributing

Branch off, use conventional commits, open a pull request. The full workflow and
the definition of done are in [CONTRIBUTING.md](CONTRIBUTING.md).
