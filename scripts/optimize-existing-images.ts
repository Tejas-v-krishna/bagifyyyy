/**
 * One-time backfill: recompress images that were uploaded before the smart
 * WebP pipeline existed (or before it hardened), and repoint every database
 * reference at the lighter copy.
 *
 * How it works
 * - Collects every R2-hosted image URL referenced by the database:
 *   product images (`Image.url`), denormalized order-item images, and the
 *   Instagram feed rows in `SiteSetting`.
 * - Downloads each file, runs it through the same optimizer the studio
 *   upload route uses (`@/lib/imageOptimize`), and uploads the result under a
 *   NEW `…-opt.webp` key. Originals are never modified or deleted, so the
 *   migration is fully reversible from the backup file.
 * - Skips anything already optimized (`-opt.webp` suffix), anything small
 *   enough to keep pristine, and anything where the optimizer saves < 20%.
 * - Then rewrites the database URLs (new keys guarantee fresh CDN/browser
 *   caches, unlike overwriting objects behind `immutable` cache headers).
 *
 * Usage:
 *   npm run images:optimize                 (real run — uploads + DB updates)
 *   npm run images:optimize -- --dry-run    (downloads + encodes, no writes)
 *   npm run images:optimize -- --limit 10   (first 10 candidates only)
 *
 * Safe to re-run: candidates that already end in `-opt.webp` are skipped, and
 * the old URLs stay valid forever since originals remain in R2.
 */
import path from 'path';
import { writeFile } from 'fs/promises';
import sharp from 'sharp';
import {
  isKeepPristineWebp,
  isOptimizedKey,
  optimizeImageBuffer,
  optimizedKeyFor,
} from '@/lib/imageOptimize';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_FLAG = process.argv.indexOf('--limit');
const LIMIT = LIMIT_FLAG !== -1 ? Math.max(0, Number(process.argv[LIMIT_FLAG + 1]) || 0) : 0;
const CONCURRENCY = 4;
const MIN_SAVINGS = 0.2;

type Outcome = 'optimized' | 'dry-optimized' | 'skipped-pristine' | 'skipped-marginal' | 'skipped-animated' | 'failed';

interface ItemResult {
  url: string;
  outcome: Outcome;
  beforeBytes: number;
  afterBytes: number;
  newUrl?: string;
  error?: string;
}

const kb = (bytes: number) => (bytes / 1024).toFixed(1) + ' KB';
const pct = (before: number, after: number) => Math.round((1 - after / before) * 100);

