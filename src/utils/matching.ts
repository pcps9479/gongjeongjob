import { TRADE_TOOLS } from '../data/workerIntros';
import { Region, TradeKind, TradeRole, WorkType, WorkerIntro } from '../types';
import { addDays } from './date';

/** 발주처가 고르는 긴급 펑크 자동 매칭 조건 */
export interface UrgentMatchConditions {
  trade: TradeKind;
  /** '전체'면 지역 무관 */
  region: Region | '전체';
  /** '전체'면 직급 무관 */
  role: TradeRole | '전체';
  /** 최소 경력 — 0은 무관 */
  minYears: number;
  /** 필수 시공 스킬 (선택한 공정의 시공 부위) */
  skills: WorkType[];
  /** 필수 공구 지참 — 해당 공정 대표 공구 보유자만 */
  requireTools: boolean;
  /** 일당 상한 (원/일) */
  maxDayRate: number;
  /** 시공사진 보유 필수 */
  requirePhotos: boolean;
}

export const DEFAULT_URGENT_CONDITIONS: UrgentMatchConditions = {
  trade: '타일',
  region: '전체',
  role: '전체',
  minYears: 0,
  skills: [],
  requireTools: false,
  maxDayRate: 350000,
  requirePhotos: false,
};

/** 최소 경력 선택지 */
export const MIN_YEARS_OPTIONS: { label: string; value: number }[] = [
  { label: '무관', value: 0 },
  { label: '3년+', value: 3 },
  { label: '5년+', value: 5 },
  { label: '10년+', value: 10 },
];

/**
 * 긴급 출역 대기 풀 — 오늘·내일 바로 들어갈 수 있는 기술자.
 * 기술자가 켠 `오늘·내일 긴급 출역` 스위치, 또는 출역 가능일(오늘·내일)로 판단한다.
 */
export function isUrgentAvailable(worker: WorkerIntro, today: string): boolean {
  if (worker.urgentToday || worker.urgentTomorrow) return true;
  if (worker.availableFrom <= today) {
    return addDays(worker.availableFrom, worker.availableDays) > today;
  }
  return worker.availableFrom === addDays(today, 1);
}

/** 조건 하나하나를 만족하는지 */
export function matchesUrgentConditions(
  worker: WorkerIntro,
  conditions: UrgentMatchConditions,
): boolean {
  if (!worker.trades.includes(conditions.trade)) return false;
  if (conditions.region !== '전체' && !worker.regions.includes(conditions.region)) return false;
  if (conditions.role !== '전체' && worker.grade !== conditions.role) return false;
  if (conditions.minYears > 0 && worker.years < conditions.minYears) return false;
  if (conditions.skills.some((skill) => !worker.skills.includes(skill))) return false;

  if (conditions.requireTools) {
    const tradeTools = TRADE_TOOLS[conditions.trade] ?? [];
    if (!worker.tools.some((tool) => tradeTools.includes(tool))) return false;
  }

  // 희망 일당이 '협의'인 기술자는 상한 안에서 조율 가능한 것으로 본다
  if (typeof worker.dayRate === 'number' && worker.dayRate > conditions.maxDayRate) return false;

  if (conditions.requirePhotos && worker.photos.length === 0) return false;
  return true;
}

/** 대기 풀 → 조건 충족 기술자 (긴급·사진·평점 순) */
export function matchUrgentWorkers(
  workers: WorkerIntro[],
  conditions: UrgentMatchConditions,
  today: string,
): WorkerIntro[] {
  return workers
    .filter((worker) => isUrgentAvailable(worker, today) && matchesUrgentConditions(worker, conditions))
    .sort(
      (a, b) =>
        Number(!!b.urgentToday) - Number(!!a.urgentToday) ||
        b.photos.length - a.photos.length ||
        b.rating - a.rating ||
        b.deals - a.deals,
    );
}

/** 긴급 매칭 대기 풀 크기 */
export function urgentPool(workers: WorkerIntro[], today: string): WorkerIntro[] {
  return workers.filter((worker) => isUrgentAvailable(worker, today));
}

/** 데모용 연락처 — 실제 서비스에서는 매칭 수락 후 본인 인증 번호가 공개된다 */
export function demoPhone(workerId: string): string {
  let hash = 0;
  for (let i = 0; i < workerId.length; i += 1) {
    hash = (hash * 31 + workerId.charCodeAt(i)) % 100000;
  }
  const mid = `${1000 + (hash % 9000)}`;
  const last = `${1000 + ((hash * 7 + 13) % 9000)}`;
  return `010-${mid}-${last}`;
}
