import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración para asegurar que las fechas se manejen correctamente
  // No podemos usar TZ directamente en Vercel, pero podemos configurar
  // otras opciones relacionadas con el tiempo
  serverRuntimeConfig: {
    // Configuraciones del servidor
    timeZone: 'UTC',
  },
  // Asegurarse de que las variables de entorno estén disponibles en el cliente
  publicRuntimeConfig: {
    // Configuraciones públicas
    timeZone: 'UTC',
  },
  // Configuración de webpack para manejar fechas correctamente
  webpack: (config, { isServer }) => {
    // Configuración adicional si es necesario
    return config;
  },
};

export default nextConfig;
