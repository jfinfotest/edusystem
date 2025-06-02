import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {    
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  env: {
    TZ: 'UTC', // Configurar zona horaria UTC para manejo correcto de fechas
  },
};

export default nextConfig;
