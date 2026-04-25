# Applywise

A production-grade job application tracker. Track every application, auto-detect stale leads, get email reminders, and analyse your search with charts.

---

## Tech stack

| Layer       | Technology                               |
|-------------|------------------------------------------|
| Frontend    | Next.js 15 (App Router) · Tailwind CSS   |
| State       | Redux Toolkit · TanStack React Query     |
| Backend     | Node.js · Express · TypeScript           |
| Database    | MongoDB Atlas · Mongoose                 |
| Auth        | JWT (access + refresh token rotation)    |
| Email       | Nodemailer                               |
| Charts      | Recharts                                 |
| Deploy      | Vercel (frontend) · Render (backend)     |

---

## Local development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Gmail account with App Password (for emails — optional)

### 1. Clone and install

```bash
git clone <your-repo>
cd applywise

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

**Backend** — copy and fill in:
```bash
cd backend
cp .env.example .env
```

Required values in `backend/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/applywise
JWT_SECRET=<run: openssl rand -base64 64>
JWT_REFRESH_SECRET=<run: openssl rand -base64 64>
CLIENT_URL=http://localhost:3000
```

Optional (emails won't send without these but the app still works):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<your Gmail App Password>
EMAIL_FROM=Applywise <you@gmail.com>
```

**Frontend** — copy and fill in:
```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000  (already set)
```

### 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev
# → http://localhost:5000

# Terminal 2 — frontend
cd frontend && npm run dev
# → http://localhost:3000
```

---

## Background jobs

| Job                  | Schedule      | What it does                                              |
|----------------------|---------------|-----------------------------------------------------------|
| `staleChecker`       | Daily midnight | Marks inactive jobs stale, emails affected users a digest |
| `followUpReminder`   | Daily 9am      | Emails reminders for un-followed applied jobs (7+ days)   |

### Testing crons locally

Change the cron schedule in the source file to `*/1 * * * *` (every minute) and watch the logs. Revert before committing.

### Production (Render free tier)

The server sleeps on Render's free tier — crons won't fire. Two options:
1. **Upgrade to Starter plan ($7/mo)** — server stays alive, crons fire normally
2. **Use an external trigger** — point [cron-job.org](https://cron-job.org) to hit:
   ```
   POST https://your-api.onrender.com/api/internal/run-stale-check
   Header: x-internal-secret: <your INTERNAL_SECRET env var>
   ```

---

## Deployment

### Backend → Render

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your repo, set root directory to `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add all env vars from `.env.example` in the Render dashboard

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

## Project structure

```
applywise/
├── backend/
│   └── src/
│       ├── app.ts              Entry point
│       ├── config/db.ts        MongoDB connection
│       ├── controllers/        Auth + Job request handlers
│       ├── jobs/               Cron workers (stale, follow-up)
│       ├── middleware/         JWT auth, error handler
│       ├── models/             User + Job Mongoose schemas
│       ├── routes/             Express routers
│       └── utils/              JWT, email, API response helpers
└── frontend/
    └── src/
        ├── app/                Next.js App Router pages
        ├── components/         UI, jobs, dashboard, layout
        ├── hooks/              React Query hooks (useJobs, useAuth)
        ├── lib/                Axios instance, QueryClient, API service
        ├── providers/          Redux + QueryClient wrapper
        ├── store/              authSlice, filterSlice, uiSlice
        └── types/              TypeScript interfaces
```

---

## API reference

| Method | Route                              | Auth | Description                    |
|--------|------------------------------------|------|--------------------------------|
| POST   | `/api/auth/register`               | —    | Create account                 |
| POST   | `/api/auth/login`                  | —    | Get tokens                     |
| POST   | `/api/auth/refresh`                | —    | Rotate access token            |
| POST   | `/api/auth/logout`                 | —    | Revoke refresh token           |
| GET    | `/api/auth/me`                     | ✓    | Current user                   |
| GET    | `/api/jobs`                        | ✓    | List with filters + pagination |
| POST   | `/api/jobs`                        | ✓    | Create application             |
| GET    | `/api/jobs/analytics`              | ✓    | Dashboard stats                |
| GET    | `/api/jobs/:id`                    | ✓    | Single job detail              |
| PUT    | `/api/jobs/:id`                    | ✓    | Update job                     |
| DELETE | `/api/jobs/:id`                    | ✓    | Delete job                     |
| POST   | `/api/internal/run-stale-check`    | 🔑   | Manual stale check trigger     |

Query params for `GET /api/jobs`:
`status`, `tags`, `startDate`, `endDate`, `search`, `sortBy`, `order`, `page`, `limit`
