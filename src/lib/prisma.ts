import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Remote DB calls must fail fast. The default undici connect timeout (~10s)
// turns one network blip into a minute of blank screen when a page runs
// several queries; a short deadline keeps the worst case to one quick wait.
const REMOTE_TIMEOUT_MS = 6000;

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(REMOTE_TIMEOUT_MS);
  const signal =
    init?.signal
      ? typeof AbortSignal.any === 'function'
        ? AbortSignal.any([init.signal, timeoutSignal])
        : init.signal
      : timeoutSignal;
  return fetch(input, { ...init, signal });
};

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoAuthToken) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
      fetch: fetchWithTimeout,
    });
    // Fire-and-forget: open the HTTPS connection at boot so the first page
    // render does not pay the cold-connect cost (~1.5s) on top of its query.
    libsql.execute('SELECT 1').catch(() => {});
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
