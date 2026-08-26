# Applywise documentation

Start here. Each document below has exactly one job.

| Document | What it covers |
| --- | --- |
| [development.md](development.md) | Prerequisites, setup, commands, verification, troubleshooting |
| [architecture.md](architecture.md) | How the two projects fit together, and why the code is shaped this way |
| [api-reference.md](api-reference.md) | Every endpoint, its parameters, and its response shape |
| [data-model.md](data-model.md) | The User and Job schemas, indexes, and Mongoose hooks |
| [features.md](features.md) | What each feature does and which files implement it |
| [deployment.md](deployment.md) | Vercel and Render deployment, CORS, cron on serverless |
| [accessibility.md](accessibility.md) | The UI standard, what meets it, and what is still outstanding |

Outside this directory: [`CHANGELOG.md`](../CHANGELOG.md) records what changed,
[`CONTRIBUTING.md`](../CONTRIBUTING.md) covers workflow, and [`CLAUDE.md`](../CLAUDE.md)
carries the same conventions in the form AI coding agents read.

---

## How these documents stay accurate

The README this set replaced had drifted from the code — it described a Tailwind
version the project no longer used, a CORS implementation that was never written,
and a setup step that could not work. That happened because one enormous file
repeated the same facts in several places, so a change only ever got applied to
some of them. Three rules keep that from recurring.

### 1. One fact, one home

Every fact is written down in exactly one place, and everywhere else links to it.

| Fact | Lives in |
| --- | --- |
| Dependency versions | `package.json` — docs name frameworks, never version numbers |
| Environment variables | `backend/.env.example`, `frontend/.env.example` |
| Endpoint contracts | [api-reference.md](api-reference.md) |
| Schema fields and indexes | [data-model.md](data-model.md) |

So [development.md](development.md) explains how to *obtain* a MongoDB
connection string without restating the variable list, and no document claims
"Next.js 15" — a statement that was true once and silently stopped being true.

### 2. Every document names its sources

Each file opens with a purpose line and a `Source:` line listing the code it
describes. That lets a reader verify a claim without hunting for it, and tells an
editor which document to revisit after touching a file.

### 3. A routing table

When you change something, this says where to write it down. The same table
appears in [CONTRIBUTING.md](../CONTRIBUTING.md) and [CLAUDE.md](../CLAUDE.md).

| You changed | Update |
| --- | --- |
| Anything a user would notice | [`CHANGELOG.md`](../CHANGELOG.md), under `[Unreleased]` |
| An endpoint, parameter, or response | [api-reference.md](api-reference.md) |
| A schema field, index, or hook | [data-model.md](data-model.md) |
| Environment variables | the relevant `.env.example` |
| A convention spanning several files | [architecture.md](architecture.md) and [`CLAUDE.md`](../CLAUDE.md) |
| A user-facing feature | [features.md](features.md) and the README feature list |
| Deployment, CORS, or cron behaviour | [deployment.md](deployment.md) |
| UI markup or styling | check it against [accessibility.md](accessibility.md) |
