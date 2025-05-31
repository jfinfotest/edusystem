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
      // Asegurarse de que todas las fechas estén en UTC
      // Recorrer recursivamente los datos para convertir fechas a UTC
      const processData = (data: Record<string, unknown>) => {
        for (const key in data) {
          if (data[key] instanceof Date) {
            // Asegurarse de que la fecha esté en UTC
            const date = new Date(data[key] as Date);
            data[key] = new Date(Date.UTC(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              date.getHours(),
              date.getMinutes(),
              date.getSeconds(),
              date.getMilliseconds()
            ));
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            // Procesar objetos anidados
            processData(data[key] as Record<string, unknown>);
          }
        }
      };
      
      processData(params.args.data);
    }
  }
  return next(params);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma