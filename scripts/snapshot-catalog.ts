/**
 * Freeze the live catalogue into `src/data/catalog-fallback.json`.
 *
 * Why: the storefront degrades to this file when Turso refuses reads (plan
 * quota exhausted, outage, network block). Without it the shop renders an
 * empty catalogue and every product image disappears.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/snapshot-catalog.ts
 *
 * Run it after a drop goes live (and before big load tests) so the offline
 * view is as close to the real catalogue as possible. The file is committed,
 * so the snapshot ships in the next deploy; it is only ever read when the
 * database read itself fails.
 */
import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '../src/lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: 'desc' },
    include: { images: { orderBy: { position: 'asc' } } },
  });

  const snapshot = {
    capturedAt: new Date().toISOString(),
    note: 'Last-known catalogue captured before a database outage. Regenerate with: npx tsx --env-file=.env scripts/snapshot-catalog.ts',
    products: products
      .filter((product) => product.images.length > 0)
      .map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice ?? null,
        brand: product.brand ?? null,
        category: product.category,
        subcategory: product.subcategory ?? null,
        isNew: product.isNew,
        isBestSeller: product.isBestSeller,
        isSoldOut: product.isSoldOut,
        createdAt: product.createdAt.toISOString(),
        images: product.images.map((image) => image.url),
      })),
  };

  const target = path.join(process.cwd(), 'src', 'data', 'catalog-fallback.json');
  await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${snapshot.products.length} products to ${target}`);
}

main()
  .catch((error) => {
    console.error('Could not capture catalogue snapshot:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
