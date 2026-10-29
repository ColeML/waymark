# Waymark Coding Standards

How code is written here. Copied from Provender's and tailored to this stack: Next.js (App
Router), React 19 (React Compiler), TypeScript, Tailwind CSS 4 + shadcn/Base UI, Drizzle, Server
Actions, oxlint/oxfmt, Vitest.

Prefer these principles over memorized habits from other projects — when in doubt, match what the
codebase already does.

## Core principles

- **AHA — Avoid Hasty Abstraction.** Prefer duplication over the wrong abstraction. Extract shared
  code once a pattern has proven itself, not before.
- **Readability over cleverness.** Favor explicit-but-verbose over concise-but-implicit.
- **Minimum code that solves the problem.** No speculative features, configurability, or error
  handling for impossible scenarios.
- **Consistency.** All code should look like a single person typed it.

## The architecture rule

**`server/services/*` is the only place logic lives.** Server Components and Server Actions parse
input, call a service, and shape the result. They decide nothing.

Services take their database handle as a parameter defaulting to the shared client, so a test can
pass a PGlite database without mocking the module graph.

**Every exported service function takes `garageId` as its first parameter.** All data is scoped to
a garage, and the failure that matters is a forgotten filter: a query missing
`where garage_id = ?` returns every garage's rows and looks normal in review. Requiring the
parameter moves that mistake to compile time.

A garage is never named in a URL. It is resolved from the session by `garageForSession`.

## TypeScript

- Use `interface` for component props (named `Props`); `type` for everything else.
- No `any`. Let inference do the work; add explicit types at boundaries (API shapes, exported
  functions).
- Resolve "possibly undefined" by narrowing (`if (value) { ... }`) or `??` — never by asserting.
- Avoid `as` casts. `as const` is fine; overriding a library's broken types needs a comment saying
  why the cast is safe.
- Prefer `??` over `||` for defaults: `||` swallows `""`, `0`, and `false`.
- Strict equality (`===` / `!==`).

## React

`src/components/ui/` follows upstream shadcn conventions — leave generated files as-is. These
rules govern app code.

- **Function components only**, typed with a local `interface Props`. No `React.FC`; type
  `children: React.ReactNode` explicitly.
- **Function declarations** for components and standalone functions; arrow functions for callbacks.
- **Destructure props in the signature**, not the body.
- **Derive state, don't sync it.** If a value can be computed from existing state or props, compute
  it during render.
- **Avoid `useEffect` unless it is truly external synchronization.** The React Compiler handles
  memoization — don't hand-roll `useMemo`/`useCallback` unless measurement says otherwise.
- **Conditional rendering:** guard clauses over nested ternaries. ~20+ lines of JSX in a branch
  wants to be its own component.
- Fragments instead of style-less wrapper `div`s.
- `async`/`await` with `try`/`catch` over `.then()` chains; batch independent calls with
  `Promise.all`.

## Next.js (App Router)

- **Server-first.** Pages and layouts are Server Components; add `'use client'` only at the leaves
  that need interactivity. A Server Component calls services directly — it does not fetch its own
  HTTP endpoints.
- **A page that reads live data sets `export const dynamic = "force-dynamic"`.** Otherwise Next
  prerenders it at build time, which both freezes the data and makes a reachable database a
  requirement for building.
- **Navigation:** `next/link` for internal routes; plain `<a>` for external URLs.
- **Images:** `next/image`, with `priority` on large above-the-fold images.
- **Dynamic segments are descriptive:** `[car_id]`, not `[id]`.
- **Environment variables:** never commit secrets. `NEXT_PUBLIC_` only for values safe in the
  browser. A new variable goes in `.env.example`, in Vercel, and in `.github/workflows/web.yml`
  where a job needs it, or the deploy breaks.
- **Auth checks happen in each Server Component and Server Action.** A proxy redirect is not the
  security boundary; a new page or action does its own session check.

## Database

- Migrations are generated (`pnpm db:generate`) and committed with the schema change that produced
  them. Edit a generated file only where the change depends on existing data — adding a NOT NULL
  column, backfilling, reordering statements drizzle-kit emitted wrongly — and say why in a comment
  at the top.
- **A migration that touches existing rows gets a test** that applies the migrations up to the one
  under test, inserts rows, then applies it.
- Migrations run in the CI `migrate` job on `main`, never in the Vercel build.
- A table unreachable from `server/db/schema/index.ts` does not exist as far as migrations are
  concerned.
- Multi-statement writes go in a transaction. This is why the client is the Neon WebSocket driver
  rather than the HTTP one.

## Testing

Philosophy: **test the application the way a user uses it.**

- **Query like a user** (Testing Library priority): `getByRole`, `getByLabelText`, `getByText`.
  Avoid `data-testid` — a last resort, not a default.
- **Use `userEvent`, not `fireEvent`.** `const user = userEvent.setup()` before `render`, and
  `await` every interaction.
- **Always assert the outcome.** Every interaction is followed by an assertion that the DOM or
  system updated.
- Use `queryBy*` for `.not.toBeInTheDocument()`; `findBy*` already asserts presence.
- **Client state that lives outside React** (`localStorage`, media queries) is read with
  `useSyncExternalStore`, not `useState` plus an effect. A component renders on the server first,
  so an initialiser reading the browser store would crash or hydrate to a different value, and
  setting state in an effect starts a second render for something that was never a state change.
  Note jsdom 30 provides no `localStorage`, so
  `vitest.setup.ts` installs a minimal one.
- **Component tests opt into a DOM** with `// @vitest-environment jsdom` at the top of the file.
  `environmentMatchGlobs` was removed in Vitest 4, and setting jsdom globally would make every
  service and SQL test pay for a DOM it never touches.
- **A value a screen reader would read as meaningless gets a label.** A bare `5,000` on a
  service card gets `aria-label="Due at 5,000 miles"`, which also makes it unambiguous to query.
- **Database tests run against PGlite**, a real Postgres in-process, via `createTestDb()` in
  `server/db/testing.ts`. It applies the committed migrations, so a test also fails when a
  migration and the schema disagree. Each test gets its own database, so there is no shared state
  to reset.
- **PGlite is single-connection**, so it cannot exercise two writers racing on a row. If a change
  genuinely needs that, add a Docker-backed suite for those tests specifically rather than moving
  everything off the fast path — `pnpm vitest` needs nothing installed today, locally or in CI,
  and that is worth keeping.
- **Mock the network layer, not implementation details.** For anything that is not the database,
  prefer a stub passed as a parameter over mocking modules.
- Co-locate tests as `*.test.ts(x)`. Name them by outcome (`it('applies sales tax')`).
- **When a test contradicts the code, the code is wrong until proven otherwise.** Don't loosen an
  assertion to make a run go green.

## Verification

Before considering a change done:

```bash
pnpm lint        # oxlint
pnpm fmt:check   # oxfmt
pnpm typecheck   # next typegen && tsc --noEmit
pnpm vitest run  # vitest, once
pnpm build       # catches prerender-time failures the others miss
```

Use `pnpm`, never `npm` or `yarn`.
