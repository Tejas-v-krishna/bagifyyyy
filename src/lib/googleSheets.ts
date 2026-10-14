import { prisma } from '@/lib/prisma';

/**
 * Live order log: every paid order (website Razorpay + studio offline) is
 * appended to a Google Sheet, one row per item, so the admin can filter,
 * search by SKU, and pull addresses without touching the database.
 *
 * Setup (one time, admin):
 *  1. Google Cloud → service account → JSON key. Share the Sheet with the
 *     service account's client_email as Editor.
 *  2. Create a tab named Orders (or set GOOGLE_SHEETS_TAB) with this header:
 *     orderNumber | channel | orderDate | customerName | phone | email |
 *     street | city | state | pincode | sku | product | size | color | qty |
 *     unitPrice | lineTotal | imageUrl | discount | shipping | total |
 *     payMethod | payStatus | upiRef | tracking | orderStatus
 *  3. Set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and
 *     GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in Vercel + .env.
 *
 * When unconfigured every call below is a no-op that logs once — checkout
 * and the studio never depend on the Sheet.
 */

export const SHEET_HEADER = [
  'orderNumber',
  'channel',
  'orderDate',
  'customerName',
  'phone',
  'email',
  'street',
  'city',
  'state',
  'pincode',
  'sku',
  'product',
  'size',
  'color',
  'qty',
  'unitPrice',
  'lineTotal',
  'imageUrl',
  'discount',
  'shipping',
  'total',
  'payMethod',
  'payStatus',
  'upiRef',
  'tracking',
  'orderStatus',
] as const;

type SheetOrderItem = {
  sku?: string | null;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  image: string;
};

type SheetOrder = {
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  customerPhone: string;
  customerEmail: string;
  paymentId?: string | null;
  trackingId?: string | null;
  createdAt: Date;
  items: SheetOrderItem[];
  shippingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
};

/** Pure row builder — covered by unit tests, no network involved. */
export function orderToSheetRows(order: SheetOrder): (string | number)[][] {
  const channel = order.paymentMethod === 'MANUAL' ? 'INSTAGRAM' : 'WEBSITE';
  const address = order.shippingAddress;
  return order.items.map((item) => [
    order.orderNumber,
    channel,
    order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt),
    address?.fullName ?? '',
    order.customerPhone,
    order.customerEmail,
    address?.street ?? '',
    address?.city ?? '',
    address?.state ?? '',
    address?.pincode ?? '',
    item.sku || item.productId,
    item.name,
    item.size,
    item.color,
    item.quantity,
    item.price,
    Math.round(item.price * item.quantity * 100) / 100,
    item.image || '',
    order.discountAmount,
    order.shippingAmount,
    order.totalAmount,
    order.paymentMethod,
    order.paymentStatus,
    order.paymentId || '',
    order.trackingId || '',
    order.orderStatus,
  ]);
}

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

async function getAccessToken(): Promise<string> {
  const { JWT } = await import('google-auth-library');
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Google auth returned no access token');
  return token;
}

/**
 * Append one order (all its item rows) to the Sheet. Never throws — a Sheet
 * outage must not fail a payment or a studio save. Logs on failure.
 */
export async function syncOrderToSheet(orderId: string): Promise<boolean> {
  if (!isSheetsConfigured()) {
    console.warn('Google Sheet sync skipped: sheets env vars are not configured.');
    return false;
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shippingAddress: true },
    });
    if (!order) {
      console.warn(`Google Sheet sync skipped: order ${orderId} not found.`);
      return false;
    }

    const rows = orderToSheetRows(order as unknown as SheetOrder);
    if (rows.length === 0) return true;

    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID as string;
    const tab = process.env.GOOGLE_SHEETS_TAB || 'Orders';
    const token = await getAccessToken();

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tab)}!A:Z:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      }
    );
    if (!res.ok) {
      throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`);
    }
    console.log(`Order ${order.orderNumber} appended to Google Sheet (${rows.length} row(s)).`);
    return true;
  } catch (error) {
    console.error('Google Sheet sync failed:', error);
    return false;
  }
}
