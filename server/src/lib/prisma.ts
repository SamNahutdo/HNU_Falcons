// =============================================================================
// Prisma Client Singleton
// One client instance is reused across all service modules.
// Prevents connection pool exhaustion in long-running server processes.
// =============================================================================

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
