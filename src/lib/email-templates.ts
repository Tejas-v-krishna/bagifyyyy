export interface DropProductItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountBadge?: string;
  image: string;
  category?: string;
}

export interface DropCampaignOptions {
  campaignTitle?: string;
  headline?: string;
  subheadline?: string;
  promoBadge?: string;
  bannerImage?: string;
  products: DropProductItem[];
  appUrl?: string;
}

export interface OrderConfirmationItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  image: string;
}

export interface OrderConfirmation {
  customerEmail?: string | null;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  shippingAddress?: { fullName?: string | null } | null;
  items: OrderConfirmationItem[];
}

/**
 * High-converting visual Fashion Drop Email Template
 * Inspired by modern streetwear & retail drop campaigns (Myntra / Kith / Supreme / ASOS)
 */
export function generateDropAnnouncementEmailHtml(options: DropCampaignOptions): string {
  const appUrl = options.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const headline = options.headline || 'RIGHT TO FASHION DROP';
  const subheadline = options.subheadline || 'Exclusive Y2K Streetwear & Cyber Archive Collection';
  const promoBadge = options.promoBadge || '50–80% OFF';

  // Build product grid rows (2 items per row)
  const productRowsHtml = [];
  for (let i = 0; i < options.products.length; i += 2) {
    const p1 = options.products[i];
    const p2 = options.products[i + 1];

    productRowsHtml.push(`
      <tr>
        <td width="50%" style="padding: 10px; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; background-color: #ffffff; border-radius: 8px; overflow: hidden; text-align: center;">
            <tr>
              <td style="padding: 0; position: relative;">
                ${p1.discountBadge ? `
                <div style="background-color: #0C2340; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 8px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-top: 8px; border-radius: 4px;">
                  ${p1.discountBadge}
                </div>` : ''}
                <a href="${appUrl}/product/${p1.id}" style="text-decoration: none; display: block; padding: 12px;">
                  <img src="${p1.image.startsWith('http') ? p1.image : `${appUrl}${p1.image}`}" alt="${p1.name}" width="100%" style="max-height: 220px; object-fit: cover; border-radius: 6px; display: block; margin: 0 auto;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 10px 16px 10px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0C2340; line-height: 1.3;">
                  ${p1.name}
                </h4>
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0C2340;">
                  ₹${p1.price.toLocaleString('en-IN')}
                  ${p1.originalPrice ? `<span style="font-size: 11px; text-decoration: line-through; color: #94a3b8; margin-left: 6px;">₹${p1.originalPrice}</span>` : ''}
                </p>
                <a href="${appUrl}/product/${p1.id}" style="display: block; background-color: #0C2340; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px; border-radius: 4px;">
                  SHOP NOW →
                </a>
              </td>
            </tr>
          </table>
        </td>
        ${p2 ? `
        <td width="50%" style="padding: 10px; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; background-color: #ffffff; border-radius: 8px; overflow: hidden; text-align: center;">
            <tr>
              <td style="padding: 0; position: relative;">
                ${p2.discountBadge ? `
                <div style="background-color: #0C2340; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 8px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-top: 8px; border-radius: 4px;">
                  ${p2.discountBadge}
                </div>` : ''}
                <a href="${appUrl}/product/${p2.id}" style="text-decoration: none; display: block; padding: 12px;">
                  <img src="${p2.image.startsWith('http') ? p2.image : `${appUrl}${p2.image}`}" alt="${p2.name}" width="100%" style="max-height: 220px; object-fit: cover; border-radius: 6px; display: block; margin: 0 auto;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 10px 16px 10px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0C2340; line-height: 1.3;">
                  ${p2.name}
                </h4>
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #0C2340;">
                  ₹${p2.price.toLocaleString('en-IN')}
                  ${p2.originalPrice ? `<span style="font-size: 11px; text-decoration: line-through; color: #94a3b8; margin-left: 6px;">₹${p2.originalPrice}</span>` : ''}
                </p>
                <a href="${appUrl}/product/${p2.id}" style="display: block; background-color: #0C2340; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px; border-radius: 4px;">
                  SHOP NOW →
                </a>
              </td>
            </tr>
          </table>
        </td>` : '<td width="50%"></td>'}
      </tr>
    `);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <center>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      
      <!-- Top Announcement Strip -->
      <tr>
        <td style="background-color: #0C2340; color: #ffffff; text-align: center; padding: 8px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">
          ✦ EXCLUSIVE NEW DROP IS LIVE ✦ LIMITED PIECES
        </td>
      </tr>

      <!-- Brand Header -->
      <tr>
        <td style="padding: 20px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #0C2340; text-transform: uppercase;">
            BAGIFYYYY
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 2px; text-transform: uppercase;">
            Y2K STREETWEAR & ARCHIVE DROP CULTURE
          </p>
        </td>
      </tr>

      <!-- Hero Banner -->
      <tr>
        <td style="position: relative; text-align: center; padding: 0;">
          <a href="${appUrl}/products" style="display: block; text-decoration: none;">
            <div style="background: linear-gradient(135deg, #0C2340 0%, #1e293b 100%); padding: 40px 20px; color: #ffffff;">
              <div style="display: inline-block; background-color: #ef4444; color: #ffffff; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                ● LIVE NOW
              </div>
              <h2 style="margin: 0 0 10px 0; font-size: 32px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
                ${headline}
              </h2>
              <div style="font-size: 48px; font-weight: 900; color: #facc15; margin: 10px 0; letter-spacing: -1px;">
                ${promoBadge}
              </div>
              <p style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #cbd5e1;">
                ${subheadline}
              </p>
              <div style="display: inline-block; background-color: #ffffff; color: #0C2340; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                EXPLORE DROP COLLECTION →
              </div>
            </div>
          </a>
        </td>
      </tr>

      <!-- Perk Bar -->
      <tr>
        <td style="background-color: #f8fafc; padding: 12px 16px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; text-align: center;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0C2340;">
            🚚 FREE EXPRESS SHIPPING OVER ₹299 &nbsp;|&nbsp; ⚡ NO RESTOCKS
          </span>
        </td>
      </tr>

      <!-- Section Title -->
      <tr>
        <td style="padding: 24px 20px 8px 20px; text-align: center;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0C2340;">
            FEATURED DROP HIGHLIGHTS
          </h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600;">
            Hand-picked archive pieces available in limited quantities.
          </p>
        </td>
      </tr>

      <!-- Product Grid -->
      <tr>
        <td style="padding: 10px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${productRowsHtml.join('')}
          </table>
        </td>
      </tr>

      <!-- VIP Promo Banner -->
      <tr>
        <td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0C2340; border-radius: 8px; text-align: center; color: #ffffff;">
            <tr>
              <td style="padding: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; uppercase; letter-spacing: 1.5px; color: #facc15;">
                  ✦ SUBSCRIBER EXCLUSIVE ✦
                </p>
                <h3 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 900; text-transform: uppercase;">
                  GET EXTRA 10% OFF YOUR ORDER
                </h3>
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #cbd5e1;">
                  Use code <b style="background-color: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; color: #ffffff; letter-spacing: 1px;">BAGIFY10</b> at checkout
                </p>
                <a href="${appUrl}/products" style="display: inline-block; background-color: #facc15; color: #0C2340; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; border-radius: 4px;">
                  CLAIM YOUR DISCOUNT →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0C2340;">
            BAGIFYYYY ARCHIVE & DROP STORE
          </p>
          <p style="margin: 0 0 12px 0;">
            You received this email because you subscribed to drop alerts at <a href="${appUrl}" style="color: #0C2340; font-weight: 700; text-decoration: none;">bagifyyyy.com</a>.
          </p>
          <p style="margin: 0;">
            <a href="${appUrl}/account" style="color: #64748b; text-decoration: underline; margin-right: 12px;">Manage Preferences</a>
            <a href="${appUrl}/faq" style="color: #64748b; text-decoration: underline; margin-right: 12px;">Customer Support</a>
            <a href="${appUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>

    </table>
  </center>
</body>
</html>
  `;
}

/**
 * Transactional Order Confirmation Email Template
 */
export function generateOrderConfirmationEmailHtml(
  order: OrderConfirmation,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
): string {
  const itemsHtml = order.items.map((it) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="60" style="vertical-align: top;">
              <img src="${it.image.startsWith('http') ? it.image : `${appUrl}${it.image}`}" alt="${it.name}" width="50" height="60" style="object-fit: cover; border-radius: 4px; display: block;" />
            </td>
            <td style="padding-left: 12px; vertical-align: top;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #0C2340;">${it.name}</p>
              <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Size: ${it.size} | Qty: ${it.quantity}</p>
            </td>
            <td style="text-align: right; vertical-align: top; font-size: 13px; font-weight: 800; color: #0C2340;">
              ₹${(it.price * it.quantity).toLocaleString('en-IN')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <center>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr>
        <td style="background-color: #0C2340; color: #ffffff; text-align: center; padding: 24px;">
          <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">BAGIFYYYY</h1>
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #10b981; letter-spacing: 1px;">✦ ORDER CONFIRMED ✦</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #0C2340; font-weight: 600;">
            Hi ${order.shippingAddress?.fullName || 'Valued Customer'},
          </p>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.5;">
            Thank you for your order! Your purchase is confirmed and is currently being processed for India Post dispatch.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #0C2340;">Order #${order.orderNumber}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Payment Method: <b>${order.paymentMethod}</b> (${order.paymentStatus})</p>
          </div>

          <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0C2340;">Items in Your Order</h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${itemsHtml}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
            <tr>
              <td style="font-size: 14px; font-weight: 800; color: #0C2340;">Total Paid:</td>
              <td style="font-size: 16px; font-weight: 900; color: #0C2340; text-align: right;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; text-align: center;">
            <a href="${appUrl}/account" style="display: inline-block; background-color: #0C2340; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; border-radius: 4px;">
              TRACK YOUR ORDER →
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          BAGIFYYYY Streetwear & Archive • All rights reserved
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `;
}

/**
 * Newsletter Welcome Email Template
 */
export function generateWelcomeEmailHtml(
  email: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <center>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
      <tr>
        <td style="background-color: #0C2340; color: #ffffff; text-align: center; padding: 32px 20px;">
          <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #facc15;">✦ YOU'RE IN ✦</p>
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">WELCOME TO BAGIFYYYY</h1>
          <p style="margin: 0; font-size: 13px; color: #cbd5e1;">Get ready for early drop access and exclusive member archives.</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px 24px; text-align: center;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 800; color: #0C2340; text-transform: uppercase;">
            HERE IS 10% OFF YOUR FIRST DROP
          </h2>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: #64748b;">
            Use this code at checkout to claim your member welcome discount:
          </p>

          <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #0C2340; padding: 12px 24px; border-radius: 6px; margin-bottom: 24px;">
            <span style="font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #0C2340;">BAGIFY10</span>
          </div>

          <div>
            <a href="${appUrl}/products" style="display: inline-block; background-color: #0C2340; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 14px 28px; border-radius: 4px;">
              SHOP THE LATEST DROP →
            </a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          BAGIFYYYY Streetwear & Archive • All rights reserved
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `;
}
