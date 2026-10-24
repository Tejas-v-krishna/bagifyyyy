/**
 * Apply the catalogue indexes directly to Turso.
 *
 * Why this exists: the storefront queries had no supporting indexes, so every
 * listing read the entire Product/Image/Variant tables. Turso bills per ROW
 * READ, so those full scans are what exhausted the plan quota.
 *
 * `prisma db push` would also create these, but it wants to diff the whole
 * schema against the database and can propose destructive changes. This script
 * is purely additive (`IF NOT EXISTS`) and safe to run against production.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/add-indexes.ts
 *
 * Safe to re-run: already-present indexes are skipped.
 */
import { createClient } from '@libsql/client';

const STATEMENTS: { name: string; sql: string }[] = [
  // Product: one index per real query shape in src/lib/products.ts.
  {
    name: 'Product_isArchived_isSoldOut_createdAt_idx',
    sql: `CREATE INDEX IF NOT EXISTS "Product_isArchived_isSoldOut_createdAt_idx"
          ON "Product"("isArchived", "isSoldOut", "createdAt")`,
  },
  {
    name: 'Product_category_isArchived_createdAt_idx',
    sql: `CREATE INDEX IF NOT EXISTS "Product_category_isArchived_createdAt_idx"
          ON "Product"("category", "isArchived", "createdAt")`,
  },
  {
    name: 'Product_isNew_isArchived_isSoldOut_createdAt_idx',
    sql: `CREATE INDEX IF NOT EXISTS "Product_isNew_isArchived_isSoldOut_createdAt_idx"
          ON "Product"("isNew", "isArchived", "isSoldOut", "createdAt")`,
  },
  {
    name: 'Product_isBestSeller_isArchived_isSoldOut_price_idx',
    sql: `CREATE INDEX IF NOT EXISTS "Product_isBestSeller_isArchived_isSoldOut_price_idx"
          ON "Product"("isBestSeller", "isArchived", "isSoldOut", "price")`,
  },
  // Image / Variant: Prisma loads these with `WHERE productId IN (...)`.
  {
    name: 'Image_productId_position_idx',
    sql: `CREATE INDEX IF NOT EXISTS "Image_productId_position_idx"
          ON "Image"("productId", "position")`,
  },
  {
    name: 'Variant_productId_idx',
    sql: `CREATE INDEX IF NOT EXISTS "Variant_productId_idx"
          ON "Variant"("productId")`,
  },
  // Bundle and order line items.
  {
    name: 'BundleProduct_bundleId_idx',
    sql: `CREATE INDEX IF NOT EXISTS "BundleProduct_bundleId_idx"
          ON "BundleProduct"("bundleId")`,
  },
  {
    name: 'BundleProduct_productId_idx',
    sql: `CREATE INDEX IF NOT EXISTS "BundleProduct_productId_idx"
          ON "BundleProduct"("productId")`,
  },
  {
    name: 'OrderItem_orderId_idx',
    sql: `CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx"
          ON "OrderItem"("orderId")`,
  },
  {
    name: 'OrderItem_productId_idx',
    sql: `CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx"
          ON "OrderItem"("productId")`,
  },
  {
    name: 'PointTransaction_loyaltyAccountId_idx',
    sql: `CREATE INDEX IF NOT EXISTS "PointTransaction_loyaltyAccountId_idx"
          ON "PointTransaction"("loyaltyAccountId")`,
  },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.');
  }

  const client = createClient({ url, authToken });

  // Indexes are writes, not reads — so this can succeed even while the plan's
  // read quota is exhausted. Report clearly if it cannot.
  for (const statement of STATEMENTS) {
    try {
      await client.execute(statement.sql);
      console.log(`ok   ${statement.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${statement.name}: ${message}`);
      throw error;
    }
  }

  // Prove the planner now uses them.
  const plan = await client.execute(
    `EXPLAIN QUERY PLAN
     SELECT * FROM "Product"
     WHERE "isArchived" = 0 AND "isSoldOut" = 0
     ORDER BY "createdAt" DESC LIMIT 20`
  );
  console.log('\nQuery plan for the catalogue rail:');
  for (const row of plan.rows) {
    console.log(`  ${String((row as Record<string, unknown>).detail)}`);
  }

  client.close();
  console.log('\nDone. Full scans should now read "SEARCH ... USING INDEX".');
}

main().catch((error) => {
  console.error('\nCould not apply indexes:', error);
  process.exitCode = 1;
});
