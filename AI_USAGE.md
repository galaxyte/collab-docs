# AI usage note

## Which AI tools I used

Claude Code (Sonnet) for effectively the entire build: scaffolding, schema
design, all application code, tests, and debugging, working in a normal
edit → run → inspect-output loop rather than one-shot generation.

## Where AI materially sped up the work

- **Boilerplate and repetitive CRUD.** Route Handlers for
  create/update/delete/share, the Tiptap toolbar, and the dashboard's two
  near-identical "owned" vs. "shared" card lists are the kind of code that's
  easy to write once you've decided the shape — AI writing the second and
  third instance of a pattern I'd already established (e.g. the
  validate-then-authorize-then-mutate shape shared by every route handler)
  saved real time over hand-typing each one.
- **Fast diagnosis of two real environment problems**, both caught by
  actually running things rather than assuming they'd work:
  - `prisma init` silently pulled Prisma **8.0.0-rc.12** (a release
    candidate tagged `latest` on npm) along with ~60 unrelated
    "agent skill" markdown files it scaffolds by default
    (`.agents/skills/`, `.claude/skills/`, etc.) — clutter no reviewer
    should see in a take-home submission. Diagnosed and downgraded to
    Prisma 5.22 (last stable v5) in a couple of commands.
  - The Prisma 5.22 CLI's `prisma init`/`migrate` command failed outright
    on Node 24 with `(0 , CSe.isError) is not a function` — traced to
    `util.isError`, deprecated since Node 4, apparently having been removed
    from Node 24's `util` module and the old Prisma CLI still calling it
    internally. Worked around by writing `schema.prisma`/`.env` by hand
    instead of relying on `prisma init`.
- **Test scaffolding.** Once the permission/sanitization/file-import
  functions existed, generating the Vitest cases (including the "should
  reject" edge cases: no user, wrong permission, unsupported extension,
  empty filename) was mechanical and fast.

## What I changed or rejected from the first pass

- **Rejected: trusting client-submitted HTML as safe.** The initial
  `PATCH /api/documents/[id]` implementation stored whatever `content`
  string the client sent, on the (false) assumption that it would only ever
  be Tiptap's own `getHTML()` output. It's a public JSON API — nothing stops
  a direct `curl` call (or a malicious editor-permission user) from sending
  `<script>`/`onerror=`/etc. directly. I caught this by testing the API with
  `curl` rather than only through the UI, and added
  `sanitizeDocumentContent()` (allowlist-based, via `sanitize-html`) on both
  write paths — see `ARCHITECTURE.md` and `src/test/sanitizeContent.test.ts`.
  This is the one finding in this build I'd call a real bug rather than a
  scope tradeoff.
- **Rejected: Tailwind's `prose` typography classes** for the editor content
  — used in a first draft without actually installing
  `@tailwindcss/typography`, so headings/lists would have rendered
  unstyled. Replaced with ~30 lines of explicit CSS scoped to `.ProseMirror`
  in `globals.css`, matching only the handful of block types the editor
  schema actually supports, instead of pulling in a plugin for it.
- **Simplified: dropped `next/font/google`** (Geist) from the default
  `create-next-app` template in favor of the system font stack, to avoid a
  network dependency on Google Fonts at build time for no visual benefit in
  an internal tool.
- **Rejected: mixing Server Actions and Route Handlers.** An early instinct
  was to use Next.js Server Actions for document mutations (less
  boilerplate) and Route Handlers for the editor's autosave. Standardized on
  Route Handlers everywhere a client component mutates state, and Server
  Actions only for the two places that are genuinely simple form-navigation
  flows (login, logout) — one consistent access-control checkpoint pattern
  end to end, rather than the access-control logic living in two different
  shapes of endpoint.

## How I verified correctness, UX, and reliability

- **Every route, by hand, over real HTTP.** No browser extension was
  available in this environment, so instead of trusting the code by
  inspection I drove the actual running dev/prod server with `curl`,
  attaching a `session_user_id` cookie to simulate each seeded user: created
  a document, patched its content, shared it as `VIEW` then confirmed the
  recipient gets `403` on `PATCH` and `200` on `GET`, confirmed a non-owner
  gets `403` on share/delete, uploaded a real `.md` file and inspected the
  parsed HTML, uploaded a `.pdf` and confirmed the `400` rejection, and
  confirmed unauthenticated requests get `401`/redirect-to-login rather than
  data.
  Ran this against **both** `npm run dev` and a real `npm run build && npm
  start` production build, not just dev mode.
- **Server-side rendering, inspected directly.** For the two pages that are
  Server Components (`/`, `/doc/[id]`), fetched the raw SSR HTML/RSC payload
  as each seeded user and confirmed the right role (`OWNER`/`EDIT`/`VIEW`)
  and the right props (e.g. `canManageSharing: true` only for the owner)
  were actually being passed to the client component, and grepped for error
  boundary markers to catch silent render failures.
- **The type checker, linter, and full production build as gates**, not
  just the dev server — `npm run build` runs `tsc` and fails the build on
  type errors; `npx eslint .` came back clean.
- **Automated tests** for the three pieces of pure logic where a subtle bug
  would be easy to ship and hard to notice by eye: role resolution
  (`src/test/permissions.test.ts`), file-import HTML conversion
  (`src/test/fileImport.test.ts`), and content sanitization
  (`src/test/sanitizeContent.test.ts`) — 18 tests total, run via `npm test`.
- **What I could *not* verify in this environment**: pixel-level UI/UX
  polish and actual mouse/keyboard interaction with the Tiptap editor,
  since the browser automation tool wasn't connected here. The editor uses
  standard, well-documented Tiptap/StarterKit APIs, and the surrounding page
  renders correctly server-side with no errors, but click-through UI testing
  (does the toolbar feel right, does autosave's debounce feel responsive)
  is the one verification step I'd flag as still needing a human pass before
  calling this done — see "Before you rely on this" below.

## Before you rely on this

Click through the actual UI yourself once — create a doc, format some text,
upload a `.md` file, share it with a second seeded user in another
browser/incognito tab, and confirm the "View only" experience feels right.
Everything above was verified at the API/SSR level, not by watching the
editor render in a real browser window.
