import { NextResponse } from 'next/server';
import { formatDate, convertToTimeZone, convertToUTC, getConfiguredTimeZone } from '@/lib/date-utils';

/**
 * Endpoint para probar la configuración de zona horaria
 * Útil para verificar que las fechas se manejan correctamente en Vercel
 */
export async function GET() {
  const now = new Date();
  const nowISO = now.toISOString();
  const configuredTimeZone = getConfiguredTimeZone();
  
  return NextResponse.json({
    success: true,
    timeZoneConfig: {
      configuredTimeZone,
      systemTimeZone: process.env.TZ || 'No TZ set',
      nextPublicTimeZone: process.env.NEXT_PUBLIC_TIMEZONE || 'Not set',
    },
    currentTime: {
      raw: now.toString(),
      iso: nowISO,
      utc: now.toUTCString(),
      formatted: formatDate(now),
    },
    convertedTime: {
      toUTC: convertToUTC(now).toISOString(),
      fromUTC: convertToTimeZone(now).toString(),
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'Not on Vercel',
      vercelRegion: process.env.VERCEL_REGION || 'Not on Vercel',
    },
    buildInfo: {
      buildTime: process.env.BUILD_TIME || 'Not available',
    }
  });
}