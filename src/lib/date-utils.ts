import { format, toZonedTime } from 'date-fns-tz';

/**
 * Constante que define la zona horaria predeterminada para la aplicación.
 * Utiliza 'America/Bogota' como zona horaria para Colombia.
 */
export const DEFAULT_TIMEZONE = 'America/Bogota';

/**
 * Formatea una fecha según la zona horaria especificada.
 * @param date - La fecha a formatear
 * @param formatStr - El formato de fecha a utilizar (por defecto: 'yyyy-MM-dd HH:mm:ss')
 * @param timeZone - La zona horaria a utilizar (por defecto: DEFAULT_TIMEZONE)
 * @returns La fecha formateada como string
 */
export const formatDate = (date: Date, formatStr = 'yyyy-MM-dd HH:mm:ss', timeZone = DEFAULT_TIMEZONE) => {
  const zonedDate = toZonedTime(date, timeZone);
  return format(zonedDate, formatStr, { timeZone });
};

/**
 * Convierte una fecha UTC a la zona horaria especificada.
 * @param date - La fecha UTC a convertir
 * @param timeZone - La zona horaria a utilizar (por defecto: DEFAULT_TIMEZONE)
 * @returns La fecha convertida a la zona horaria especificada
 */
export const convertToTimeZone = (date: Date, timeZone = DEFAULT_TIMEZONE) => {
  return toZonedTime(date, timeZone);
};