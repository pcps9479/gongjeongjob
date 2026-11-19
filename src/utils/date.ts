export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

/** 로컬 시간대 기준 'YYYY-MM-DDTHH:MM:SS' (정렬·표시용) */
export function nowStamp(): string {
  const now = new Date();
  const pad = (value: number) => `${value}`.padStart(2, '0');
  return `${toISO(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map((v) => Number(v));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function sameMonth(iso: string, year: number, month0: number): boolean {
  const date = parseISO(iso);
  return date.getFullYear() === year && date.getMonth() === month0;
}

export function weekdayKo(iso: string): string {
  return WEEKDAYS_KO[parseISO(iso).getDay()] ?? '';
}

/** '11/20' */
export function monthDay(iso: string): string {
  const date = parseISO(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** '11월 20일 (금)' */
export function fullDateKo(iso: string): string {
  const date = parseISO(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdayKo(iso)})`;
}

/** '2026.11.20' */
export function dottedDate(iso: string): string {
  return iso.replace(/-/g, '.');
}

export function relativeDayLabel(iso: string, baseISO: string): string {
  if (iso === baseISO) return '오늘';
  if (iso === addDays(baseISO, 1)) return '내일';
  if (iso === addDays(baseISO, 2)) return '모레';
  return `${monthDay(iso)}(${weekdayKo(iso)})`;
}

/** 6주(42칸) 달력. 이번 달이 아닌 칸은 null */
export function monthMatrix(year: number, month0: number): (string | null)[][] {
  const first = new Date(year, month0, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toISO(new Date(year, month0, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function monthTitle(year: number, month0: number): string {
  return `${year}년 ${month0 + 1}월`;
}

export function shiftMonth(year: number, month0: number, delta: number): { year: number; month0: number } {
  const date = new Date(year, month0 + delta, 1);
  return { year: date.getFullYear(), month0: date.getMonth() };
}

/** 주말 색상 구분용 */
export function dayTone(iso: string): 'sun' | 'sat' | 'week' {
  const day = parseISO(iso).getDay();
  if (day === 0) return 'sun';
  if (day === 6) return 'sat';
  return 'week';
}
