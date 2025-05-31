import { PrismaClient } from "@/app/generated/prisma"

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}

// Configuración para asegurar que las fechas se manejen correctamente en UTC para Vercel
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Middleware para convertir automáticamente las fechas a UTC al guardar
prisma.$use(async (params, next) => {
  // Procesar las fechas antes de enviar a la base de datos
  if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
    if (params.args.data) {
      // Convertir fechas a UTC si es necesario
      // No es necesario hacer nada aquí ya que Prisma maneja las fechas en UTC por defecto
      // Este middleware está aquí para posibles personalizaciones futuras
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma