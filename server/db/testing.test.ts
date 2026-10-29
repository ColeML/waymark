import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "./testing";

describe("createTestDb", () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    testDb = await createTestDb();
  });

  afterEach(async () => {
    await testDb.close();
  });

  it("applies the committed migrations and answers queries", async () => {
    const result = await testDb.db.execute<{ answer: number }>(sql`select 1 as answer`);

    expect(result.rows).toEqual([{ answer: 1 }]);
  });

  it("rolls back a transaction that throws", async () => {
    await testDb.db.execute(sql`create table probe (id int primary key)`);

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.execute(sql`insert into probe (id) values (1)`);
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");

    const result = await testDb.db.execute<{ count: number }>(
      sql`select count(*)::int as count from probe`,
    );

    expect(result.rows).toEqual([{ count: 0 }]);
  });
});
