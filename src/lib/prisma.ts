import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test the connection
prisma
  .$connect()
  .then(() => {
    console.log('Successfully connected to the database');
    // Log the database URL (without credentials)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const url = new URL(dbUrl);
      console.log(`Connected to database at ${url.hostname}:${url.port}${url.pathname}`);
    }
  })
  .catch((error: Error) => {
    console.error('Failed to connect to the database:', error);
  });
