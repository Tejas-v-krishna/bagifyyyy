/**
 * One-off migration: add Image.position (display order, 0 = cover) and
 * backfill existing rows in current physical order per product.
 * Safe to re-run: ALTER is skipped if the column already exists.
 *
 * Usage: node scripts/add-image-position.mjs [--local-only | --turso-only]
 */
const clients = [];

async function migrateLocal() {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync("prisma/dev.db");
  try {
    const cols = db.prepare(`PRAGMA table_info("Image")`).all();
    if (!cols.some((c) => c.name === "position")) {
      db.exec(`ALTER TABLE "Image" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0`);
      console.log("[local] column added");
    } else {
      console.log("[local] column already exists");
    }
    const r = db
      .prepare(
        `UPDATE "Image" SET "position" = (SELECT COUNT(*) FROM "Image" AS x WHERE x."productId" = "Image"."productId" AND x."rowid" <= "Image"."rowid") - 1`
      )
      .run();
    console.log(`[local] backfilled ${r.changes} rows`);
    const check = db.prepare(`SELECT COUNT(*) AS n FROM "Image" WHERE "position" IS NULL`).get();
    console.log(`[local] rows with NULL position: ${check.n}`);
  } finally {
    db.close();
  }
}

async function migrateTurso(url, token) {
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url, authToken: token });
  try {
    const cols = await db.execute(`PRAGMA table_info("Image")`);
    if (!cols.rows.some((r) => r.name === "position")) {
      await db.execute(`ALTER TABLE "Image" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0`);
      console.log("[turso] column added");
    } else {
      console.log("[turso] column already exists");
    }
    const r = await db.execute(
      `UPDATE "Image" SET "position" = (SELECT COUNT(*) FROM "Image" AS x WHERE x."productId" = "Image"."productId" AND x."rowid" <= "Image"."rowid") - 1`
    );
    console.log(`[turso] backfilled ${r.rowsAffected} rows`);
    const check = await db.execute(`SELECT COUNT(*) AS n FROM "Image" WHERE "position" IS NULL`);
    console.log(`[turso] rows with NULL position: ${check.rows[0].n}`);
  } finally {
    db.close();
  }
}

const mode = process.argv[2];
(async () => {
  if (!mode || mode === "--local-only") {
    try {
      await migrateLocal();
    } catch (e) {
      console.log("[local] skipped:", e.message);
    }
  }
  if (!mode || mode === "--turso-only") {
    const url = process.env.TURSO_DATABASE_URL;
    const token = process.env.TURSO_AUTH_TOKEN;
    if (!url || !token) {
      console.log("[turso] skipped: TURSO_DATABASE_URL / TURSO_AUTH_TOKEN not set");
    } else {
      await migrateTurso(url, token);
    }
  }
})().catch((e) => {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(1);
});