async function main() {
  const domain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/+$/, '');
  if (!domain) {
    console.error('R2_PUBLIC_DOMAIN is not set. Run with --env-file=.env or via `npm run images:optimize`.');
    process.exit(1);
  }

  const { prisma } = await import('@/lib/prisma');
  const { isR2Configured, uploadToR2 } = await import('@/lib/r2');

  if (!isR2Configured()) {
    console.error('R2 credentials are not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME).');
    process.exit(1);
  }

  console.log(`Target R2 domain: ${domain}`);
  console.log(DRY_RUN ? 'Mode: DRY RUN (no uploads, no DB writes)\n' : 'Mode: REAL RUN (uploads optimized copies + updates DB)\n');

  // ── 1. Collect every candidate URL ──────────────────────────────────────
  const imageRows = await prisma.image.findMany({ select: { id: true, url: true } });
  const orderItems = await prisma.orderItem.findMany({ select: { image: true } });
  const igRow = await prisma.siteSetting.findUnique({ where: { key: 'instagram_feed' } });

  const candidates = new Set<string>();
  const addIfStored = (url: string | null | undefined) => {
    if (!url || !url.startsWith(`${domain}/`)) return;
    const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
    if (isOptimizedKey(key)) return;
    candidates.add(url);
  };

  imageRows.forEach((row) => addIfStored(row.url));
  orderItems.forEach((row) => addIfStored(row.image));

  let igUrls: string[] = [];
  if (igRow) {
    try {
      const parsed = JSON.parse(igRow.value) as { posts?: Array<{ url?: string }> };
      igUrls = (parsed.posts || []).map((post) => post.url || '').filter(Boolean);
      igUrls.forEach(addIfStored);
    } catch {
      console.warn('Could not parse instagram_feed JSON — skipping those URLs.');
    }
  }

  let urls = Array.from(candidates).sort();
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);
  console.log(
    `Found ${candidates.size} candidate R2 URL(s) in the DB ` +
      `(${imageRows.length} product images, ${orderItems.length} order-item refs, ${igUrls.length} instagram posts).` +
      (LIMIT > 0 ? ` Limiting to ${urls.length}.` : '') +
      '\n'
  );

  // ── 2. Download → optimize → upload ─────────────────────────────────────
  const results: ItemResult[] = [];
  let done = 0;

  const processOne = async (url: string): Promise<ItemResult> => {
    const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return { url, outcome: 'failed', beforeBytes: 0, afterBytes: 0, error: `download HTTP ${res.status}` };
      }
      const original = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(original).metadata();

      if (meta.format === 'gif' || meta.format === 'svg' || (meta.pages ?? 1) > 1) {
        return { url, outcome: 'skipped-animated', beforeBytes: original.length, afterBytes: original.length };
      }
      if (isKeepPristineWebp(meta, original.length)) {
        return { url, outcome: 'skipped-pristine', beforeBytes: original.length, afterBytes: original.length };
      }

      const optimized = await optimizeImageBuffer(original);
      const savings = 1 - optimized.buffer.length / original.length;
      if (savings < MIN_SAVINGS) {
        return { url, outcome: 'skipped-marginal', beforeBytes: original.length, afterBytes: optimized.buffer.length };
      }

      const newKey = optimizedKeyFor(key);
      let newUrl: string | undefined;
      if (!DRY_RUN) {
        newUrl = await uploadToR2({ buffer: optimized.buffer, key: newKey, contentType: 'image/webp' });
      } else {
        newUrl = `${domain}/${newKey}`;
      }

      return {
        url,
        outcome: DRY_RUN ? 'dry-optimized' : 'optimized',
        beforeBytes: original.length,
        afterBytes: optimized.buffer.length,
        newUrl,
      };
    } catch (err) {
      return {
        url,
        outcome: 'failed',
        beforeBytes: 0,
        afterBytes: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  };

  const queue = [...urls];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const url = queue.shift()!;
      const result = await processOne(url);
      results.push(result);
      done += 1;
      const name = decodeURIComponent(new URL(url).pathname.split('/').pop() || url);

      switch (result.outcome) {
        case 'optimized':
        case 'dry-optimized':
          console.log(
            `[${done}/${urls.length}] ${result.outcome === 'optimized' ? 'OPT' : 'DRY'} ${name}: ` +
              `${kb(result.beforeBytes)} -> ${kb(result.afterBytes)} (-${pct(result.beforeBytes, result.afterBytes)}%)`
          );
          break;
        case 'skipped-pristine':
          console.log(`[${done}/${urls.length}] KEEP ${name}: already small (${kb(result.beforeBytes)})`);
          break;
        case 'skipped-marginal':
          console.log(`[${done}/${urls.length}] SKIP ${name}: marginal gain`);
          break;
        case 'skipped-animated':
          console.log(`[${done}/${urls.length}] SKIP ${name}: animated/vector`);
          break;
        default:
          console.log(`[${done}/${urls.length}] FAIL ${name}: ${result.error}`);
      }
    }
  });
  await Promise.all(workers);

  // ── 3. Report + backup ──────────────────────────────────────────────────
  const optimized = results.filter((r) => r.outcome === 'optimized' || r.outcome === 'dry-optimized');
  const beforeTotal = optimized.reduce((sum, r) => sum + r.beforeBytes, 0);
  const afterTotal = optimized.reduce((sum, r) => sum + r.afterBytes, 0);
  const failures = results.filter((r) => r.outcome === 'failed');

  console.log('\n──────── Summary ────────');
  console.log(`Optimized:        ${optimized.length} image(s)`);
  console.log(`  weight:         ${(beforeTotal / 1024 / 1024).toFixed(1)} MB -> ${(afterTotal / 1024 / 1024).toFixed(1)} MB${beforeTotal > 0 ? ` (-${pct(beforeTotal, afterTotal)}%)` : ''}`);
  console.log(`Kept pristine:    ${results.filter((r) => r.outcome === 'skipped-pristine').length}`);
  console.log(`Marginal skips:   ${results.filter((r) => r.outcome === 'skipped-marginal').length}`);
  console.log(`Failed:           ${failures.length}`);
  failures.slice(0, 10).forEach((f) => console.log(`  ! ${f.url} — ${f.error}`));

  if (optimized.length === 0) {
    console.log('\nNothing to do.');
    await prisma.$disconnect();
    return;
  }

  const urlMap = new Map(optimized.map((r) => [r.url, r.newUrl!]));
  const backupPath = path.join(process.cwd(), `backup_image_optimize_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}.json`);
  await writeFile(
    backupPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        note: 'Old URLs per entry are still live in R2 and can be restored via Image.url / OrderItem.image / SiteSetting(instagram_feed).',
        mappings: Object.fromEntries(urlMap),
        failures,
      },
      null,
      2
    )
  );
  console.log(`\nBackup mapping written to ${backupPath}`);

  if (DRY_RUN) {
    console.log('Dry run: DB was NOT updated.');
    await prisma.$disconnect();
    return;
  }

  // ── 4. Repoint the database at the optimized copies ─────────────────────
  const affectedImageRows = imageRows.filter((row) => urlMap.has(row.url));
  console.log(`\nUpdating ${affectedImageRows.length} Image row(s)...`);

  const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

  let updatedRows = 0;
  for (const group of chunk(affectedImageRows, 40)) {
    await prisma.$transaction(
      group.map((row) => prisma.image.update({ where: { id: row.id }, data: { url: urlMap.get(row.url)! } }))
    );
    updatedRows += group.length;
    process.stdout.write(`\r  ${updatedRows}/${affectedImageRows.length}`);
  }
  console.log('');

  const orderUrls = Array.from(new Set(orderItems.map((row) => row.image).filter((url) => urlMap.has(url))));
  console.log(`Updating order-item thumbnails (${orderUrls.length} unique URL(s))...`);
  for (const oldUrl of orderUrls) {
    await prisma.orderItem.updateMany({ where: { image: oldUrl }, data: { image: urlMap.get(oldUrl)! } });
  }
  console.log('  done');

  if (igRow && igUrls.some((url) => urlMap.has(url))) {
    let updated = igRow.value;
    for (const [oldUrl, newUrl] of urlMap) updated = updated.split(oldUrl).join(newUrl);
    try {
      JSON.parse(updated);
      await prisma.siteSetting.update({ where: { key: 'instagram_feed' }, data: { value: updated } });
      console.log('Instagram feed URLs updated.');
    } catch {
      console.warn('WARNING: instagram_feed rewrite produced invalid JSON — left unchanged.');
    }
  }

  console.log('\nAll done. Old files remain in R2 as a safety net.');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
