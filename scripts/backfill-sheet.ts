/**
 * One-time backfill: push every existing visible order into the Google Sheet.
 * New orders append automatically (see completeRazorpayOrder + studio POST),
 * so this only needs to run once after connecting the Sheet.
 *
 * Usage: npx tsx scripts/backfill-sheet.ts
 * Skips silently when the sheets env vars are not configured.
 */
async function backfillSheetMain() {
  const { prisma } = await import('@/lib/prisma');
  const { isSheetsConfigured, syncOrderToSheet } = await import('@/lib/googleSheets');

  if (!isSheetsConfigured()) {
    console.error('Sheets env vars missing. Set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY first.');
    process.exit(1);
  }

  const orders = await prisma.order.findMany({
    where: { NOT: { orderStatus: 'AWAITING_PAYMENT' } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, orderNumber: true },
  });
  console.log(`Syncing ${orders.length} orders to the Sheet...`);
  let synced = 0;
  for (const order of orders) {
    const ok = await syncOrderToSheet(order.id);
    if (ok) synced += 1;
    else console.log(`  failed: ${order.orderNumber}`);
  }
  console.log(`Done: ${synced}/${orders.length} synced.`);
}

backfillSheetMain()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
