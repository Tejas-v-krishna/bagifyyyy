import type { Prisma } from '@prisma/client';

const STEEL_TIER_MINIMUM = 500;
const GOLD_TIER_MINIMUM = 2000;

function tierForPoints(points: number): string {
  if (points >= GOLD_TIER_MINIMUM) return 'GOLD';
  if (points >= STEEL_TIER_MINIMUM) return 'STEEL';
  return 'CHROME';
}

/**
 * Credit the points earned by a completed order inside the order transaction.
 * The account is keyed by the normalized checkout email because guest orders
 * can earn points before a shopper creates an account.
 */
export async function applyLoyaltyEarn(
  tx: Prisma.TransactionClient,
  orderId: string,
  email: string | null | undefined,
  totalAmount: number
): Promise<number> {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const earnedPoints = Math.floor(totalAmount / 10);

  if (!normalizedEmail || earnedPoints <= 0) return 0;

  // The unique order key makes retries and webhook/browser races harmless.
  const existingTransaction = await tx.pointTransaction.findUnique({ where: { orderId } });
  if (existingTransaction) return 0;

  const account = await tx.loyaltyAccount.upsert({
    where: { email: normalizedEmail },
    create: { email: normalizedEmail, points: 0, tier: 'CHROME' },
    update: {},
  });

  try {
    await tx.pointTransaction.create({
      data: {
        orderId,
        loyaltyAccountId: account.id,
        points: earnedPoints,
        reason: `Order completed: ${normalizedEmail}`,
      },
    });
  } catch (error) {
    // Another webhook/browser retry may have inserted the unique ledger row
    // between the read above and this insert.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return 0;
    }
    throw error;
  }

  await tx.loyaltyAccount.update({
    where: { id: account.id },
    data: {
      points: { increment: earnedPoints },
    },
  });

  const updatedAccount = await tx.loyaltyAccount.findUnique({ where: { id: account.id } });
  if (updatedAccount) {
    await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier: tierForPoints(updatedAccount.points) },
    });
  }

  return earnedPoints;
}
