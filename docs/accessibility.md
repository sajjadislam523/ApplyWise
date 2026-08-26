# Accessibility and UI standards

The bar this project's interface is held to, what currently meets it, and what
does not yet.

**Source:** `frontend/src/components/`, `frontend/src/app/`

---

## The standard

Applywise measures its UI against the
[Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines).
When adding or changing UI, check the work against them — the rules that come up
most often here are:

- Icon-only buttons need an `aria-label`; decorative icons need `aria-hidden="true"`.
- Every form control needs a `<label>` or an `aria-label`, and inputs need
  `autocomplete` and a correct `type`.
- Interactive elements need a visible `focus-visible` ring — never `outline-none`
  without a replacement.
- Never `transition: all`; list the properties.
- Dialogs need `role="dialog"`, `aria-modal`, and `aria-labelledby`.
- Honour `prefers-reduced-motion`.
- URL should reflect state — filters, pagination, tabs.

## Current baseline

Met across the app:

- `color-scheme: dark` is set on `<html>`, so native scrollbars, `<select>`
  dropdowns, and date pickers render dark. Without it the date picker glyph in
  the job form is a dark icon on a dark field — effectively invisible.
- All icon-only controls carry `aria-label`; the hamburger also exposes
  `aria-expanded` and `aria-controls`.
- Both modals declare `role="dialog"`, `aria-modal`, and `aria-labelledby`, close
  on Escape, and lock body scroll.
- Auth fields declare `autoComplete`, so password managers can fill and save.
- Focus styling uses `focus-visible:` throughout, so rings appear for keyboard
  users without firing on mouse clicks.
- Form control ids come from `useId()`, not from label text — two fields sharing
  a label no longer collide and silently break `htmlFor`.
- No `transition: all` remains; every transition names its properties.
- The job results count is announced via `aria-live="polite"`.
- Text is truncated with `min-w-0` + `truncate` where it can overflow, and every
  chart has an empty state.

## Outstanding

Known gaps, roughly in priority order. None are started.

### URL does not reflect state

Filters live in Redux and pagination in local component state; neither reaches
the URL. A filtered view cannot be shared or bookmarked, and the back button does
not undo a filter change. Fixing this means moving `filterSlice` state into query
params — `nuqs` is the usual tool — and reading `page` from the URL in
`frontend/src/app/(dashboard)/jobs/page.tsx`.

### No `prefers-reduced-motion` handling

There is none anywhere in the codebase, and six infinite animations are defined
in `frontend/src/app/globals.css` (`shimmer`, three orb drifts, `grid-fade`) plus
`animate-pulse` skeletons and `animate-spin` loaders. The guidelines require
decorative loops to stop under reduced motion. `scroll-behavior: smooth` on
`<html>` should be guarded at the same time.

### No inline form validation in JobForm

`Input` accepts an `error` prop and renders it with the right `aria-invalid` /
`aria-describedby` wiring. The reset-password form uses it for both the length
and confirmation checks, but `JobForm` still never passes it — every failure
there surfaces as a single API-level banner instead. Wire per-field errors
through the existing prop and focus the first invalid field on submit.

### No unsaved-changes guard

Pressing Escape or clicking the backdrop discards a filled-in job form with no
warning.

### Tag list is uncapped

`JobCard` renders every tag. A job with thirty tags distorts the card. Cap the
visible count with a "+N more" affordance.

### Dates are formatted with a hardcoded pattern

`JobCard` uses `dayjs().format('MMM D, YYYY')` rather than `Intl.DateTimeFormat`.
Worth fixing for locale correctness, but carefully: a naive switch reads the
viewer's locale on the client and the server's during SSR, reintroducing exactly
the kind of hydration mismatch that the dashboard greeting was fixed for.

### Small tap targets

The tag-remove control and modal close buttons have been padded, but several
remain below the recommended 44px.

### No skip link

There is no skip-to-content link in the dashboard layout.
