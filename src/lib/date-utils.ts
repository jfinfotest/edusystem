import { format, toZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Obtiene la zona horaria configurada para la aplicación.
 * Utiliza la variable de entorno NEXT_PUBLIC_TIMEZONE si está disponible,
 * o 'UTC' como valor predeterminado.
 */
export const getConfiguredTimeZone = () => {
  return process.env.NEXT_PUBLIC_TIMEZONE || 'UTC';
};

/**
 * Formatea una fecha según la zona horaria especificada.
 * @param date - La fecha a formatear (Date o string ISO)
 * @param formatStr - El formato de fecha a utilizar (por defecto: 'yyyy-MM-dd HH:mm:ss')
 * @param timeZone - La zona horaria a utilizar (por defecto: configurada en la aplicación)
 * @returns La fecha formateada como string
 */
export const formatDate = (date: Date | string, formatStr = 'yyyy-MM-dd HH:mm:ss', timeZone = getConfiguredTimeZone()) => {
  // Asegurarse de que date sea un objeto Date
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toZonedTime(dateObj, timeZone);
  return format(zonedDate, formatStr, { timeZone });
};

/**
 * Convierte una fecha UTC a la zona horaria especificada.
 * @param date - La fecha UTC a convertir (Date o string ISO)
 * @param timeZone - La zona horaria a utilizar (por defecto: configurada en la aplicación)
 * @returns La fecha convertida a la zona horaria especificada
 */
export const convertToTimeZone = (date: Date | string, timeZone = getConfiguredTimeZone()) => {
  // Asegurarse de que date sea un objeto Date
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, timeZone);
};

/**
 * Obtiene la fecha actual en UTC.
 * @returns La fecha actual en UTC
 */
export const getCurrentUTCDate = () => {
  return new Date();
};

/**
 * Convierte una fecha local a UTC.
 * @param date - La fecha local a convertir (Date o string ISO)
 * @returns La fecha convertida a UTC
 */
export const convertToUTC = (date: Date | string) => {
  // Asegurarse de que date sea un objeto Date
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Date(Date.UTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    dateObj.getHours(),
    dateObj.getMinutes(),
    dateObj.getSeconds(),
    dateObj.getMilliseconds()
  ));
};