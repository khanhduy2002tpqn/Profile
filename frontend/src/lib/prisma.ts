import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaClient: PrismaClient;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // During build phase, Vercel might compile routes without a database connection URL.
  // We return a default client to prevent build-time crashes, as no queries are run at build-time.
  prismaClient = new PrismaClient();
} else {
  if (process.env.NODE_ENV === 'production') {
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    const adapter = new PrismaPg(pool);
    prismaClient = new PrismaClient({ adapter });
  } else {
    if (!globalForPrisma.prisma) {
      const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });
      const adapter = new PrismaPg(pool);
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    prismaClient = globalForPrisma.prisma;
  }
}

export const prisma = prismaClient;
