/**
 * One-time backfill: generate card thumbnails for every product image that is
 * already stored in R2.
 *
 * Why this exists
 * - Grids (category pages, home showcase, search) render product photos at
 *   roughly 288 CSS px, but were downloading the full ~550 KB original. A
 *   20-card page weighed ~10.8 MB.
 * - The upload route now writes a `_thumb.webp` sibling alongside every new
 *   original, but the 646 images uploaded before that change have no sibling
 *   yet. This script fills that gap.
 *
 * What it does NOT do
 * - It never modifies or deletes an original. Every upload is a NEW key.
 * - It never touches the database. Thumb URLs are derived from the full URL by
 *   convention (`thumbUrlFor`), so there is nothing to migrate and nothing to
 *   roll back: deleting the `_thumb.webp` objects restores the previous state.
 *
 * Usage:
 *   npm run images:thumbs                 (real run — uploads thumbnails)
 *   npm run images:thumbs -- --dry-run    (downloads + encodes, no uploads)
 *   npm run images:thumbs -- --limit 20   (first 20 candidates only)
 *
 * Safe to re-run: candidates whose thumbnail already exists are skipped via a
 * HEAD check.
 */
import { buildThumb } from '@/lib/imageThumb';
import { isThumbUrl, thumbKeyFor } from '@/lib/imageVariants';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_FLAG = process.argv.indexOf('--limit');
const LIMIT = LIMIT_FLAG !== -1 ? Math.max(0, Number(process.argv[LIMIT_FLAG + 1]) || 0) : 0;
/**
 * Kept deliberately low. `r2.dev` is the rate-limited development endpoint, and
 * hammering it with double-digit concurrency produces connect timeouts that
 * stall the whole run. Four workers finish the full catalog in a few minutes.
 */
const CONCURRENCY = 4;
/** Per-request ceiling so one stalled socket cannot wedge a worker. */
const HEAD_TIMEOUT_MS = 20_000;
const DOWNLOAD_TIMEOUT_MS = 45_000;

type Outcome = 'created' | 'dry-created' | 'skipped-exists' | 'skipped-undecodable' | 'failed';

interface ItemResult {
  url: string;
  outcome: Outcome;
  beforeBytes: number;
  afterBytes: number;
  error?: string;
}

const kb = (bytes: number) => (bytes / 1024).toFixed(1) + ' KB';
const pct = (before: number, after: number) => Math.round((1 - after / before) * 100);

