import { db as defaultDb, type Database } from "@server/db";
import { sql } from "drizzle-orm";

export async function isDatabaseReachable(db: Database = defaultDb): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);

    return true;
  } catch (error) {
    console.error(
      JSON.stringify({ severity: "error", event: "db.unreachable", error: String(error) }),
    );

    return false;
  }
}
