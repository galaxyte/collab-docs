# Collab Docs

A lightweight collaborative document editor (Google Docs-inspired) built with
Next.js, Prisma/SQLite, and Tiptap. Built as a timeboxed take-home exercise —
see [`ARCHITECTURE.md`](./ARCHITECTURE.md) for what was prioritized and why,
and [`AI_USAGE.md`](./AI_USAGE.md) for how AI tools were used.

## Features

- **Create, rename, and edit documents** with rich text: bold, italic,
  underline, H1/H2, paragraphs, and bulleted/numbered lists (Tiptap).
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
- **Persistence** — SQLite via Prisma. Documents, titles, formatting (stored
  as sanitized-on-render HTML), and share grants all survive a refresh or
  server restart.
- **Mocked auth** — no passwords. Pick one of three seeded users on the login
  screen; a signed cookie-free session cookie (just a user id) tracks who
  you're acting as. This is intentionally not production auth — see
  Limitations.

## Tech stack

- **Next.js 16** (App Router, TypeScript) — Server Components fetch data
  directly from Prisma; Route Handlers (`/api/documents/**`) handle
  client-triggered mutations (create, autosave, share, upload, delete).
- **Prisma + SQLite** for persistence (`prisma/schema.prisma`).
- **Tiptap / ProseMirror** for the rich text editor.
- **Zod** for request validation on every API route.
- **Tailwind CSS v4** for styling.
- **Vitest** for unit tests.

## Getting started

Requires Node 18+.

```bash
npm install                # also runs `prisma generate` via postinstall
cp .env.example .env       # DATABASE_URL="file:./dev.db"
npm run db:migrate         # creates prisma/dev.db and applies the schema
npm run db:seed            # seeds 3 demo users + 1 sample shared document
npm run dev                # http://localhost:3000
```

You'll land on `/login` — pick any seeded user (Ava, Ben, or Cara) to
continue. Ava owns a "Welcome to Collab Docs" document already shared with
Ben (edit access), so you can see owned vs. shared documents immediately.
To try sharing yourself, share a document with `ben@example.com` or
`cara@example.com` from the Share dialog.

### Tests

```bash
npm test
```

Covers the permission-resolution logic (`getRole`/`canEdit`/`canView`/
`canManageSharing`/`canDelete`) and the file-import conversion (`.txt`/`.md`
→ HTML, extension detection, filename → title). Both are pure functions
tested without a database, since they're where the sharing model's
correctness actually lives.

### Production build

```bash
npm run build
npm start
```

## Deployment

SQLite's single-file database doesn't survive on platforms with ephemeral or
read-only filesystems (e.g. Vercel serverless functions), so pick one of:

**Option A — Railway / Render / Fly.io (recommended, minimal changes)**
These run a persistent container/VM, so SQLite works as-is:
1. Push this repo to GitHub.
2. Create a new app from the repo (Railway: "Deploy from GitHub repo").
3. Attach a persistent volume mounted so `prisma/dev.db` lives on it (e.g.
   set `DATABASE_URL=file:/data/prod.db` and mount the volume at `/data`).
4. Set the build command to `npm install && npm run build` and the start
   command to `npm run db:migrate:deploy && npm start` (see script below).
5. Set `DATABASE_URL` as an environment variable.

**Option B — Vercel + hosted Postgres (Neon/Supabase free tier)**
1. Change `provider = "sqlite"` to `provider = "postgresql"` in
   `prisma/schema.prisma` (SQLite has no native enum/concurrent-write support
   anyway, so Postgres is the better fit for a real deployment).
2. Set `DATABASE_URL` to the Postgres connection string in Vercel's project
   env vars.
3. Run `npx prisma migrate deploy` once against that database (locally, with
   `DATABASE_URL` pointed at it) to create the schema, then `npm run db:seed`
   if you want the demo users.
4. Deploy with `vercel` (or connect the GitHub repo in the Vercel dashboard).

Add a `db:migrate:deploy` script (`prisma migrate deploy`) if your platform's
start step should apply pending migrations before booting.

## Limitations (by design, given the timebox)

- **Auth is mocked.** No passwords, no real sessions — a cookie just holds a
  seeded user id. Fine for demonstrating the sharing model; not for
  production. Real auth would slot in behind `src/lib/session.ts` without
  touching the permission logic.
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
