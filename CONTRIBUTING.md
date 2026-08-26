# Contributing

Thanks for working on Applywise. This covers workflow and what "done" means.

For getting the project running, see [docs/development.md](docs/development.md).

---

## Workflow

Work happens on `development` and merges to `main` via pull request.

```bash
git checkout -b feat/your-feature-name
# make your changes
git commit -m "feat: add bulk delete"
git push origin feat/your-feature-name
```

### Commit messages

Conventional prefixes:

| Prefix | For |
| --- | --- |
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation only |
| `refactor:` | A code change that is neither a feature nor a fix |
| `style:` | Formatting, no logic change |
| `chore:` | Build process, dependencies, tooling |

Write what changed for a reader, not for yourself later today. `fix: reset
pagination when filters change` is useful; `fix: bug` is not.

## Definition of done

Before opening a pull request:

- [ ] `cd frontend && npx tsc --noEmit` passes
- [ ] `cd frontend && npm run build` passes — the type checker alone misses
      Next-specific errors like a bad `viewport` export or a prerender failure
- [ ] `cd backend && npm run build` passes
- [ ] The API still answers `curl http://localhost:5000/health`
- [ ] New UI checked against [docs/accessibility.md](docs/accessibility.md)
- [ ] Documentation updated per the routing table below
- [ ] `CHANGELOG.md` updated under `[Unreleased]` if a user would notice the change

There is **no test suite and no `lint` script** — `eslint-config-next` is a
dependency but no ESLint config file exists. Until that changes the compiler and
a manual request are the whole safety net, which is why the build steps above are
not optional.

## Where documentation goes

Every change that alters behaviour has a home in the docs. This table is the
contract; it also appears in [docs/README.md](docs/README.md) and
[CLAUDE.md](CLAUDE.md).

| You changed | Update |
| --- | --- |
| Anything a user would notice | [`CHANGELOG.md`](CHANGELOG.md), under `[Unreleased]` |
| An endpoint, parameter, or response | [docs/api-reference.md](docs/api-reference.md) |
| A schema field, index, or hook | [docs/data-model.md](docs/data-model.md) |
| Environment variables | the relevant `.env.example` |
| A convention spanning several files | [docs/architecture.md](docs/architecture.md) and [CLAUDE.md](CLAUDE.md) |
| A user-facing feature | [docs/features.md](docs/features.md) and the README feature list |
| Deployment, CORS, or cron behaviour | [docs/deployment.md](docs/deployment.md) |
| UI markup or styling | check against [docs/accessibility.md](docs/accessibility.md) |

Two rules keep those documents from drifting the way the old single-file README
did:

1. **One fact, one home.** Do not restate a fact that already lives somewhere —
   link to it. Version numbers belong in `package.json` and nowhere else;
   environment variables belong in the `.env.example` files and nowhere else.
2. **Every document names its sources.** Each file opens with a `Source:` line
   listing the code it describes. If you add a document, add the line; if you
   change code, check the documents that name it.

## Code conventions

- The frontend compiles with `strict: true`. New frontend code must be fully
  typed — no `any` to get past the compiler.
- Frontend imports use the `@/*` alias for `src/*`.
- Backend controllers scope every query to `req.user!.id`, wrap async handlers in
  `asyncHandler`, and respond through `sendSuccess` / `sendError`. See
  [docs/architecture.md](docs/architecture.md#backend-conventions).
- Server data never goes into Redux. See
  [docs/architecture.md](docs/architecture.md#frontend-the-state-split).
- Styling is Tailwind v4, configured in CSS. Add tokens and utilities to the
  `@theme` and `@utility` blocks in `frontend/src/app/globals.css` — there is no
  `tailwind.config.ts`.
