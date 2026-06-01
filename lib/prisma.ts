import { PrismaClient } from '@prisma/client';

// Singleton de PrismaClient para evitar agotar conexiones en desarrollo
// (Next.js recarga módulos con hot-reload y crearía múltiples clientes).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
