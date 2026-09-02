# Collab Docs

A lightweight collaborative document editor (Google Docs-inspired) built with
Next.js, Prisma/PostgreSQL, and Tiptap. Built as a timeboxed take-home
exercise — see [`ARCHITECTURE.md`](./ARCHITECTURE.md) for what was
prioritized and why, and [`AI_USAGE.md`](./AI_USAGE.md) for how AI tools
were used.

**Live demo: https://collab-docs-wheat.vercel.app** — sign in with any of
the three demo accounts (shown on the login screen): `ava@example.com` /
`ava123`, `ben@example.com` / `ben123`, `cara@example.com` / `cara123`.

## Features

- **Create, rename, and edit documents** with rich text (Tiptap): bold,
  italic, underline, a text-style dropdown (Normal / Heading 1 / Heading 2),
  a font-size field (presets or type any custom px value), and bulleted /
  numbered lists — each with format variants (disc/circle/square bullets;
  decimal/alpha/roman numbering), like Google Docs' list menus.
- **Autosave** — content and title save automatically ~700ms after you stop
  typing; a status indicator shows Saving… / Saved / error state.
- **File import** — upload a `.txt` or `.md` file (max 2MB) and it becomes a
  new editable document. Markdown is parsed into headings/formatting/lists;
  plain text is wrapped into paragraphs. *No other file types are supported
  in this build* (see Limitations).
- **Sharing** — a document owner can share with another seeded user by email,
  granting "Can view" or "Can edit" access. The dashboard visually separates
  **My documents** from **Shared with me**, and the editor shows a "View
  only" badge plus a disabled toolbar for viewers.
- **Persistence** — PostgreSQL via Prisma. Documents, titles, formatting
  (stored as sanitized HTML), and share grants all survive a refresh or
  server restart.
- **Mocked auth** — a real login form (email + password) gates access, but
  the three accounts and their passwords are hardcoded in
  `src/lib/credentials.ts` rather than backed by a users table with hashed
  passwords. A correct email/password pair sets a session cookie holding
  that user's id; anything else is rejected with no cookie set. This is
  intentionally not production auth — see Limitations.

## Validation & error handling

- **Every API route validates its input with Zod** before touching the
  database (`src/lib/validation.ts`) — empty/oversized titles, malformed
  emails, invalid permission values, and unparseable JSON bodies all return
  `400` with a specific message instead of a stack trace or a silent no-op.
