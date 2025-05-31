import { NextResponse } from 'next/server';
import { formatDate, convertToTimeZone, convertToUTC } from '@/lib/date-utils';

export async function GET() {
  const now = new Date();
  const nowISO = now.toISOString();
  
  return NextResponse.json({
    success: true,
    systemTimeZone: process.env.TZ || 'No TZ set',
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
    nodeEnv: process.env.NODE_ENV,
  });
}