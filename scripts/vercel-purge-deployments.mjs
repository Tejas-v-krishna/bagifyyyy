#!/usr/bin/env node
// Bulk-delete old Vercel deployments to reclaim Deployment Storage,
// while NEVER touching the live production deployment.
//
// Usage:
//   node scripts/vercel-purge-deployments.mjs --project bagifyyyy [--yes] [--dry-run]
//   node scripts/vercel-purge-deployments.mjs --project bagifyyyy --keep dpl_XXX --yes
//
// Token: create one at https://vercel.com/account/tokens (Full Account scope)
// and pass it via VERCEL_TOKEN env var or --token <value>.
//
// Safety:
//   - defaults to keeping the newest READY production deployment
//   - prints the full delete plan and asks for confirmation (skip with --yes)
//   - --dry-run only lists what WOULD be deleted

const API = 'https://api.vercel.com';

function usage() {
  console.log(`Usage:
  VERCEL_TOKEN=<token> node scripts/vercel-purge-deployments.mjs --project <name> [options]

Options:
  --project <name>   Vercel project name or ID (required)
  --keep <uid|url>   Deployment to keep (default: newest READY production)
  --team <slug|id>   Team slug/ID (omit for personal Hobby account)
  --token <value>    API token (or VERCEL_TOKEN env var)
  --yes              Skip the confirmation prompt
  --dry-run          Only list what would be deleted, delete nothing`);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes') out.yes = true;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (!val || val.startsWith('--')) {
        console.error(`Missing value for ${a}`);
        process.exit(1);
      }
      out[key] = val;
      i++;
    }
  }
  return out;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function api(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(token), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status} ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function resolveProjectId(nameOrId, token, team) {
  const teamQs = team ? `?teamId=${encodeURIComponent(team)}` : '';
  const p = await api(`/v9/projects/${encodeURIComponent(nameOrId)}${teamQs}`, token);
  return { id: p.id, name: p.name };
}

async function listAllDeployments(projectId, token, team) {
  const all = [];
  let from = null;
  for (;;) {
    const qs = new URLSearchParams({ projectId, limit: '100' });
    if (team) qs.set('teamId', team);
    if (from) qs.set('from', String(from));
    const page = await api(`/v6/deployments?${qs}`, token);
    all.push(...(page.deployments || []));
    if (page.pagination?.next) from = page.pagination.next;
    else break;
    if (all.length > 5000) break; // sanity cap
  }
  return all;
}

function pickKeep(deployments, keepArg) {
  if (keepArg) {
    const found = deployments.find((d) => d.uid === keepArg || d.url === keepArg);
    if (!found) throw new Error(`--keep target not found among deployments: ${keepArg}`);
    return found;
  }
  const prodReady = deployments
    .filter((d) => d.target === 'production' && d.state === 'READY')
    .sort((a, b) => b.createdAt - a.createdAt);
  if (prodReady.length === 0) throw new Error('No READY production deployment found - refusing to continue.');
  return prodReady[0];
}

function confirm(question) {
  return new Promise((resolve) => {
    process.stdout.write(`${question} [y/N] `);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => {
      process.stdin.pause();
      resolve(/^y(es)?$/i.test(d.trim()));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  const token = args.token || process.env.VERCEL_TOKEN;
  if (!token) {
    console.error('Missing token. Create one at https://vercel.com/account/tokens and set VERCEL_TOKEN.');
    process.exit(1);
  }
  if (!args.project) {
    console.error('Missing --project <name>.');
    usage();
    process.exit(1);
  }

  console.log('Resolving project...');
  const { id: projectId, name } = await resolveProjectId(args.project, token, args.team);
  console.log(`Project: ${name} (${projectId})`);

  console.log('Listing deployments...');
  const all = await listAllDeployments(projectId, token, args.team);
  console.log(`Found ${all.length} deployments.`);

  const keep = pickKeep(all, args.keep);
  console.log(`Keeping live deployment: ${keep.uid} (${keep.url}) state=${keep.state}`);

  const victims = all.filter((d) => d.uid !== keep.uid);
  if (victims.length === 0) {
    console.log('Nothing to delete.');
    return;
  }
  const byState = victims.reduce((m, d) => {
    m[d.state] = (m[d.state] || 0) + 1;
    return m;
  }, {});
  console.log(`Will delete ${victims.length}: ${JSON.stringify(byState)}`);
  for (const d of victims.slice(0, 15)) {
    console.log(`  - ${new Date(d.createdAt).toISOString().slice(0, 10)} ${d.uid} ${d.target || ''} ${d.state} ${d.url}`);
  }
  if (victims.length > 15) console.log(`  ... and ${victims.length - 15} more`);

  if (args.dryRun) {
    console.log('Dry run - nothing deleted.');
    return;
  }
  if (!args.yes) {
    const ok = await confirm('Delete these deployments?');
    if (!ok) {
      console.log('Aborted.');
      return;
    }
  }

  let deleted = 0;
  let failed = 0;
  for (const d of victims) {
    try {
      await api(`/v13/deployments/${d.uid}${args.team ? `?teamId=${encodeURIComponent(args.team)}` : ''}`, token, {
        method: 'DELETE',
      });
      deleted++;
      if (deleted % 10 === 0) console.log(`  ...${deleted}/${victims.length} deleted`);
    } catch (e) {
      failed++;
      console.error(`  FAILED ${d.uid}: ${e.message}`);
    }
    await sleep(300); // stay under API rate limits
  }
  console.log(`Done. Deleted: ${deleted}, failed: ${failed}. Storage graph updates within ~24h.`);
}

main().catch((e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
