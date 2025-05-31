// Script para establecer la zona horaria antes de iniciar la aplicación
// Este script se ejecutará antes del comando de inicio en Vercel

console.log('Configurando zona horaria para la aplicación...');

// Intentar establecer la zona horaria a UTC
try {
  // Verificar la zona horaria actual
  console.log('Zona horaria del sistema:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('Fecha actual en UTC:', new Date().toISOString());
  
  // En algunos entornos, podemos intentar establecer la zona horaria mediante
  // la configuración de la variable de entorno process.env.TZ
  // Esto no funcionará directamente en Vercel, pero lo incluimos para entornos de desarrollo
  if (process.env.NODE_ENV !== 'production') {
    process.env.TZ = 'UTC';
    console.log('Variable TZ establecida a UTC para entorno de desarrollo');
  }
  
  // Verificar nuevamente después del intento de cambio
  console.log('Fecha después de configuración:', new Date().toISOString());
  
} catch (error) {
  console.error('Error al configurar la zona horaria:', error);
}

console.log('Configuración de zona horaria completada.');