# AGENTS.md — Waymark

Read [`coding-standards.md`](coding-standards.md) before writing code, and the design in
[`docs/specs/2026-10-28-waymark-design.md`](docs/specs/2026-10-28-waymark-design.md).

```bash
pnpm install
docker compose up -d  # local Postgres, plus the wsproxy the Neon driver needs to reach it
pnpm db:migrate       # apply migrations to it
pnpm dev              # http://localhost:3000
pnpm lint             # oxlint
pnpm fmt:check        # oxfmt
pnpm typecheck        # next typegen && tsc --noEmit
pnpm vitest run       # vitest, once
pnpm test:e2e         # playwright, starts its own dev server
pnpm build            # catches prerender failures the others miss
pnpm db:generate      # generate a migration after a schema change
```

Migrations run in the CI `migrate` job on `main`, never in the Vercel build. That job reads the
`DATABASE_URL_UNPOOLED` repository secret in GitHub Actions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