- **Every mutating route re-checks permissions server-side** (see
  `ARCHITECTURE.md`), returning `401` (not signed in), `403` (signed in but
  not allowed — e.g. a `VIEW`-only user hitting `PATCH`, or a non-owner
  hitting the share/delete endpoints), or `404` (document doesn't exist, or
  the user has no relationship to it — deliberately not distinguished from
  "doesn't exist" so you can't probe for the existence of documents you
  can't see).
- **File upload validation**: rejects empty files, files over 2MB, and any
  extension other than `.txt`/`.md`, each with a distinct error message
  (`src/app/api/documents/upload/route.ts`).
- **Every write to document content is sanitized server-side**
  (`src/lib/sanitizeContent.ts`) against an allowlist of tags/attributes/
  style values — not just relied on as "the editor wouldn't send that." See
  `AI_USAGE.md` for how this was found (a direct `curl` test, not the UI).
- **Client-side**: every fetch call (create, autosave, share, upload,
  delete, login) is wrapped in try/catch with the resulting error rendered
  inline near the control that triggered it, rather than failing silently
  or crashing the page.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — Server Components fetch data
  directly from Prisma; Route Handlers (`/api/documents/**`) handle
  client-triggered mutations (create, autosave, share, upload, delete).
- **Prisma + PostgreSQL** for persistence (`prisma/schema.prisma`).
- **Tiptap / ProseMirror** for the rich text editor.
- **Zod** for request validation on every API route.
- **Tailwind CSS v4** for styling.
- **Vitest** for unit tests.

## Getting started

Requires Node 18+ and a Postgres database (any free tier works — Neon,
Supabase, Vercel's own Postgres storage, or a local Postgres install).

```bash
npm install                     # also runs `prisma generate` via postinstall
cp .env.example .env            # then paste your DATABASE_URL into .env
npm run db:push                 # creates the schema on that database
npm run db:seed                 # seeds 3 demo users + 1 sample shared document
npm run dev                     # http://localhost:3000
```

You'll land on `/login`, which lists the three demo accounts and their
passwords right on the page — sign in as any of them
(`ava@example.com` / `ava123`, `ben@example.com` / `ben123`,
`cara@example.com` / `cara123`) to continue. Ava owns a
"Welcome to Collab Docs" document already shared with Ben (edit access),
so you can see owned vs. shared documents immediately. To try sharing
yourself, share a document with `ben@example.com` or
`cara@example.com` from the Share dialog.

`db:push` is used instead of Prisma's migration workflow because most free
managed Postgres tiers (including the one this project deploys to) don't
grant the `CREATE DATABASE` permission `prisma migrate dev` needs for its
shadow database — `db push` syncs the schema directly and doesn't need it.
Fine for a project this size with one contributor; a team project with a
long-lived production database would want real migration history instead.

### Tests

```bash
npm test
```

24 tests across four suites, all pure functions tested without a database:
- `permissions.test.ts` — role resolution (`getRole`/`canEdit`/`canView`/
  `canManageSharing`/`canDelete`), the sharing model's actual correctness.
- `fileImport.test.ts` — `.txt`/`.md` → HTML conversion, extension
  detection, filename → title.
- `sanitizeContent.test.ts` — the server-side HTML sanitizer: allowed tags
  pass through unchanged, `<script>`/`onerror`/`onclick` are stripped, and
  the font-size/list-style `style` values are constrained to their exact
  known sets (nothing else gets through).
- `credentials.test.ts` — the login gate: correct email/password passes,
  case-insensitive email but case-sensitive password, wrong password for a
  known email fails, and an unknown email fails.

### Production build

```bash
npm run build
npm start
```

## Deployment

**Live**: https://collab-docs-wheat.vercel.app, deployed on Vercel with
Vercel's native Postgres storage (Storage tab → Create Database → Postgres,
which provisions a managed instance and injects `DATABASE_URL` into the
project automatically). Steps taken:
1. `vercel link` to create the project, `vercel deploy --prod` to build/ship.
2. Created the Postgres database from the project's Storage tab in the
   Vercel dashboard (the one manual step — provisioning storage isn't
   exposed non-interactively in the CLI, and it's a permission grant that
   has to come from the account owner).
3. `vercel env pull` to get the generated `DATABASE_URL`, then
   `prisma db push` + the seed script against it (see *why `db push`* in
   Getting Started above).
4. Redeployed so the build picks up the Postgres-backed schema.

Note this repo was originally built against SQLite for zero-setup local
dev, then switched to Postgres end-to-end (local `.env` included) once the
deploy target was decided — see `ARCHITECTURE.md` for that tradeoff.

**Alternative — Railway / Render / Fly.io**: these run a persistent
container/VM rather than ephemeral serverless functions, so if you'd rather
not depend on a managed Postgres tier you can point `DATABASE_URL` at a
Postgres instance attached the same way (most of these platforms offer a
one-click Postgres add-on) and deploy from the GitHub repo directly — no
code changes needed since the schema is already `postgresql`.

## Limitations (by design, given the timebox)

- **Auth is mocked.** There's a real login form and it does gate access on a
  correct email/password pair, but the three credentials are hardcoded in
  `src/lib/credentials.ts` — no password hashing, no user-managed passwords,
  no rate limiting on login attempts. A correct match just sets a cookie
  holding that user's id (`src/lib/session.ts`). Fine for demonstrating the
  sharing model; not for production. Real auth (hashed passwords in the
  User table, or an auth provider) would slot in behind
  `checkCredentials()`/`loginAs()` without touching the permission logic
  downstream.
- **File import supports `.txt` and `.md` only** (stated in the UI and here,
  as the assignment allows). No `.docx` parsing — that needs a real parser
  (e.g. mammoth.js) and was cut for time.
- **No real-time multiplayer.** Autosave means two people editing the same
  document concurrently will overwrite each other's last save (last write
  wins) rather than merging via CRDT/OT. Real-time collaboration was
  explicitly out of scope per the assignment's "lightweight" framing — see
  `ARCHITECTURE.md`.
- **No document versioning/history**, no rich attachments, no folders — kept
  the model to Document + Share to stay inside the timebox.
