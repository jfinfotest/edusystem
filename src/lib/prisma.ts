import { PrismaClient } from "@/app/generated/prisma"

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

// Configuración para asegurar que las fechas se manejen correctamente en diferentes zonas horarias
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma