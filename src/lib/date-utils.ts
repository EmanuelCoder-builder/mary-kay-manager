export const TIMEZONE = 'America/Recife';

/**
 * Retorna a data atual no fuso horário America/Recife no formato YYYY-MM-DD.
 * Usa Intl.DateTimeFormat nativo do motor JS, garantindo 100% de precisão tanto no deploy
 * (servidores UTC como Vercel/Netlify) quanto no navegador do iPhone.
 */
export function getTodayRecife(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Retorna o primeiro e o último dia do mês corrente no fuso horário America/Recife
 * Ex: { startOfMonth: '2026-10-01', endOfMonth: '2026-10-31' }
 */
export function getCurrentMonthRangeRecife(): { startOfMonth: string; endOfMonth: string } {
  const todayStr = getTodayRecife();
  const [yearStr, monthStr] = todayStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const startOfMonth = `${yearStr}-${monthStr}-01`;
  const lastDayNum = new Date(year, month, 0).getDate();
  const endOfMonth = `${yearStr}-${monthStr}-${String(lastDayNum).padStart(2, '0')}`;

  return { startOfMonth, endOfMonth };
}

/**
 * Formata uma string de data (YYYY-MM-DD) para exibição amigável em pt-BR (ex: 15/10/2026).
 * Realiza formatação pura sem conversão de timezone que poderia causar recuo de 1 dia.
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Adiciona N dias a uma data base no formato YYYY-MM-DD.
 * Usa meio-dia UTC para evitar qualquer distorção de fuso ou horário de verão.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Retorna a data da próxima sexta-feira a partir de uma data base (YYYY-MM-DD).
 */
export function getNextFriday(baseDateStr: string): string {
  if (!baseDateStr) return '';
  const [y, m, d] = baseDateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = date.getUTCDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sab
  let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  if (daysUntilFriday === 0) {
    daysUntilFriday = 7;
  }
  date.setUTCDate(date.getUTCDate() + daysUntilFriday);
  return date.toISOString().slice(0, 10);
}

/**
 * Garante que qualquer string de data esteja rigorosamente no formato YYYY-MM-DD.
 * Converte formatos DD/MM/YYYY ou ISO strings completas (ex: com T12:00:00).
 */
export function normalizeDateISO(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (trimmed.includes('T')) {
    return trimmed.split('T')[0];
  }
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return trimmed;
}