async function main() {
  const domain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/+$/, '');
  if (!domain) {
    console.error('R2_PUBLIC_DOMAIN is not set. Run via `npm run images:thumbs`.');
    process.exit(1);
  }

  const { prisma } = await import('@/lib/prisma');
  const { isR2Configured, uploadToR2 } = await import('@/lib/r2');

  if (!isR2Configured()) {
    console.error('R2 credentials are not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME).');
    process.exit(1);
  }

  console.log(`Target R2 domain: ${domain}`);
  console.log(DRY_RUN ? 'Mode: DRY RUN (no uploads)\n' : 'Mode: REAL RUN (uploads thumbnail copies)\n');

  // ── 1. Collect every stored image URL ───────────────────────────────────
  const imageRows = await prisma.image.findMany({ select: { url: true } });
  const orderItems = await prisma.orderItem.findMany({ select: { image: true } });
  const igRow = await prisma.siteSetting.findUnique({ where: { key: 'instagram_feed' } });

  const candidates = new Set<string>();
  const addIfStored = (url: string | null | undefined) => {
    if (!url || !url.startsWith(`${domain}/`)) return;
    const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
    if (isThumbUrl(key)) return;
    candidates.add(url);
  };

  imageRows.forEach((row) => addIfStored(row.url));
  orderItems.forEach((row) => addIfStored(row.image));

  if (igRow) {
    try {
      const parsed = JSON.parse(igRow.value) as { posts?: Array<{ url?: string }> };
      (parsed.posts || []).forEach((post) => addIfStored(post.url));
    } catch {
      console.warn('Could not parse instagram_feed JSON — skipping those URLs.');
    }
  }

  let urls = Array.from(candidates).sort();
  if (LIMIT > 0) urls = urls.slice(0, LIMIT);

  console.log(
    `Found ${candidates.size} candidate URL(s) ` +
      `(${imageRows.length} product images, ${orderItems.length} order-item refs).` +
      (LIMIT > 0 ? ` Limiting to ${urls.length}.` : '') +
      '\n'
  );

  // ── 2. Generate + upload ────────────────────────────────────────────────
  const results: ItemResult[] = [];
  let done = 0;

  const processOne = async (url: string): Promise<ItemResult> => {
    const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
    const thumbKey = thumbKeyFor(key);
    const thumbUrl = `${domain}/${thumbKey}`;

    try {
      // Skip when the thumbnail already exists.
      const head = await fetch(thumbUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(HEAD_TIMEOUT_MS),
      });
      if (head.ok) {
        return { url, outcome: 'skipped-exists', beforeBytes: 0, afterBytes: 0 };
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
      if (!res.ok) {
        return { url, outcome: 'failed', beforeBytes: 0, afterBytes: 0, error: `download HTTP ${res.status}` };
      }
      const original = Buffer.from(await res.arrayBuffer());

      const thumb = await buildThumb(original);
      if (!thumb) {
        return { url, outcome: 'skipped-undecodable', beforeBytes: original.length, afterBytes: 0 };
      }

      if (!DRY_RUN) {
        await uploadToR2({ buffer: thumb.buffer, key: thumbKey, contentType: 'image/webp' });
      }

      return {
        url,
        outcome: DRY_RUN ? 'dry-created' : 'created',
        beforeBytes: original.length,
        afterBytes: thumb.buffer.length,
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
        case 'created':
        case 'dry-created':
          console.log(
            `[${done}/${urls.length}] ${result.outcome === 'created' ? 'THUMB' : 'DRY  '} ${name.slice(-42)}: ` +
              `${kb(result.beforeBytes)} -> ${kb(result.afterBytes)} (-${pct(result.beforeBytes, result.afterBytes)}%)`
          );
          break;
        case 'skipped-exists':
          console.log(`[${done}/${urls.length}] SKIP  ${name.slice(-42)}: thumbnail already exists`);
          break;
        case 'skipped-undecodable':
          console.log(`[${done}/${urls.length}] SKIP  ${name.slice(-42)}: sharp could not decode`);
          break;
        default:
          console.log(`[${done}/${urls.length}] FAIL  ${name.slice(-42)}: ${result.error}`);
      }
    }
  });
  await Promise.all(workers);

  // ── 3. Report ───────────────────────────────────────────────────────────
  const made = results.filter((r) => r.outcome === 'created' || r.outcome === 'dry-created');
  const beforeTotal = made.reduce((sum, r) => sum + r.beforeBytes, 0);
  const afterTotal = made.reduce((sum, r) => sum + r.afterBytes, 0);
  const failures = results.filter((r) => r.outcome === 'failed');

  console.log('\n──────── Summary ────────');
  console.log(`Thumbnails created:  ${made.length}`);
  console.log(
    `  grid weight:       ${(beforeTotal / 1024 / 1024).toFixed(1)} MB -> ${(afterTotal / 1024 / 1024).toFixed(1)} MB` +
      (beforeTotal > 0 ? ` (-${pct(beforeTotal, afterTotal)}%)` : '')
  );
  console.log(`Already existed:     ${results.filter((r) => r.outcome === 'skipped-exists').length}`);
  console.log(`Undecodable:         ${results.filter((r) => r.outcome === 'skipped-undecodable').length}`);
  console.log(`Failed:              ${failures.length}`);
  failures.slice(0, 10).forEach((f) => console.log(`  ! ${f.url} — ${f.error}`));

  if (DRY_RUN) console.log('\nDry run: nothing was uploaded.');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
