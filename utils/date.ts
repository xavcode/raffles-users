import { format as formatDate, Locale } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

// La zona horaria de Colombia.
const timeZone = 'America/Bogota';

/**
 * Convierte un timestamp UTC (de Convex) a una cadena de texto formateada en la zona horaria de Colombia.
 * @param utcTimestamp - El valor de _creationTime o cualquier timestamp numérico de Convex.
 * @param formatString - El formato deseado (ej. "d 'de' MMMM, yyyy").
 */
export const formatUtcToLocal = (utcTimestamp: number, formatString: string, locale: Locale = es): string => {
    const zonedDate = toZonedTime(new Date(utcTimestamp), timeZone);
    return formatDate(zonedDate, formatString, { locale });
};