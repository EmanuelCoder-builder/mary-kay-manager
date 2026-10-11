import { format, parseISO, addDays } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

export const TIMEZONE = 'America/Recife';

/**
 * Retorna a data atual no fuso horário America/Recife no formato YYYY-MM-DD
 */
export function getTodayRecife(): string {
  const now = new Date();
  const zoned = toZonedTime(now, TIMEZONE);
  return formatZoned(zoned, 'yyyy-MM-dd', { timeZone: TIMEZONE });
}

/**
 * Retorna o primeiro e o último dia do mês corrente no fuso horário America/Recife
 */
export function getCurrentMonthRangeRecife(): { startOfMonth: string; endOfMonth: string } {
  const todayStr = getTodayRecife();
  const [year, month] = todayStr.split('-');
  const start = `${year}-${month}-01`;

  // Último dia do mês
  const nextMonthFirst = new Date(Number(year), Number(month), 1);
  const lastDay = new Date(nextMonthFirst.getTime() - 1);
  const end = format(lastDay, 'yyyy-MM-dd');

  return { startOfMonth: start, endOfMonth: end };
}

/**
 * Formata uma string de data (YYYY-MM-DD) para exibição amigável em pt-BR (ex: 15/10/2026)
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Adiciona N dias a uma data base no formato YYYY-MM-DD
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  const newDate = addDays(date, days);
  return format(newDate, 'yyyy-MM-dd');
}

/**
 * Retorna a data da próxima sexta-feira a partir de uma data base
 */
export function getNextFriday(baseDateStr: string): string {
  if (!baseDateStr) return '';
  const date = parseISO(baseDateStr);
  const dayOfWeek = date.getDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sab
  // Quantos dias faltam para sexta (5)?
  let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  if (daysUntilFriday === 0) {
    daysUntilFriday = 7; // Se já é sexta, próxima sexta
  }
  const nextFriday = addDays(date, daysUntilFriday);
  return format(nextFriday, 'yyyy-MM-dd');
}
