import { payOptionOf } from '../data/trades';
import { JobPost, RoleNeed, ShiftEntry } from '../types';

/** 1234567 -> '1,234,567' (Hermes Intl 미지원 환경에서도 안전하게) */
export function comma(value: number): string {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  let out = '';
  for (let i = 0; i < digits.length; i += 1) {
    const fromEnd = digits.length - i;
    out += digits[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += ',';
  }
  return negative ? `-${out}` : out;
}

export function won(value: number): string {
  return `${comma(value)}원`;
}

/** '330,000원' / '28,000원/㎡' / '42,000원/평' */
export function payLabel(job: Pick<JobPost, 'trade' | 'payType' | 'payAmount' | 'payUnit'>): string {
  if (job.payType === '일당') return `${comma(job.payAmount)}원`;
  const unit = payOptionOf(job.trade, '도급', job.payUnit).unit ?? '㎡';
  return `${comma(job.payAmount)}원/${unit}`;
}

/** 도급 총액 (면적 × 단가) */
export function contractTotal(job: Pick<JobPost, 'payType' | 'payAmount' | 'area'>): number {
  return job.payType === '도급' && job.area ? job.payAmount * job.area : job.payAmount;
}

export function rolesLabel(roles: RoleNeed[]): string {
  const parts = roles.filter((r) => r.count > 0).map((r) => `${r.role} ${r.count}명`);
  return parts.length ? parts.join(' · ') : '인원 미정';
}

export function totalHeadcount(roles: RoleNeed[]): number {
  return roles.reduce((sum, r) => sum + r.count, 0);
}

export function shiftLabel(shift: number): string {
  return `${Number.isInteger(shift) ? shift : shift.toFixed(1)}공수`;
}

export function shiftTotal(entries: ShiftEntry[]): number {
  return entries.reduce((sum, e) => sum + e.shift, 0);
}

export function shiftAmount(entry: ShiftEntry): number {
  return Math.round(entry.shift * entry.dayRate);
}

/** 도급 공고의 예상 하루 수입 (정렬·표시용) */
export function expectedDayPay(job: JobPost): number {
  if (job.payType === '일당') return job.payAmount;
  return job.payAmount * (job.area ?? 20);
}

export function daysUntil(dateISO: string, todayISO: string): number {
  const a = new Date(`${dateISO}T00:00:00`);
  const b = new Date(`${todayISO}T00:00:00`);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function dDayLabel(dateISO: string, todayISO: string): string {
  const diff = daysUntil(dateISO, todayISO);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff > 1) return `D-${diff}`;
  return '마감';
}

/** '2026-11-19T06:20:00' → '10분 전' · '어제' · '11월 17일' */
export function relativeTimeKo(stamp: string, nowMs: number = Date.now()): string {
  const [datePart = '', timePart = '00:00:00'] = stamp.split('T');
  const [y = 1970, m = 1, d = 1] = datePart.split('-').map((v) => Number(v));
  const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map((v) => Number(v));
  const then = new Date(y, m - 1, d, hh, mm, ss).getTime();
  const diff = Math.max(0, nowMs - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return `${m}월 ${d}일`;
}

/** 휴대폰 번호 숫자만 → '010-1234-5678' */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** '010-1234-5678' → '010-****-5678' */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7) return value;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

/** 999,000 → '999,000원' · 사업자등록번호 '123-45-67890' */
export function formatBizNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function shortNumber(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) {
    const man = value / 10000;
    return `${Number.isInteger(man) ? man : man.toFixed(1)}만`;
  }
  return comma(value);
}

/** '김도현' → '김○현' (섭외 확정 전 이름 마스킹) */
export function maskName(value: string): string {
  const name = value.trim();
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}○`;
  return `${name[0]}${'○'.repeat(name.length - 2)}${name[name.length - 1]}`;
}
