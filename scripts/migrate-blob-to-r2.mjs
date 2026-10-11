import { createClient } from "@libsql/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import path from "path";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET_NAME || "bagifyyyy-images";
const r2PublicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/+$/, "");

if (!tursoUrl || !tursoToken) {
  console.error("❌ Turso database credentials not found in environment.");
  process.exit(1);
}

if (!r2AccountId || !r2AccessKey || !r2SecretKey || !r2PublicDomain) {
  console.error("❌ Cloudflare R2 credentials not found in environment.");
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKey,
    secretAccessKey: r2SecretKey,
  },
});

const urlMap = new Map();

async function migrateUrl(oldUrl) {
  if (!oldUrl || !oldUrl.includes("vercel-storage.com")) {
    return oldUrl;
  }

  if (urlMap.has(oldUrl)) {
    return urlMap.get(oldUrl);
  }

  try {
    const res = await fetch(oldUrl);
    if (!res.ok) {
      console.warn(`⚠️ Failed to download: ${oldUrl} (status ${res.status})`);
      return oldUrl;
    }

    const arrayBuf = await res.arrayBuffer();
    let buffer = Buffer.from(arrayBuf);
    const contentTypeHeader = res.headers.get("content-type") || "";
    let ext = ".webp";
    let contentType = "image/webp";

    if (contentTypeHeader.includes("gif") || oldUrl.toLowerCase().endsWith(".gif")) {
      ext = ".gif";
      contentType = "image/gif";
    } else {
      try {
        buffer = await sharp(buffer)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toBuffer();
      } catch (err) {
        console.warn(`Sharp conversion warning for ${oldUrl}:`, err.message);
        ext = path.extname(new URL(oldUrl).pathname) || ".jpg";
        contentType = contentTypeHeader || "image/jpeg";
      }
    }

    const parsedPath = new URL(oldUrl).pathname;
    const baseName = path.basename(parsedPath, path.extname(parsedPath))
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();
    const key = `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${baseName}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const newUrl = `${r2PublicDomain}/${key}`;
    urlMap.set(oldUrl, newUrl);
    return newUrl;
  } catch (err) {
    console.error(`❌ Migration error for ${oldUrl}:`, err.message);
    return oldUrl;
  }
}

async function run() {
  console.log("🚀 Starting Vercel Blob -> Cloudflare R2 Migration...");
  console.log(`Target R2 Bucket: ${r2Bucket}`);
  console.log(`Public Domain: ${r2PublicDomain}\n`);

  // 1. Migrate Image table
  console.log("🔍 Scanning Image table...");
  const imagesRes = await db.execute("SELECT id, url FROM Image WHERE url LIKE '%vercel-storage.com%'");
  console.log(`Found ${imagesRes.rows.length} product images hosted on Vercel Blob.\n`);

  let migratedImages = 0;
  for (let i = 0; i < imagesRes.rows.length; i++) {
    const row = imagesRes.rows[i];
    const oldUrl = String(row.url);
    process.stdout.write(`[${i + 1}/${imagesRes.rows.length}] Migrating: ${path.basename(new URL(oldUrl).pathname)}... `);

    const newUrl = await migrateUrl(oldUrl);
    if (newUrl !== oldUrl) {
      await db.execute({
        sql: "UPDATE Image SET url = ? WHERE id = ?",
        args: [newUrl, row.id],
      });
      migratedImages++;
      console.log("✅ DONE");
    } else {
      console.log("⏭️ SKIPPED");
    }
  }

  // 2. Migrate OrderItem table
  console.log("\n🔍 Scanning OrderItem table...");
  const orderItemsRes = await db.execute("SELECT id, image FROM OrderItem WHERE image LIKE '%vercel-storage.com%'");
  console.log(`Found ${orderItemsRes.rows.length} order items with Vercel Blob URLs.\n`);

  let migratedOrderItems = 0;
  for (let i = 0; i < orderItemsRes.rows.length; i++) {
    const row = orderItemsRes.rows[i];
    const oldUrl = String(row.image);
    const newUrl = await migrateUrl(oldUrl);
    if (newUrl !== oldUrl) {
      await db.execute({
        sql: "UPDATE OrderItem SET image = ? WHERE id = ?",
        args: [newUrl, row.id],
      });
      migratedOrderItems++;
    }
  }
  console.log(`✅ Migrated ${migratedOrderItems} OrderItem images.`);

  // 3. Migrate SiteSetting table
  console.log("\n🔍 Scanning SiteSetting table...");
  const siteSettingsRes = await db.execute("SELECT key, value FROM SiteSetting WHERE value LIKE '%vercel-storage.com%'");
  console.log(`Found ${siteSettingsRes.rows.length} settings with Vercel Blob URLs.\n`);

  let migratedSettings = 0;
  for (const row of siteSettingsRes.rows) {
    const oldUrl = String(row.value);
    const newUrl = await migrateUrl(oldUrl);
    if (newUrl !== oldUrl) {
      await db.execute({
        sql: "UPDATE SiteSetting SET value = ? WHERE key = ?",
        args: [newUrl, row.key],
      });
      migratedSettings++;
    }
  }
  console.log(`✅ Migrated ${migratedSettings} SiteSetting values.`);

  console.log("\n==========================================");
  console.log("🎉 MIGRATION COMPLETE!");
  console.log(`Product Images updated: ${migratedImages}`);
  console.log(`OrderItem images updated: ${migratedOrderItems}`);
  console.log(`Settings updated: ${migratedSettings}`);
  console.log(`Unique images uploaded to Cloudflare R2: ${urlMap.size}`);
  console.log("==========================================\n");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
