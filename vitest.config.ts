import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    // Loads .env so importing modules that construct PrismaClient works.
    setupFiles: ['dotenv/config'],
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
});
