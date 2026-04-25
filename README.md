# Applywise

**A production-grade job application tracker built with Next.js, Express, and MongoDB.**

Track every application, auto-detect stale leads, receive email reminders, and analyse your job search with live charts.

[![Live Demo — Frontend](https://img.shields.io/badge/Frontend-apply--wise--jade.vercel.app-6EE7B7?style=flat-square&logo=vercel&logoColor=black)](https://apply-wise-jade.vercel.app)
[![Live Demo — API](https://img.shields.io/badge/API-apply--wise--htx9.vercel.app-6EE7B7?style=flat-square&logo=vercel&logoColor=black)](https://apply-wise-htx9.vercel.app/health)

</div>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [State management architecture](#state-management-architecture)
- [Background jobs](#background-jobs)
- [Deployment — Vercel](#deployment--vercel)
- [CORS configuration](#cors-configuration)
- [Known limitations on Vercel](#known-limitations-on-vercel)
- [Contributing](#contributing)

---

## Overview

Applywise is a full-stack, production-ready web application that solves a specific problem: job applications are easy to forget. The average job search involves dozens of applications across weeks or months. Without a system, leads go cold, follow-ups get missed, and it becomes impossible to understand what's actually working.

Applywise gives you:

- A single place to log every application
- Automatic staleness detection — if you haven't touched a job in N days, it flags it
- Daily email reminders for follow-ups you haven't sent
- An analytics dashboard that computes your response rate, interview rate, and offer rate from real data

---

## Features

### Job application CRUD

Create, read, update, and delete job applications with rich metadata including title, company, location type, salary range, job posting URL, tags, notice period, and a rich-text description field.

### Automatic stale detection

Every job has a configurable `timeoutDays` field (default: 14). A background cron job runs daily at midnight and marks any job with no activity within that window as `stale`. Stale cards appear with a strikethrough title and reduced opacity in the UI.

### Follow-up tracking

Mark a follow-up as sent and record the date. A second cron job runs at 9am daily and sends email reminders for any `applied` jobs that haven't had a follow-up sent after 7 days.

### Analytics dashboard

The dashboard computes and displays:

- Total applications
- Response rate (interview + offer + rejected / total)
- Interview rate
- Offer rate
- Average days to first response
- Applications per week (last 12 weeks) — bar chart
- Applications per month (last 12 months) — line chart
- Status distribution — donut chart
- Top 10 most-used tags — bar chart

All analytics are computed server-side using MongoDB aggregation pipelines in a single parallel `Promise.all` round-trip.

### Filtering and search

Filter the job list by status, tags (comma-separated), and date range. Full-text search across job title and company name using MongoDB regex. All filters are stored in Redux and automatically trigger React Query refetches via the query key.

### JWT authentication

Access token + refresh token pair. Tokens are rotated on every refresh. The refresh token is stored in MongoDB and invalidated on logout, preventing token reuse after sign-out.

### Email notifications

Three transactional email types sent via Nodemailer:

- Welcome email on first registration
- Stale job digest (grouped per user, one email per cron run)
- Follow-up reminder (per job, sent once when 7 days pass without a follow-up)

---

## Tech stack

| Layer              | Technology                 | Purpose                                    |
| ------------------ | -------------------------- | ------------------------------------------ |
| Frontend framework | Next.js 15 (App Router)    | Server components, routing, SSR            |
| Styling            | Tailwind CSS v3            | Utility-first dark theme                   |
| Animations         | Framer Motion              | Landing page entrance animations           |
| Client state       | Redux Toolkit              | Auth tokens, UI state, active filters      |
| Server state       | TanStack React Query v5    | Data fetching, caching, mutations          |
| HTTP client        | Axios                      | Request interceptors, silent token refresh |
| Backend framework  | Express.js                 | REST API                                   |
| Language           | TypeScript (both)          | End-to-end type safety                     |
| Database           | MongoDB Atlas + Mongoose   | Document store, aggregation                |
| Authentication     | JWT (jsonwebtoken)         | Stateless auth with refresh rotation       |
| Email              | Nodemailer                 | Transactional emails                       |
| Background jobs    | node-cron                  | Scheduled stale check + reminders          |
| Charts             | Recharts                   | Analytics visualisations                   |
| Fonts              | Syne + DM Sans (next/font) | Display + body typefaces                   |
| Deployment         | Vercel (both apps)         | Serverless hosting                         |

---

## Project structure

```
applywise/
│
├── backend/                         Express API
│   ├── src/
│   │   ├── app.ts                   Entry point — Express setup, CORS, boot logic
│   │   ├── config/
│   │   │   └── db.ts                MongoDB Atlas connection with graceful shutdown
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts   Register, login, refresh, logout, getMe
│   │   │   └── job.controller.ts    CRUD + filter query builder + analytics aggregation
│   │   ├── jobs/
│   │   │   ├── staleChecker.ts      Cron: marks stale jobs, sends digest emails
│   │   │   └── followUpReminder.ts  Cron: sends follow-up reminders at 9am
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   JWT verification, req.user injection
│   │   │   └── error.middleware.ts  Global error handler + asyncHandler wrapper
│   │   ├── models/
│   │   │   ├── User.model.ts        User schema — bcrypt pre-hook, comparePassword
│   │   │   └── Job.model.ts         Job schema — 16 fields, 3 compound indexes
│   │   ├── routes/
│   │   │   ├── auth.routes.ts       /api/auth/* — rate-limited
│   │   │   └── job.routes.ts        /api/jobs/* — all protected
│   │   └── utils/
│   │       ├── apiResponse.ts       Consistent sendSuccess / sendError helpers
│   │       ├── email.ts             Nodemailer transporter + 3 email templates
│   │       └── jwt.ts               Sign + verify access and refresh tokens
│   ├── vercel.json                  Routes all requests through Express on Vercel
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                        Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           Root layout — Syne + DM Sans fonts, Providers
│   │   │   ├── page.tsx             Landing page with animated orb background
│   │   │   ├── globals.css          Design tokens, Tailwind directives, animations
│   │   │   ├── (dashboard)/         Route group — protected pages
│   │   │   │   ├── layout.tsx       Auth guard + sidebar + navbar shell
│   │   │   │   ├── dashboard/       Stats overview + status breakdown
│   │   │   │   ├── jobs/            Application list + filters + job cards
│   │   │   │   └── analytics/       Full charts page
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       └── register/
│   │   ├── components/
│   │   │   ├── ui/                  Button, Input, Select, StatusBadge
│   │   │   ├── jobs/                JobCard, JobForm, JobFilters, JobModal, DeleteConfirmModal
│   │   │   └── layout/              Sidebar, Navbar
│   │   ├── hooks/
│   │   │   ├── useJobs.ts           React Query: useJobs, useJob, useAnalytics, mutations
│   │   │   └── useAuth.ts           React Query: useLogin, useRegister, useLogout
│   │   ├── lib/
│   │   │   ├── axios.ts             Axios instance — token injection + silent refresh
│   │   │   ├── api.ts               All API service functions (typed)
│   │   │   ├── queryClient.ts       QueryClient singleton with defaults
│   │   │   └── utils.ts             cn() className helper
│   │   ├── providers/
│   │   │   └── Providers.tsx        Redux + QueryClient wrapper, auth rehydration
│   │   ├── store/
│   │   │   ├── index.ts             Typed store, useAppDispatch, useAppSelector
│   │   │   ├── authSlice.ts         User, tokens, localStorage persistence
│   │   │   ├── filterSlice.ts       Status, search, tags, sort, date range
│   │   │   └── uiSlice.ts           Modal state, editing job ID, delete confirm
│   │   └── types/
│   │       ├── job.ts               Job, CreateJobInput, JobFilters, AnalyticsData
│   │       └── auth.ts              User, AuthState, LoginInput, RegisterInput
│   ├── vercel.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── next.config.js
│   └── package.json
│
├── render.yaml                      Render.com deployment config (alternative to Vercel)
└── README.md
```

---

## Local development

### Prerequisites

| Tool                  | Minimum version               |
| --------------------- | ----------------------------- |
| Node.js               | 18.x                          |
| npm                   | 9.x                           |
| MongoDB Atlas account | Free tier (M0) works          |
| Gmail account         | Optional — for email features |

### 1. Clone the repository

```bash
git clone https://github.com/your-username/applywise.git
cd applywise
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

### 3. Configure environment variables

See the [Environment variables](#environment-variables) section for all values.

```bash
# Backend
cd backend
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_URL

# Frontend
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000 (already set by default)
```

### 4. Run both servers

```bash
# Terminal 1 — API
cd backend && npm run dev
# Starts ts-node with nodemon watching src/**/*.ts
# → http://localhost:5000

# Terminal 2 — Next.js
cd frontend && npm run dev
# → http://localhost:3000
```

Verify the backend is running:

```bash
curl http://localhost:5000/health
# {"status":"ok","app":"Applywise API","timestamp":"..."}
```

---

## Environment variables

### Backend — `backend/.env`

| Variable                 | Required | Description                                                                                                |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`            | ✅       | MongoDB Atlas connection string. Format: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/applywise`       |
| `JWT_SECRET`             | ✅       | Secret for signing access tokens. Generate: `openssl rand -base64 64`                                      |
| `JWT_REFRESH_SECRET`     | ✅       | Separate secret for refresh tokens. Must differ from `JWT_SECRET`                                          |
| `JWT_EXPIRES_IN`         | ❌       | Access token TTL. Default: `15m`                                                                           |
| `JWT_REFRESH_EXPIRES_IN` | ❌       | Refresh token TTL. Default: `7d`                                                                           |
| `CLIENT_URL`             | ✅       | Frontend origin for CORS. Local: `http://localhost:3000`. Production: `https://apply-wise-jade.vercel.app` |
| `PORT`                   | ❌       | Server port. Default: `5000`                                                                               |
| `NODE_ENV`               | ❌       | `development` or `production`                                                                              |
| `INTERNAL_SECRET`        | ❌       | Secret header for the manual stale-check endpoint                                                          |
| `SMTP_HOST`              | ❌       | SMTP server. Example: `smtp.gmail.com`                                                                     |
| `SMTP_PORT`              | ❌       | SMTP port. `587` for TLS, `465` for SSL                                                                    |
| `SMTP_USER`              | ❌       | SMTP username / email address                                                                              |
| `SMTP_PASS`              | ❌       | SMTP password. For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833)         |
| `EMAIL_FROM`             | ❌       | From address. Example: `Applywise <noreply@yourdomain.com>`                                                |

### Frontend — `frontend/.env.local`

| Variable              | Required | Description                                                                                                                       |
| --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | ✅       | Full URL of the backend API — no trailing slash. Local: `http://localhost:5000`. Production: `https://apply-wise-htx9.vercel.app` |

> **Security note:** Never commit `.env` or `.env.local` to Git. Both files are already in `.gitignore`. Only `.env.example` (with placeholder values) should be committed.

---

## Database schema

### User

```
_id           ObjectId   Auto-generated
name          String     Required, max 60 chars
email         String     Required, unique, lowercase
password      String     bcrypt hash (saltRounds: 12), never returned in API responses
refreshToken  String     Stored for rotation validation, not returned in API
createdAt     Date       Auto (Mongoose timestamps)
updatedAt     Date       Auto (Mongoose timestamps)
```

Index: `{ email: 1 }` unique

### Job

```
_id             ObjectId    Auto-generated
user            ObjectId    Ref: User — all queries scoped to this field
title           String      Required, max 120 chars
company         String      Required, max 100 chars
location        String      Enum: remote | onsite | hybrid
salary          String      Free text — e.g. "$80k–$100k"
applicationDate Date        Required
status          String      Enum: applied | interviewing | offer | rejected | stale
                            Default: applied
noticePeriod    String      Free text — e.g. "2 weeks"
description     String      HTML from rich text editor
jobLink         String      URL to the job posting
tags            [String]    Array of free-form tags
followUpSent    Boolean     Default: false
followUpDate    Date        When follow-up was sent
timeoutDays     Number      Default: 14, min: 1, max: 365
isStale         Boolean     Default: false — set true by stale checker cron
lastActivityAt  Date        Reset on every save — used by stale checker
createdAt       Date        Auto
updatedAt       Date        Auto
```

Indexes:

- `{ user: 1 }` — scopes all queries to the owner
- `{ user: 1, status: 1 }` — most common list query
- `{ user: 1, applicationDate: -1 }` — date-sorted list
- `{ user: 1, isStale: 1, status: 1 }` — stale checker query

> **Why `lastActivityAt` instead of `updatedAt`?** Mongoose's `updatedAt` changes on any document write, including admin scripts and migrations. `lastActivityAt` is only reset by application business logic (pre-save and pre-findOneAndUpdate hooks), giving the stale checker a clean, reliable signal.

---

## API reference

Base URL: `https://apply-wise-htx9.vercel.app`

All protected routes require the header:

```
Authorization: Bearer <access_token>
```

### Auth

#### `POST /api/auth/register`

Rate limited: 10 requests per 15 minutes.

Request body:

```json
{
    "name": "Your Name",
    "email": "you@example.com",
    "password": "minimum8chars"
}
```

Response `201`:

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "...",
            "name": "Your Name",
            "email": "you@example.com"
        },
        "accessToken": "eyJ...",
        "refreshToken": "eyJ..."
    }
}
```

---

#### `POST /api/auth/login`

Rate limited: 10 requests per 15 minutes.

Request body:

```json
{
    "email": "you@example.com",
    "password": "yourpassword"
}
```

Response `200`: Same shape as register.

---

#### `POST /api/auth/refresh`

Request body:

```json
{
    "refreshToken": "eyJ..."
}
```

Response `200`:

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJ...",
        "refreshToken": "eyJ..."
    }
}
```

---

#### `POST /api/auth/logout`

Request body:

```json
{
    "refreshToken": "eyJ..."
}
```

Invalidates the stored refresh token. Subsequent refresh attempts with the same token will fail.

---

#### `GET /api/auth/me` 🔒

Response `200`:

```json
{
    "success": true,
    "data": { "id": "...", "name": "Your Name", "email": "you@example.com" }
}
```

---

### Jobs

#### `GET /api/jobs` 🔒

Fetch a paginated, filtered list of the authenticated user's jobs.

Query parameters:

| Parameter   | Type   | Description                                                                                                    |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `status`    | string | Filter by status: `applied`, `interviewing`, `offer`, `rejected`, `stale`                                      |
| `tags`      | string | Comma-separated tags: `remote,startup`                                                                         |
| `startDate` | string | ISO date — applicationDate range start: `2024-01-01`                                                           |
| `endDate`   | string | ISO date — applicationDate range end: `2024-12-31`                                                             |
| `search`    | string | Text search across `title` and `company` (case-insensitive)                                                    |
| `sortBy`    | string | Field to sort by. Default: `applicationDate`. Options: `applicationDate`, `company`, `title`, `lastActivityAt` |
| `order`     | string | `asc` or `desc`. Default: `desc`                                                                               |
| `page`      | number | Page number. Default: `1`                                                                                      |
| `limit`     | number | Items per page. Default: `20`, max: `100`                                                                      |

Response `200`:

```json
{
    "success": true,
    "data": [
        /* Job objects — description field excluded from list */
    ],
    "meta": {
        "total": 42,
        "page": 1,
        "limit": 20,
        "totalPages": 3
    }
}
```

> Note: The `description` field is excluded from list responses for performance. Fetch a single job by ID to get the full description.

---

#### `POST /api/jobs` 🔒

Request body:

```json
{
    "title": "Senior Engineer",
    "company": "Acme Corp",
    "applicationDate": "2024-11-15",
    "status": "applied",
    "location": "remote",
    "salary": "$120k–$140k",
    "jobLink": "https://acme.com/jobs/123",
    "tags": ["typescript", "remote", "series-b"],
    "timeoutDays": 14,
    "followUpSent": false
}
```

Response `201`: Created job object.

---

#### `GET /api/jobs/analytics` 🔒

> Must come before `GET /api/jobs/:id` in route order — `analytics` would otherwise be parsed as an `:id`.

Response `200`:

```json
{
    "success": true,
    "data": {
        "total": 45,
        "byStatus": {
            "applied": 20,
            "interviewing": 10,
            "offer": 3,
            "rejected": 8,
            "stale": 4
        },
        "rates": {
            "response": 46.7,
            "interview": 22.2,
            "offer": 6.7,
            "stale": 8.9
        },
        "avgDaysToResponse": 12.4,
        "weekly": [
            {
                "_id": { "year": 2024, "week": 45 },
                "count": 4,
                "firstDate": "2024-11-04T..."
            }
        ],
        "monthly": [{ "_id": { "year": 2024, "month": 11 }, "count": 12 }],
        "topTags": [
            { "_id": "remote", "count": 18 },
            { "_id": "typescript", "count": 12 }
        ]
    }
}
```

---

#### `GET /api/jobs/:id` 🔒

Returns the full job object including the `description` field.

---

#### `PUT /api/jobs/:id` 🔒

Request body: Any subset of job fields to update. The `user` field is stripped server-side.

Updating any field resets `lastActivityAt` (via the `pre('findOneAndUpdate')` hook), which restarts the stale countdown.

---

#### `DELETE /api/jobs/:id` 🔒

Response `200`: `{ "success": true, "data": null, "message": "Job deleted" }`

---

#### `POST /api/internal/run-stale-check`

Manually triggers the stale check — useful when running on Vercel where `node-cron` doesn't fire between requests.

Required header: `x-internal-secret: <INTERNAL_SECRET env var>`

Response `200`:

```json
{
    "success": true,
    "marked": 3,
    "checked": 47
}
```

---

### Standard error responses

All errors follow this shape:

```json
{
    "success": false,
    "message": "Human-readable error message"
}
```

| Status | Meaning                                           |
| ------ | ------------------------------------------------- |
| `400`  | Bad request — missing or invalid fields           |
| `401`  | Unauthorised — missing, invalid, or expired token |
| `403`  | Forbidden — valid token but wrong resource owner  |
| `404`  | Not found                                         |
| `409`  | Conflict — e.g. email already registered          |
| `429`  | Too many requests — rate limit hit                |
| `500`  | Internal server error                             |

---

## State management architecture

The frontend strictly separates two kinds of state:

### Redux Toolkit — client/UI state

Redux owns state that has nothing to do with the server:

| Slice         | State                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| `authSlice`   | `user`, `accessToken`, `refreshToken`, `isInitialised`                   |
| `filterSlice` | `status`, `search`, `tags`, `sortBy`, `order`, `startDate`, `endDate`    |
| `uiSlice`     | `isJobModalOpen`, `editingJobId`, `isDeleteConfirmOpen`, `deletingJobId` |

Auth state persists to `localStorage` via `setCredentials` and is rehydrated on boot via the `rehydrate` action dispatched from `Providers.tsx`.

### TanStack React Query — server state

React Query owns all data that comes from the API:

| Hook             | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `useJobs(page)`  | Paginated job list — query key includes all Redux filters  |
| `useJob(id)`     | Single job detail                                          |
| `useAnalytics()` | Dashboard stats                                            |
| `useCreateJob()` | Mutation — invalidates job list + analytics on success     |
| `useUpdateJob()` | Mutation — updates detail cache directly, invalidates list |
| `useDeleteJob()` | Mutation — removes from detail cache, invalidates list     |

**The key integration point:** `useJobs` builds its query key from the Redux filter state:

```typescript
queryKey: jobKeys.filtered({ ...filters, page, userId });
```

When any filter changes in Redux, React Query detects the new key and automatically refetches — no manual trigger needed.

**Rule:** Server data is never stored in Redux. Loading and error states are never stored in Redux. They live exclusively in React Query.

---

## Background jobs

### Stale checker — runs daily at midnight (`0 0 * * *`)

1. Finds all jobs with `status: applied | interviewing` and `isStale: false`
2. Checks if `dayjs().diff(job.lastActivityAt, 'day') >= job.timeoutDays`
3. Bulk-updates stale jobs: `{ status: 'stale', isStale: true }`
4. Groups stale jobs by `user` and sends one digest email per affected user

### Follow-up reminder — runs daily at 9am (`0 9 * * *`)

1. Finds jobs with `status: applied`, `followUpSent: false`, `isStale: false`, and `applicationDate` at least 7 days ago
2. Sends one reminder email per qualifying job

### Testing crons locally

Change the schedule to `*/1 * * * *` (every minute) and watch the console logs. Revert before committing.

### Crons on Vercel

Vercel is serverless — there is no persistent process, so `node-cron` never fires automatically between incoming requests. To trigger crons in production, use an external scheduler:

1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create a job with:
    - URL: `https://apply-wise-htx9.vercel.app/api/internal/run-stale-check`
    - Method: `POST`
    - Header: `x-internal-secret: <your INTERNAL_SECRET value>`
    - Schedule: Once daily at midnight

---

## Deployment — Vercel

Both the frontend and backend are deployed on Vercel as separate projects from the same monorepo.

### Backend — `applywise/backend`

#### `backend/vercel.json`

```json
{
    "version": 2,
    "builds": [{ "src": "src/app.ts", "use": "@vercel/node" }],
    "routes": [{ "src": "/(.*)", "dest": "src/app.ts" }]
}
```

This file is critical. Without it, Vercel doesn't know Express exists and serves a 404 with no CORS headers for every request.

#### Vercel environment variables (backend project)

Set these in the Vercel dashboard → Settings → Environment Variables:

```
MONGODB_URI           = mongodb+srv://...
JWT_SECRET            = (long random string)
JWT_REFRESH_SECRET    = (different long random string)
JWT_EXPIRES_IN        = 15m
JWT_REFRESH_EXPIRES_IN = 7d
CLIENT_URL            = https://apply-wise-jade.vercel.app
NODE_ENV              = production
INTERNAL_SECRET       = (random string for cron endpoint)
```

SMTP variables are optional — the app works without email configured.

---

### Frontend — `applywise/frontend`

Standard Next.js deployment. Vercel auto-detects the framework.

#### Vercel environment variables (frontend project)

```
NEXT_PUBLIC_API_URL = https://apply-wise-htx9.vercel.app
```

This is the only required environment variable. It must not have a trailing slash.

---

## CORS configuration

The backend is configured to accept requests from a list of allowed origins:

```typescript
const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    process.env.CLIENT_URL,
].filter(Boolean);
```

The CORS middleware uses an exact-match function rather than a single string, which correctly handles the `Origin` header sent by browsers. Preflight `OPTIONS` requests are handled explicitly with `app.options('*', cors())` before all routes.

**If you add a custom domain** to your frontend, add it to the `ALLOWED_ORIGINS` array or update `CLIENT_URL` to the new domain.

**If you see CORS errors after deployment**, check:

1. `CLIENT_URL` on the backend matches your frontend URL exactly (no trailing slash)
2. `NEXT_PUBLIC_API_URL` on the frontend matches your backend URL exactly
3. Both Vercel projects have been redeployed after the env var changes

---

## Known limitations on Vercel

| Limitation              | Details                                                                      | Workaround                                                                                |
| ----------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| No persistent cron jobs | `node-cron` requires a long-running process. Vercel functions are stateless. | Use [cron-job.org](https://cron-job.org) to POST to `/api/internal/run-stale-check` daily |
| Cold starts             | Free tier functions may take 1–3s to wake on first request                   | Use Vercel's Fluid compute or upgrade to Pro                                              |
| Function timeout        | Vercel functions time out at 10s (Hobby) / 60s (Pro)                         | All queries are optimised to complete well within this window                             |
| No WebSockets           | Vercel doesn't support persistent connections                                | Not currently used; would need a service like Ably or Pusher to add real-time             |

---

## Contributing

```bash
# 1. Fork the repository

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Make your changes with conventional commits
git commit -m "feat: add bulk delete functionality"
git commit -m "fix: resolve stale checker timezone issue"
git commit -m "docs: update API reference for analytics endpoint"

# 4. Push and open a pull request
git push origin feat/your-feature-name
```

### Commit message prefixes

| Prefix      | Use for                            |
| ----------- | ---------------------------------- |
| `feat:`     | New feature                        |
| `fix:`      | Bug fix                            |
| `docs:`     | Documentation only                 |
| `refactor:` | Code change with no feature or fix |
| `style:`    | Formatting, no logic change        |
| `chore:`    | Build process, dependency updates  |

---
