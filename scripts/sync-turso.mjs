import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoAuthToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env');
  process.exit(1);
}

const turso = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

async function main() {
  console.log(`⚡ Connecting to Turso: ${tursoUrl}...`);

  // 1. Create Tables
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "password" TEXT,
      "name" TEXT,
      "avatar" TEXT,
      "googleId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "price" REAL NOT NULL,
      "brand" TEXT,
      "category" TEXT NOT NULL,
      "isNew" BOOLEAN NOT NULL DEFAULT false,
      "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
      "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Image" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "url" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Variant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "color" TEXT NOT NULL,
      "size" TEXT NOT NULL,
      "stock" INTEGER NOT NULL DEFAULT 0,
      "productId" TEXT NOT NULL,
      CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Subscriber" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "StockNotification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "notified" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StockNotification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Bundle" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "discount" REAL NOT NULL DEFAULT 15,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "BundleProduct" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "bundleId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      CONSTRAINT "BundleProduct_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "BundleProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "LoyaltyAccount" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "points" INTEGER NOT NULL DEFAULT 0,
      "tier" TEXT NOT NULL DEFAULT 'CHROME',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "PointTransaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "loyaltyAccountId" TEXT NOT NULL,
      "points" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PointTransaction_loyaltyAccountId_fkey" FOREIGN KEY ("loyaltyAccountId") REFERENCES "LoyaltyAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Address" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT,
      "fullName" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "street" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "state" TEXT NOT NULL,
      "pincode" TEXT NOT NULL,
      "country" TEXT NOT NULL DEFAULT 'India',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderNumber" TEXT NOT NULL,
      "userId" TEXT,
      "customerEmail" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "totalAmount" REAL NOT NULL,
      "shippingAmount" REAL NOT NULL DEFAULT 0,
      "discountAmount" REAL NOT NULL DEFAULT 0,
      "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
      "orderStatus" TEXT NOT NULL DEFAULT 'PROCESSING',
      "paymentMethod" TEXT NOT NULL,
      "razorpayOrderId" TEXT,
      "paymentId" TEXT,
      "signature" TEXT,
      "shippingAddressId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "OrderItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "price" REAL NOT NULL,
      "size" TEXT NOT NULL,
      "color" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "image" TEXT NOT NULL,
      CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "MarketingCampaign" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "previewText" TEXT,
      "bannerImage" TEXT,
      "headline" TEXT,
      "promoBadge" TEXT,
      "productIds" TEXT NOT NULL DEFAULT '[]',
      "sentCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyAccount_email_key" ON "LoyaltyAccount"("email");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");`
  ];

  console.log('📦 Creating database tables in Turso...');
  for (const stmt of ddlStatements) {
    await turso.execute(stmt);
  }
  console.log('✅ Tables and Indexes verified in Turso!');

  // 2. Migrate local data if dev.db exists
  try {
    const localDb = new Database('dev.db');
    
    // Copy Products
    const products = localDb.prepare('SELECT * FROM Product').all();
    console.log(`🚀 Migrating ${products.length} products to Turso...`);
    for (const p of products) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO Product (id, name, description, price, brand, category, isNew, isBestSeller, isSoldOut, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [p.id, p.name, p.description, p.price, p.brand, p.category, p.isNew, p.isBestSeller, p.isSoldOut, p.createdAt, p.updatedAt]
      });
    }

    // Copy Images
    const images = localDb.prepare('SELECT * FROM Image').all();
    console.log(`🖼️ Migrating ${images.length} images to Turso...`);
    for (const img of images) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO Image (id, url, productId) VALUES (?, ?, ?)`,
        args: [img.id, img.url, img.productId]
      });
    }

    // Copy Variants
    const variants = localDb.prepare('SELECT * FROM Variant').all();
    console.log(`🏷️ Migrating ${variants.length} product variants to Turso...`);
    for (const v of variants) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO Variant (id, color, size, stock, productId) VALUES (?, ?, ?, ?, ?)`,
        args: [v.id, v.color, v.size, v.stock, v.productId]
      });
    }

    // Copy Users
    const users = localDb.prepare('SELECT * FROM User').all();
    console.log(`👤 Migrating ${users.length} users to Turso...`);
    for (const u of users) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO User (id, email, password, name, avatar, googleId, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [u.id, u.email, u.password, u.name, u.avatar, u.googleId, u.createdAt, u.updatedAt]
      });
    }

    // Copy Subscribers
    const subscribers = localDb.prepare('SELECT * FROM Subscriber').all();
    console.log(`📬 Migrating ${subscribers.length} subscribers to Turso...`);
    for (const s of subscribers) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO Subscriber (id, email, phone, createdAt) VALUES (?, ?, ?, ?)`,
        args: [s.id, s.email, s.phone, s.createdAt]
      });
    }

    console.log('🎉 Turso cloud database synchronized and seeded successfully!');
  } catch (err) {
    console.warn('Note on local db copy:', err.message);
  }
}

main().catch(console.error);
