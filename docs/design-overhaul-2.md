# AmpTrail — Ultimate Design Overhaul 2.0

**Branch:** `arena/2d330f6e-amptrail` (branched from `main` at PR #5, `4aba9f9`)
**Scope:** design/UX/accessibility overhaul of the existing Next.js + Supabase app. No backend architecture, schema, auth-flow, or ticket-numbering changes.

---

## 1. Design audit (what was wrong before)

The audit was done by reading every route, capturing the pre-existing build at commit `4aba9f9`, and scanning it with axe-core.

| # | Finding | Evidence | Impact |
|---|---|---|---|
| A1 | **Two competing visual languages.** PR #5 established the electric-blue/slate identity, but much of the app still used raw `slate-*`/`blue-*` utilities, `font-black` headings, and `bg-slate-50` page shells next to the new token layer. | `app/contact`, `app/privacy`, `app/terms`, `app/not-found`, `app/workspace-setup` | Looked like two different products stitched together |
| A2 | **Contrast failures on every route.** `--color-subtle` (#6b7a8d) measured 4.38:1 and `--color-faint` (#94a3b8) 2.56:1 on white; axe flagged 3–31 nodes per page. | axe-core WCAG 2.1/2.2 AA run | WCAG 2.2 AA failure (1.4.3) |
| A3 | **Unlayered CSS beat Tailwind utilities.** `* { min-width: 0 }` and `a { color: inherit }` sat outside `@layer`, so `min-w-max` and `text-white` were silently overridden. | `app/globals.css`; measured `color: rgb(11,18,32)` on a `bg-brand-600 text-white` button (3.62:1) | Broken primary buttons + unusable tab strips |
| A4 | **Dead/legacy component surface.** `components/forms/confirm-action-form.tsx` (native `window.confirm`), `components/workspace/app-page.tsx`, `components/marketing/product-preview.tsx` (orphaned), legacy `quiet`/`dark` button variants, `.field-label`/`.field-hint` classes that no longer existed in the stylesheet. | repo grep | Inconsistent dialogs, dead code paths, broken class references |
| A5 | **Missing route-level states.** No `loading.tsx` or `error.tsx` anywhere; a slow Supabase query showed a blank screen, and a thrown error showed a raw Next.js error page. | `app/**` | Perceived as a hang or a crash |
| A6 | **Mobile data loss + overflow.** The dashboard ticket table scrolled horizontally, pushing the "Documented total" off-screen at 390px; the work-ticket list overflowed to 410px at 390px; the tab strip forced page-level overflow. | 390px measurement pass | Field users could not see the number that matters |
| A7 | **Hydration mismatch in the ticket editor.** Row keys came from a module-level counter, so server and client produced different `id`/`htmlFor` values (`...-row-1` vs `...-row-5`) — every label pointed at the wrong input. | React hydration error captured in the browser | Broken label/input pairing, a11y + correctness bug |
| A8 | **Invalid list markup.** Ticket detail nested `<dt>`/`<dd>` inside `<div>`s mixed with an icon wrapper, and put a `<p>` inside a `<dl>`. | axe `definition-list` / `dlitem` | Screen-reader navigation broken |
| A9 | **Marketing page relied on a static mock** rather than the real UI, and the marketing shell had no mobile menu focus handling (`aria-hidden` without removing focusables). | `components/marketing/product-preview.tsx` | "Fake screenshot" feel; keyboard trap near the sheet |
| A10 | **Legacy status colours duplicated.** The dashboard hard-coded its own status bar palette while `lib/tickets/status.ts` owned the canonical map. | `app/(workspace)/dashboard/page.tsx` | Drift risk between badge and chart colours |

---

## 2. What changed

### 2.1 Foundation (`app/globals.css`, `components/ui/*`)
- **Token layer is now the only colour source.** Status dots, badges and dashboard charts all read from `lib/tickets/status.ts`; raw `slate-*`/`amber-*`/`emerald-*` swatches were removed from components.
- **All base element styling moved into `@layer base`**, so utility classes always win (fixes A3 at the root rather than per-callsite).
- **Contrast tokens raised:** `--color-subtle` `#6b7a8d → #5f6d81` (5.26:1), `--color-faint` `#94a3b8 → #63707f` (5.05:1) — measured against `#fff`, `#f8fafc`, `#f1f5f9`, `#f6f8fb`, and `#eff5ff`.
- **Reusable primitives** rebuilt/added: `Button`/`ButtonLink` (legacy `quiet`/`dark` variants removed), `Card`/`CardHeader`, `Field` (+ `Input`, `Textarea`, `Select`, `NumberInput`, `labelHidden`), `Alert` (4 tones, `title`, correct `role`), `EmptyState`, `PageHeader`, `StatCard`, `TableShell`/`Th`/`Td`/`Tr`, `Skeleton`/`StatSkeleton`/`TableSkeleton`, `ConfirmDialog` (native `<dialog>`, focus trapped, Escape, focus returned to the safe action), `TabBar`/`SegmentedLinks`, `Menu` (roving focus, Escape restores focus).
- **Motion + focus:** one global `:focus-visible` ring, `prefers-reduced-motion` neutralises animation/transition, `data-scroll-behavior="smooth"` added to `<html>`.

### 2.2 Marketing (`app/page.tsx`, `components/marketing/*`)
- Landing page rebuilt around the required headline **“Document the work. Protect the paper trail.”** with an explicit subhead, and every product visual rendered from the real component language (`components/marketing/previews.tsx`) — no screenshot images, no invented claims.
- Sections: cost-of-a-missing-record, 4-step workflow, product feature grid with tabbed previews, PDF-record section, field-vs-office roles, FAQ accordion with honest answers (including "AmpTrail is not a change-order approval service"), final CTA, footer with disclaimer.
- Marketing header sheet: Escape closes, body scroll locks, closed sheet is `inert`, focus never lands inside hidden content.

### 2.3 App shell (`components/workspace/workspace-shell.tsx`)
- Persistent sidebar (16.5rem) with a distinct **"New ticket"** primary action, breadcrumbs derived from the pathname, and a mobile top bar + bottom tab bar (Overview / Projects / Tickets / Evidence) with a 44px floating capture action.
- Account menu moved to a keyboard-accessible popover with sign-out; account trigger now fills the sidebar so long emails truncate instead of widening the layout.

### 2.4 Dashboard (`app/(workspace)/dashboard/page.tsx`)
- Command-centre layout: greeting, action-needed banner (review queue / unfinished drafts), four KPI cards (documented value with labor/materials/equipment split, open tickets, active projects, evidence photos), recent tickets table, ticket pipeline with legend, active projects, activity feed, and an always-visible tracking disclaimer.
- Below `md`, the recent-tickets table becomes a card list so the documented total is never off-screen (fixes A6).
- Status palette now imports `statusDotClass` / `ticketStatusOptions` (fixes A10).

### 2.5 Projects & work tickets
- Projects list: active/archived tabs with counts, search, cards with documented value + open ticket count, archive badge; project detail with ticket rollup; project form with dirty-state tracking, `beforeunload` guard and a styled confirm dialog on cancel (replaces `window.confirm`).
- **Work ticket editor (flagship):** section jump bar (`Work details · Labor · Materials · Equipment · Review & save`), sticky desktop review rail and mobile save bar, live per-line and grand totals, add/remove rows, journeyman/apprentice/foreman suggestions, 75-line cap surfaced, dirty-state + unload guard, server error focus management.
- **Work ticket detail:** record header with status, PDF/print actions, scope/labor/materials/equipment tables with subtotals, jobsite context, record history, and integrated photo evidence — markup corrected for `dl` semantics (fixes A8).
- New routes: `/tickets/[id]/edit` (creator-only), `/projects/[id]/edit` rebuilt, `/tickets/new` accepts `?projectId=`.

### 2.6 Evidence (private by design)
- `EvidencePanel` rebuilt: drag-and-drop or picker upload, caption/field note, upload → metadata save state machine, orphan-object cleanup if the metadata write fails, 1-hour signed URLs only (no public URLs), keyboard image viewer (Arrow/Escape, prev/next, open original), expired-link banner, delete behind a confirm dialog.
- New `/evidence` page: workspace-wide library with project/ticket capture picker, per-project grid, recent workspace photos and a privacy note explaining signed-URL expiry.

### 2.7 PDF work record (`lib/tickets/pdf.ts`)
- Premium business-document layout: dark identity band with vector brand mark (jsPDF cannot render emoji or custom logos without assets), project/scope block, itemised labor/materials/equipment tables with subtotals, documented-total band, evidence appendix, blank field-verification signature lines, and a footer on every page stating this is a tracking record — not an approval, change order, or invoice.

### 2.8 Auth, settings, supporting pages
- Auth frame/form/password-reset rebuilt (`?next=` preserved safely, field-level errors, password visibility toggle, honest error mapping); `/login`, `/signup`, `/forgot-password`, `/reset-password` re-skinned.
- `/settings`: profile + company form (single save, success/error states), account card, workspace access card, session card, legal links.
- New `/workspace-setup` with real recovery steps; `/contact`, `/privacy`, `/terms` rewritten onto a shared `LegalShell`; `not-found.tsx` re-skinned.
- **New route-level states:** `app/(workspace)/loading.tsx`, `error.tsx`, plus `loading.tsx` for dashboard, projects and tickets.

### 2.9 Functional bugs fixed while rebuilding
1. Editor hydration mismatch / mislabelled inputs (A7) — deterministic initial row keys, client counter for rows added later.
2. Horizontal overflow at 320–414px across dashboard, tickets, tab strips and evidence grid (A6).
3. `window.confirm` replaced by an accessible dialog on the project form; the dead `confirm-action-form.tsx` was deleted.
4. `<dl>` misuse on ticket detail (A8) and `aria-hidden` focus leak in the marketing sheet (A9).
5. Unlayered CSS overriding utilities (A3).

---

## 3. Refined components

| Component | Change |
|---|---|
| `components/ui/button.tsx` | Token-driven variants (primary/secondary/soft/ghost/danger/dangerSoft/inverse), `loading`, `iconOnly`, legacy variants deleted |
| `components/ui/field.tsx` | `Field` render-prop with `label`, `hint`, `error`, `optional`, `required`, `labelHidden`; `Input`/`Textarea`/`Select`/`NumberInput` |
| `components/ui/alert.tsx` | 4 tones, `title`, correct `role` per tone |
| `components/ui/confirm-dialog.tsx` | Native `<dialog>`, focus trap, Escape, safe-action focus, async confirm with inline error |
| `components/ui/menu.tsx` | Roving focus, Escape restores focus to trigger, outside-click close |
| `components/ui/tabs.tsx` | Route-based tabs with counts and an underline indicator (scrolls inside its own box) |
| `components/ui/table.tsx` | `TableShell` (scroll container) + `Th`/`Td`/`Tr` with `interactive` rows |
| `components/ui/stat.tsx`, `skeleton.tsx`, `empty-state.tsx`, `page-header.tsx`, `card.tsx`, `badge.tsx` | Shared KPI tile, loading placeholders, empty states, page header, card/header, badge tones |
| `components/workspace/workspace-shell.tsx` | Sidebar + mobile bottom nav + breadcrumbs + popover account menu |
| `components/workspace/status-badge.tsx` | Single source of truth via `ticketStatusMeta` |
| `components/workspace/data-notice.tsx`, `components/setup-notice.tsx` | Honest "Supabase not configured" states with remediation steps |
| `components/tickets/ticket-editor.tsx` | Flagship editor (see 2.5) |
| `components/evidence/evidence-panel.tsx`, `evidence-capture.tsx` | Upload state machine, keyboard viewer, expired-link handling, capture picker |
| `components/marketing/*` | `site-header`, `site-footer`, `previews`, `preview-tabs`, `faq-accordion`, `legal-shell` |
| `components/forms/*` | `project-form`, `settings-form`, `project-archive-button` (dirty-state + dialogs) |
| `components/auth/*` | `auth-frame`, `auth-form`, `password-reset-form` |

Deleted: `components/workspace/app-page.tsx`, `components/forms/confirm-action-form.tsx`, `components/marketing/product-preview.tsx`.

---

## 4. Verification

All commands run in `/home/user/amptrail` on the current branch.

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | clean |
| Lint | `npx eslint .` | clean |
| Unit tests | `npm test` (vitest) | **38 passed / 7 files** |
| Production build | `npm run build` | success, 22 routes, 12 prerendered |
| Accessibility | axe-core WCAG 2.0/2.1/2.2 A+AA over 8 public + 7 workspace + 4 mobile views | **0 violations** |
| Responsive | 320/360/390/430/768/1024/1280/1440/1920 × 9 app + 7 public routes | **no horizontal overflow** |
| Keyboard | Account menu (open/aria-expanded/Escape/focus return), skip link first tab stop, unsaved-changes guard, live totals | verified |
| Production perf | CDP network + paint timings against `next start` | home 314 KB wire / FCP 141 ms; login 129 KB / FCP 69 ms; dashboard 21 KB document / FCP 103 ms; ticket editor 29 KB / FCP 114 ms |
| PDF output | `qa/gen-record.mjs` → `qa/renderpdf.mjs` | 2-page record renders correctly (see `docs/screenshots/after-pdf-page-1.jpg`) |

### Screenshots (before → after)

| Screen | Before | After |
|---|---|---|
| Marketing home (full page) | `before-home-full.jpg` | `after-home-full.jpg` |
| Login | `before-login.jpg` | `after-login.jpg` |
| Dashboard | `before-dashboard.jpg` | `after-dashboard.jpg` |
| Ticket list | `before-tickets.jpg` | `after-tickets.jpg` |
| Ticket editor | `before-ticket-editor.jpg` | `after-ticket-editor.jpg` |

After-only views: `after-ticket-detail.jpg`, `after-evidence.jpg`, `after-settings.jpg`, `after-project-detail.jpg`, `after-project-new.jpg`, `after-contact.jpg`, `after-404.jpg`, `after-pdf-page-1.jpg`, `after-pdf-page-2.jpg`.
Mobile (390px): `after-mobile-dashboard.jpg`, `after-mobile-ticket-editor.jpg`, `after-mobile-evidence.jpg`.

> **How the screenshots were produced.** The sandbox has no live Supabase project, so a QA-only stub (`/home/user/qa/fake-supabase.mjs`, *not* part of the app) speaks the GoTrue/PostgREST/Storage wire protocol and serves invented sample records to a throwaway `.env.local`. Screenshots therefore show real app code rendering sample data — not mockups. The "before" set was captured from a git worktree pinned at `4aba9f9`.

---

## 5. Functional improvements

- Dashboard KPIs, pipeline and activity now derive from one query set with consistent totals.
- Tickets list: status tabs, project filter, search, per-ticket documented total, mobile card list.
- Ticket editor: live totals (verified `8h × $100 → $800.00`), remove-row, 75-line cap, dirty-state guard, focus jump to server errors.
- Evidence: upload → save → refresh state machine, orphan cleanup, keyboard viewer with prev/next, delete confirmation, expired-link handling.
- Project form: dirty tracking, unload guard, styled discard dialog.
- Settings: profile/company saved through `updateSettingsAction` with success/error feedback.
- New route-level loading, error and empty states across the workspace.
- PDF export/print preserved; ticket duplication and draft deletion preserved; creator-only editing enforced on `/tickets/[id]/edit`.

## 6. Accessibility improvements

- 0 axe violations across all audited views (was: contrast failures on every route, `definition-list`/`dlitem` on ticket detail, focusable content inside `aria-hidden` on the marketing sheet).
- Correct `dl` grouping for jobsite context/record history; `<caption>` on data tables; `scope="col"` headers; skip link; `aria-current` on navigation; `role="search"` on filter forms.
- Focus rings everywhere, reduced-motion support, `aria-live` status lines for pending/saved state, `role="alert"` on errors, accessible confirm dialogs.
- All interactive targets meet a 40–44px minimum height; text inputs stay ≥16px-equivalent to avoid mobile zoom on the ticket editor.

## 7. Performance improvements

- Fonts self-hosted (`@fontsource-variable/inter` + `next/font/local`) — no render-blocking third-party request; only one variable font file (120 KB) on the marketing route.
- Production measurements above; the dashboard ships a 21 KB HTML document because data is fetched on the server.
- Skeletons instead of spinners for route transitions, so layout does not jump while data resolves.
- Images are signed-URL `<img>` with `loading="lazy"` and fixed aspect ratios to avoid layout shift.

---

## 8. Completed vs planned

**Completed (this branch)**
- Phases 1–9 of the brief: audit, design foundation, marketing, app shell, dashboard/projects, tickets, evidence/PDF, auth/settings, responsive + interaction audit, and the testing pass in section 4.
- Every preservation requirement: login, signup, password reset, dashboard, project creation/archiving, ticket creation, labor/material/equipment calculations, PDF download/print, evidence upload/signed URLs, ticket editing, status changes, draft deletion, ticket duplication.
- Backend untouched: same schema, same `save_work_ticket` RPC, same RLS, same private bucket, same ticket numbering, no new runtime dependencies.

**Planned / not done**
- Live Supabase verification (real data, real uploads, PDF with real photos) — no project credentials in this environment; the stub covers rendering only.
- Vercel preview link — this session has no Vercel connection; the PR must be previewed after merge/deploy.
- Inviting teammates, multi-company switching and billing are out of scope for this release (stated in the UI rather than implied).

## 9. Remaining limitations

1. Screenshots use stub data; they prove rendering, layout, and state handling, not database behaviour.
2. `npm run build` in this sandbox produced no bundle-size report (Turbopack); wire measurements in section 4 come from `next start` + CDP.
3. The evidence viewer relies on `<img>` with signed URLs instead of `next/image` optimisation, because transformations cannot be applied to private objects without a signed URL; this is intentional.
4. `Not verified in a real workspace:` evidence upload against a live bucket, PDF embedding real photos, and auth callbacks against a live GoTrue instance.

---

## 10. Links

- **Branch:** `arena/2d330f6e-amptrail`
- **Pull request:** [#6 — Design Overhaul 2.0](https://github.com/lamansami7/amptrail/pull/6)
- **Vercel preview:** not available from this environment (no Vercel connection in the session).
