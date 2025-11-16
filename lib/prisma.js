import { PrismaClient } from '@prisma/client';

let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances of Prisma Client in development
  globalThis.__prisma = globalThis.__prisma || new PrismaClient();
  prisma = globalThis.__prisma;
}

export default prisma;
