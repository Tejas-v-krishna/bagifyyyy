import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log('Reverting Image table from -crisp.webp back to original .webp...');
  const imgRes = await client.execute("UPDATE Image SET url = REPLACE(url, '-crisp.webp', '.webp') WHERE url LIKE '%-crisp.webp'");
  console.log('Updated Image rows:', imgRes.rowsAffected);

  console.log('Reverting OrderItem table from -crisp.webp back to original .webp...');
  const orderRes = await client.execute("UPDATE OrderItem SET image = REPLACE(image, '-crisp.webp', '.webp') WHERE image LIKE '%-crisp.webp'");
  console.log('Updated OrderItem rows:', orderRes.rowsAffected);

  const check = await client.execute("SELECT count(id) as count FROM Image WHERE url LIKE '%-crisp.webp'");
  console.log('Remaining -crisp.webp in Image:', check.rows[0].count);

  client.close();
}

main().catch(console.error);
