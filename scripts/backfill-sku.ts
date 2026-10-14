async function backfillSkuMain() {
  if (process.argv.includes('--local')) {
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
  }
  // Dynamic imports: the prisma client binds its database at import time, so
  // the env override above must run before either module loads.
  const { prisma } = await import('@/lib/prisma');
  const { nextSku } = await import('@/lib/sku');

  // 1. Badge every product that lacks one, oldest first so numbers are stable.
  const unbadged = await prisma.product.findMany({
    where: { sku: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  console.log(`Unbadged products: ${unbadged.length}`);
  for (const p of unbadged) {
    const sku = await nextSku();
    await prisma.product.update({ where: { id: p.id }, data: { sku } });
    console.log(`  ${sku} <- ${p.name}`);
  }

  // 2. Snapshot SKUs onto old order lines for the Sheet + studio search.
  const items = await prisma.orderItem.findMany({
    where: { sku: null },
    select: { id: true, productId: true },
  });
  console.log(`Order lines without SKU: ${items.length}`);
  const skuByProduct = new Map<string, string | null>();
  let stamped = 0;
  for (const item of items) {
    if (!skuByProduct.has(item.productId)) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { sku: true },
      });
      skuByProduct.set(item.productId, product?.sku ?? null);
    }
    const sku = skuByProduct.get(item.productId);
    if (sku) {
      await prisma.orderItem.update({ where: { id: item.id }, data: { sku } });
      stamped += 1;
    }
  }
  console.log(`Stamped ${stamped} order lines.`);
}

backfillSkuMain()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
