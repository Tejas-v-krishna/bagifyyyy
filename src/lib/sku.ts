import { prisma } from '@/lib/prisma';

/** Badge numbers look like BGF-0001. Sequential, human-sorted. */
export const SKU_PREFIX = 'BGF-';

function formatSku(n: number): string {
  return `${SKU_PREFIX}${String(n).padStart(4, '0')}`;
}

/**
 * The next free badge number: one past the highest BGF-NNNN in use.
 * Two admins creating products at the same instant can race — callers must
 * catch the Prisma P2002 unique violation on create and call this again
 * (see the admin products POST route for the pattern).
 */
export async function nextSku(): Promise<string> {
  const rows = await prisma.product.findMany({
    where: { sku: { startsWith: SKU_PREFIX } },
    select: { sku: true },
  });
  let max = 0;
  for (const row of rows) {
    const n = parseInt((row.sku || '').slice(SKU_PREFIX.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return formatSku(max + 1);
}

/** True when a Prisma error is a unique-constraint violation (badge race). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}
