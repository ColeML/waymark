import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    // Baseline for tests that exercise getEnv(); override individual values with vi.stubEnv.
    env: {
      DATABASE_URL: "postgresql://waymark:waymark@localhost:5456/waymark",
    },
    unstubEnvs: true,
    // Database tests build a fresh PGlite Postgres and replay every migration in a `beforeEach`,
    // which blows the default 10s hook timeout on a loaded machine. Provender measured 67% of
    // cores as the fastest worker cap; a percentage scales down on a smaller runner.
    maxWorkers: "67%",
    hookTimeout: 30_000,
    testTimeout: 30_000,
    // Node by default, because most of the suite is services and SQL. A component test opts into
    // a DOM with `// @vitest-environment jsdom` at the top of the file — `environmentMatchGlobs`
    // was removed in Vitest 4 — so a database test never pays for jsdom.
    setupFiles: ["./vitest.setup.ts"],
    // Extends rather than replaces: assigning `exclude` outright drops vitest's own defaults,
    // including **/dist/**.
    // e2e/** too: those are Playwright specs, which need a running server and a database.
    // .claude/worktrees/** is git-ignored sibling checkouts of this same repo, used by other
    // agents' sessions — without the exclude, vitest also collects and runs their branches' tests.
    exclude: [...configDefaults.exclude, ".next/**", "e2e/**", ".claude/worktrees/**"],
  },
  resolve: {
    // Mirrors tsconfig `paths`. Anchored regexes rather than bare string prefixes, so a plain "@"
    // alias does not also match scoped package names and rewrite them into src/.
    alias: [
      { find: /^@server\//, replacement: `${dir("./server")}/` },
      { find: /^@\//, replacement: `${dir("./src")}/` },
      // `server-only` throws on import outside a React Server Component, which would make every
      // server module untestable. Next resolves it to an empty stub via the `react-server` export
      // condition; point at that same stub rather than setting the condition globally, which
      // would also change how React resolves and break client-component tests.
      { find: /^server-only$/, replacement: dir("./node_modules/server-only/empty.js") },
    ],
  },
});
