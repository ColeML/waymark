import { afterEach, describe, expect, it, vi } from "vitest";

import { createTestDb } from "@server/db/testing";

import { isDatabaseReachable } from "./health";

describe("isDatabaseReachable", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports a migrated database as reachable", async () => {
    const testDb = await createTestDb();

    expect(await isDatabaseReachable(testDb.db)).toBe(true);

    await testDb.close();
  });

  it("reports a closed database as unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const testDb = await createTestDb();
    await testDb.close();

    expect(await isDatabaseReachable(testDb.db)).toBe(false);
  });
});
