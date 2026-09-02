# Architecture note

## What I prioritized, and why

The brief asks for five things — creation/editing, upload, sharing,
persistence, and engineering quality — inside a 4-6 hour box. I treated
**sharing and its permission model as the centerpiece**, because it's the one
requirement that's actually hard to get subtly wrong (owner vs. editor vs.
viewer, and enforcing it server-side rather than just hiding UI) and it's
what separates "an editor" from "a *collaborative* editor." Everything else
was built to be just good enough to demonstrate the flow end to end without
gold-plating any single piece.

Concretely, that meant:

- **A pure, unit-testable permission resolver** (`src/lib/permissions.ts`):
  `getRole(doc, shares, userId)` → `OWNER | EDIT | VIEW | NONE`, with
  `canEdit`/`canView`/`canManageSharing`/`canDelete` derived from it. It has
  zero dependency on Prisma, Next, or HTTP — it's tested directly (see
  `src/test/permissions.test.ts`) and then reused identically in every API
  route and in the editor page's server component, so there's exactly one
  place the access-control logic can be wrong. Every mutating route
  (`PATCH`/`DELETE` on a document, `POST`/`DELETE` on shares) re-checks this
  server-side; the client never gets to decide whether it's allowed to edit.
- **Server Components for reads, Route Handlers for writes.** The dashboard
  and editor pages query Prisma directly during render — no client-side
  fetch-on-mount waterfall, no loading spinners for the first paint. Client
  components (the editor, share dialog, upload/create buttons) call small
  REST-ish JSON endpoints under `/api/documents/**` for anything that
  mutates state, each independently validated with Zod. This is a
  conventional split for the App Router and keeps the two concerns (what am
  I allowed to see vs. what am I allowed to change) in different, individually
  testable places.
- **Autosave over explicit save, no real-time collaboration.** True
  multi-cursor concurrent editing needs CRDTs/OT and a sync transport
  (Yjs + a websocket/webrtc provider is the usual answer) — that's a
  multi-day project on its own, not a feature I could responsibly half-build
  in this window. Autosave (debounced PATCH, last-write-wins) gets you 90% of
  the *product* feel of Google Docs — you never think about saving — without
  the concurrency-control project. The README calls this out explicitly as a
  known limitation rather than pretending it's real-time.
- **Started on SQLite, moved to Postgres once the deploy target was fixed.**
  SQLite was the fastest way to get a working app during development —
  zero setup, no external account, and Prisma made the eventual provider
  swap a one-line schema change plus a re-push of the schema. Once Vercel
  was chosen as the deploy target (serverless functions, ephemeral
  filesystem — SQLite doesn't survive that), the project moved fully to a
  managed Postgres instance for both local dev and production, rather than
  keeping SQLite as a separate local-only path that would drift from what's
  actually deployed. The one real cost of that move: `prisma migrate dev`
  needs `CREATE DATABASE` for its shadow database, which most free managed
  Postgres tiers don't grant, so schema changes go through `prisma db push`
  instead of tracked migration files — acceptable for a single-contributor
  project this size, a real gap for anything longer-lived (see Getting
  Started in the README).
- **Mocked auth, deliberately shallow.** The assignment explicitly allows
  seeded/mocked accounts, and real auth (password hashing, session tokens,
  email verification) doesn't teach a reviewer anything about *this*
  exercise — it would just consume hours better spent on the sharing model
  and editor UX. The cookie-based mock session lives entirely behind
  `getCurrentUser()`/`requireUser()` in `src/lib/session.ts`, so swapping in
  real auth later is a localized change, not a rewrite.

## What I explicitly did not build

- Document version history / revision diffing.
- Real-time multi-user cursors or live co-editing.
- `.docx` import (would need a real parser like mammoth.js — `.txt`/`.md`
  cover the "upload → editable document" requirement without it).
- Granular permission levels beyond view/edit (e.g. comment-only), folders,
  or org-level access control.
- Rate limiting / abuse protection on the API routes — reasonable for an
  internal tool demo, not for a public deployment.

## Data model

```
User(id, name, email)
Document(id, title, content: html, ownerId → User, createdAt, updatedAt)
Share(id, documentId → Document, userId → User, permission: "VIEW" | "EDIT")
```

`permission` is a plain string rather than a native Postgres enum — a small
deliberate simplicity tradeoff, kept from when the project started on
SQLite (which has no enum type). It's constrained to `"VIEW" | "EDIT"` at
the Zod/TypeScript layer instead (`src/lib/validation.ts`,
`src/lib/permissions.ts`), which was true either way and is enough for two
values that aren't expected to grow. Document
content is stored as HTML — simple to persist and re-render — but since the
`PATCH /api/documents/[id]` route accepts that HTML directly from the
client, it can't be trusted as "definitely came from Tiptap." Both write
paths (autosave and file import) run content through
`sanitizeDocumentContent()` (`src/lib/sanitizeContent.ts`, backed by
`sanitize-html`) before it touches the database, allowlisting only the tags
the editor's schema actually uses (`p`, `h1-h3`, `strong`, `em`, `u`, `ul`,
`ol`, `li`, `br`, `span`) with no attributes anywhere except a `style` on
`span`/`ul`/`ol` — and even that is restricted per-property to a fixed set
of known values (a numeric `font-size`, or one of the six supported
`list-style-type`s), never an arbitrary string. This also rules out
`onerror`/`onclick`-style handlers and `javascript:` URLs. Every time a
formatting feature added a new inline style (font size, then bullet/number
variants), the sanitizer's allowlist had to grow with it in the same
change — see `src/test/sanitizeContent.test.ts` for both the "known value
passes through" and "unknown value is stripped" cases.
