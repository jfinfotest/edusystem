import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    TZ: 'UTC',
  },
  // Asegurarse de que las variables de entorno estén disponibles en tiempo de construcción
  serverRuntimeConfig: {
    TZ: 'UTC',
  },
  // Asegurarse de que las variables de entorno estén disponibles en el cliente
  publicRuntimeConfig: {
    TZ: 'UTC',
  },
};

export default nextConfig;
