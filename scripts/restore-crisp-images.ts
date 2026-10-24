import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO credentials');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  console.log('Fetching Image rows with -opt.webp...');
  const imageRows = await client.execute("SELECT id, url FROM Image WHERE url LIKE '%-opt.webp'");
  console.log(`Found ${imageRows.rows.length} Image rows.`);

  console.log('Fetching OrderItem rows with -opt.webp...');
  const orderRows = await client.execute("SELECT id, image FROM OrderItem WHERE image LIKE '%-opt.webp'");
  console.log(`Found ${orderRows.rows.length} OrderItem rows.`);

  if (imageRows.rows.length > 0) {
    console.log('Updating Image table to restore crisp original WebP URLs...');
    await client.execute("UPDATE Image SET url = REPLACE(url, '-opt.webp', '.webp') WHERE url LIKE '%-opt.webp'");
    console.log('Image table updated!');
  }

  if (orderRows.rows.length > 0) {
    console.log('Updating OrderItem table to restore crisp original WebP URLs...');
    await client.execute("UPDATE OrderItem SET image = REPLACE(image, '-opt.webp', '.webp') WHERE image LIKE '%-opt.webp'");
    console.log('OrderItem table updated!');
  }

  const verifyImages = await client.execute("SELECT count(id) as count FROM Image WHERE url LIKE '%-opt.webp'");
  console.log(`Remaining -opt.webp in Image: ${verifyImages.rows[0].count}`);

  const verifyOrders = await client.execute("SELECT count(id) as count FROM OrderItem WHERE image LIKE '%-opt.webp'");
  console.log(`Remaining -opt.webp in OrderItem: ${verifyOrders.rows[0].count}`);

  client.close();
}

main().catch(console.error);
