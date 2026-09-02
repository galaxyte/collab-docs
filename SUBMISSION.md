# Submission

**Live app**: https://collab-docs-wheat.vercel.app
**Repo**: https://github.com/galaxyte/collab-docs (private)

Demo accounts (shown on the login screen too):

| Email | Password |
|---|---|
| ava@example.com | ava123 |
| ben@example.com | ben123 |
| cara@example.com | cara123 |

Ava owns a seeded document already shared with Ben (edit access), so
owned-vs-shared is visible immediately on first login.

## Documentation included

- [`README.md`](./README.md) — features, tech stack, setup/run instructions,
  validation & error handling, deployment (what was actually done), and
  known limitations.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — what was prioritized and why,
  what was explicitly not built, and the data model.
- [`AI_USAGE.md`](./AI_USAGE.md) — which AI tools were used, where they
  materially sped things up, what AI-generated output was changed or
  rejected, and how correctness/UX/reliability were verified.
- This file — a flat inventory of everything shipped.

## Core requirements

**1. Document creation and editing**
- Create, rename, edit, autosave (~700ms debounce), reopen after refresh.
- Rich text via Tiptap: bold, italic, underline, a text-style dropdown
  (Normal / Heading 1 / Heading 2), a font-size field (presets + custom
  value), bulleted/numbered lists with format variants (disc/circle/square;
  decimal/alpha/roman).

**2. File upload**
- Upload `.txt` or `.md` (max 2MB) → becomes a new editable document.
  Markdown is parsed into real headings/lists/formatting; plain text is
  wrapped into paragraphs. Limited to these two types, stated in the UI and
  README.

**3. Sharing**
- Document owner, `Share` model (documentId + userId + permission), share
  by email with View or Edit access.
- Dashboard visually separates "My documents" from "Shared with me."
- Permission enforced server-side on every mutating route (not just hidden
  in the UI) — see `src/lib/permissions.ts` and `ARCHITECTURE.md`.

**4. Persistence**
- PostgreSQL via Prisma (started on SQLite for local dev, moved to Postgres
  end-to-end once Vercel was the deploy target — see `ARCHITECTURE.md`).
- Documents, formatting, and share grants all survive a refresh or restart.

**5. Product & engineering quality**
- Setup/run instructions in `README.md`, verified via a clean-clone
  install → migrate → seed → test → build → lint pass.
- Live deployment: https://collab-docs-wheat.vercel.app.
- Validation (Zod on every API route) and error handling (401/403/404/400
  with specific messages, client-side try/catch with inline errors) —
  see README's "Validation & error handling" section.
- 24 automated tests, `npm test` — see below.
- Architecture note: `ARCHITECTURE.md`.

## Tests (24, `npm test`)

- `src/test/permissions.test.ts` — role resolution and derived capability
  checks (owner/editor/viewer/none).
- `src/test/fileImport.test.ts` — `.txt`/`.md` → HTML conversion,
  extension detection, filename → title.
- `src/test/sanitizeContent.test.ts` — the server-side HTML sanitizer:
  allowed tags/styles pass through, `<script>`/`onerror`/`onclick` and
  unknown style values are stripped.
- `src/test/credentials.test.ts` — the login gate: correct pair passes,
  case-insensitive email / case-sensitive password, wrong password and
  unknown email both rejected.

## Beyond the minimum

- Reactive toolbar highlighting (bold/italic/underline update immediately,
  fixing a Tiptap v3 default-behavior change).
- Document delete (owner only), with inline confirm.
- Colored per-user avatars, color-coded owner/share badges, a full visual
  redesign (Inter font, indigo/violet palette) beyond default styling.
- Server-side sanitization hardened alongside every new formatting feature
  (font-size, list styles) so the allowlist never fell behind what the
  editor could actually produce.

## Known limitations (by design — see README for the full rationale)

- Auth is mocked: three hardcoded demo credentials, not hashed
  passwords in a database.
- No real-time multiplayer (autosave, last-write-wins).
- No `.docx` import, no document version history, no granular permissions
  beyond View/Edit.
- Schema is synced with `prisma db push` rather than tracked migrations
  (most free managed Postgres tiers don't grant the `CREATE DATABASE`
  permission `migrate dev`'s shadow database needs).

## Walkthrough video

Script prepared separately (see chat history / hand-off notes) covering:
main user flow, what works end to end, what was deprioritized, key
implementation decisions, and how AI supported the workflow.
