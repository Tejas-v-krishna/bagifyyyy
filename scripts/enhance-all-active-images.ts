import { createClient } from '@libsql/client';
import { uploadToR2 } from '../src/lib/r2';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log('Querying active product images...');
  const rows = await client.execute(`
    SELECT i.id, i.url, p.name 
    FROM Image i 
    JOIN Product p ON i.productId = p.id 
    WHERE p.isArchived = 0 AND p.isSoldOut = 0
  `);

  console.log(`Found ${rows.rows.length} images across active products.`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows.rows) {
    const id = String(row.id);
    const url = String(row.url);
    const name = String(row.name);

    if (url.includes('-crisp.webp')) {
      skipped++;
      continue;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${url} (HTTP ${res.status})`);
        failed++;
        continue;
      }

      const inputBuf = Buffer.from(await res.arrayBuffer());

      // Apply smart adaptive unsharp masking to restore texture and edge micro-contrast
      const crispBuf = await sharp(inputBuf)
        .sharpen({ sigma: 1.5, m1: 2.0, m2: 0.7 })
        .webp({ quality: 90, smartSubsample: true })
        .toBuffer();

      const filename = url.split('/').pop()!.replace(/-opt\.webp$|\.webp$/, '');
      const newKey = `${filename}-crisp.webp`;

      const newUrl = await uploadToR2({
        buffer: crispBuf,
        key: newKey,
        contentType: 'image/webp',
      });

      await client.execute({
        sql: 'UPDATE Image SET url = ? WHERE id = ?',
        args: [newUrl, id],
      });

      // Also update OrderItem denormalized thumbnails if matching
      await client.execute({
        sql: 'UPDATE OrderItem SET image = ? WHERE image = ?',
        args: [newUrl, url],
      });

      processed++;
      console.log(`[${processed}/${rows.rows.length}] Enhanced: ${name} -> ${newKey} (${(inputBuf.length/1024).toFixed(1)}KB -> ${(crispBuf.length/1024).toFixed(1)}KB)`);
    } catch (err) {
      console.error(`Error processing image ${id} (${url}):`, err);
      failed++;
    }
  }

  console.log('\n--- Complete ---');
  console.log(`Processed: ${processed}`);
  console.log(`Skipped (already crisp): ${skipped}`);
  console.log(`Failed: ${failed}`);

  client.close();
}

main().catch(console.error);
