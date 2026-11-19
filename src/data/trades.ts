import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { PayType, PayUnit, SiteConditions, TradeFilter, TradeKind, WorkType } from '../types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface TradePayOption {
  type: PayType;
  /** 도급 단가 기준 */
  unit?: PayUnit;
  /** 세그먼트에 표시되는 이름 */
  label: string;
  /** 입력창 옆 단위 */
  unitLabel: string;
  placeholder: string;
  /** 도급일 때 면적 입력 라벨 */
  areaLabel?: string;
  areaUnit?: string;
}

export interface TradeCheckOption {
  key: string;
  label: string;
  offLabel: string;
}

export interface TradeConfig {
  key: TradeKind;
  icon: IconName;
  /** 피드 카드·프로필 배지 색 */
  tone: 'accent' | 'green' | 'blue' | 'gray' | 'amber' | 'purple' | 'navy';
  /** 공정 한 줄 소개 */
  tagline: string;
  workTypes: WorkType[];
  payOptions: TradePayOption[];
  specLabel: string;
  specs: string[];
  /** 공정별 기본 일당 (공수 기록 기본값) */
  defaultDayRate: number;
  /** 공정에 맞춘 기본 현장 조건 라벨 */
  conditionLabels: Record<keyof SiteConditions, { label: string; offLabel: string }>;
  /** 공정별 추가 체크 항목 */
  checks: TradeCheckOption[];
  /** 공고 등록 시 기본 선택되는 현장 조건 */
  defaultConditions: SiteConditions;
}

const TILE_SPECS = ['300×300 세라믹', '300×600 세라믹', '600×600 포세린', '600×1200 포세린', '800×800 포세린', '900×1800 포세린', '직접 입력'];

export const TRADES: TradeConfig[] = [
  {
    key: '타일',
    icon: 'grid-outline',
    tone: 'accent',
    tagline: '화장실·바닥·대형 포세린',
    workTypes: ['화장실', '바닥·벽', '포세린·대형', '졸리컷', '현관·베란다'],
    payOptions: [
      { type: '일당', label: '일당', unitLabel: '원 / 일', placeholder: '320000' },
      { type: '도급', unit: '㎡', label: '헤베당 도급', unitLabel: '원 / ㎡', placeholder: '28000', areaLabel: '시공 면적', areaUnit: '㎡' },
    ],
    specLabel: '타일 규격',
    specs: TILE_SPECS,
    defaultDayRate: 330000,
    conditionLabels: {
      materials: { label: '자재·부자재 구비', offLabel: '자재 미구비' },
      hoisting: { label: '양중 가능', offLabel: '양중 없음' },
      parking: { label: '주차 가능', offLabel: '주차 불가' },
      meal: { label: '식사 제공', offLabel: '식사 없음' },
      sameDayPay: { label: '당일 지급', offLabel: '익일 지급' },
    },
    checks: [
      { key: 'tile-tools', label: '습식 절단기 지참', offLabel: '절단기 미지참' },
      { key: 'tile-suction', label: '흡착기 필요', offLabel: '흡착기 불필요' },
      { key: 'tile-grout', label: '줄눈·실리콘 포함', offLabel: '줄눈 별도' },
    ],
    defaultConditions: { materials: true, hoisting: true, parking: false, meal: false, sameDayPay: true },
  },
  {
    key: '목공',
    icon: 'hammer-outline',
    tone: 'amber',
    tagline: '몰딩·가벽·도어·붙박이',
    workTypes: ['몰딩', '걸레받이', '가벽·천장', '도어·중문', '가구·붙박이'],
    payOptions: [
      { type: '일당', label: '일당', unitLabel: '원 / 일', placeholder: '340000' },
      { type: '도급', unit: '평', label: '평당 도급', unitLabel: '원 / 평', placeholder: '42000', areaLabel: '시공 평수', areaUnit: '평' },
    ],
    specLabel: '목재·자재',
    specs: ['MDF 9mm', 'MDF 12mm', '합판 12mm', '집성목', '경량철골(스터드)', '직접 입력'],
    defaultDayRate: 340000,
    conditionLabels: {
      materials: { label: '목재·부자재 구비', offLabel: '목재 미구비' },
      hoisting: { label: '자재 양중 가능', offLabel: '양중 없음' },
      parking: { label: '주차 가능', offLabel: '주차 불가' },
      meal: { label: '식사 제공', offLabel: '식사 없음' },
      sameDayPay: { label: '당일 지급', offLabel: '익일 지급' },
    },
    checks: [
      { key: 'wood-nailer', label: '타카·콤프 구비', offLabel: '타카·콤프 미구비' },
      { key: 'wood-drawing', label: '도면·먹매김 있음', offLabel: '도면 없음' },
      { key: 'wood-cut', label: '현장 재단 가능', offLabel: '재단장 필요' },
    ],
    defaultConditions: { materials: true, hoisting: true, parking: true, meal: false, sameDayPay: true },
  },
  {
    key: '철거',
    icon: 'trash-outline',
    tone: 'gray',
    tagline: '전체철거·부분철거·폐기물',
    workTypes: ['전체 철거', '부분 철거', '화장실 철거', '마루·장판 철거', '폐기물 반출'],
    payOptions: [
      { type: '일당', label: '일당', unitLabel: '원 / 일', placeholder: '210000' },
      { type: '도급', unit: '평', label: '평당 도급', unitLabel: '원 / 평', placeholder: '36000', areaLabel: '철거 평수', areaUnit: '평' },
      { type: '도급', unit: '톤', label: '톤당 도급', unitLabel: '원 / 톤', placeholder: '120000', areaLabel: '폐기물 톤수', areaUnit: '톤' },
    ],
    specLabel: '철거 범위',
    specs: ['경량 철거', '철거 + 폐기물 반출', '철거만', '욕실 철거(방수 훼손)', '직접 입력'],
    defaultDayRate: 210000,
    conditionLabels: {
      materials: { label: '장비·자재 구비', offLabel: '장비 미구비' },
      hoisting: { label: '엘리베이터 양중', offLabel: '양중 불가' },
      parking: { label: '주차 가능', offLabel: '주차 불가' },
      meal: { label: '식사 제공', offLabel: '식사 없음' },
      sameDayPay: { label: '당일 지급', offLabel: '익일 지급' },
    },
    checks: [
      { key: 'demo-waste', label: '폐기물 처리 포함', offLabel: '폐기물 별도' },
      { key: 'demo-tools', label: '브레이커·전동공구 지참', offLabel: '공구 미지참' },
      { key: 'demo-protect', label: '보양·먼지막이 필요', offLabel: '보양 불필요' },
    ],
    defaultConditions: { materials: false, hoisting: true, parking: true, meal: false, sameDayPay: true },
  },
  {
    key: '도배·마루',
    icon: 'layers-outline',
    tone: 'green',
    tagline: '실크·합지·강마루·장판',
    workTypes: ['실크', '합지', '강마루', '원목마루', '장판'],
    payOptions: [
      { type: '일당', label: '일당', unitLabel: '원 / 일', placeholder: '260000' },
      { type: '도급', unit: '평', label: '평당 도급', unitLabel: '원 / 평', placeholder: '28000', areaLabel: '시공 평수', areaUnit: '평' },
      { type: '도급', unit: '롤', label: '롤당 도급', unitLabel: '원 / 롤', placeholder: '45000', areaLabel: '도배 롤 수', areaUnit: '롤' },
    ],
    specLabel: '도배지·마루재',
    specs: ['실크 93cm', '합지 106cm', '강마루 190mm', '원목마루 120mm', '장판 1.8T', '직접 입력'],
    defaultDayRate: 260000,
    conditionLabels: {
      materials: { label: '도배지·자재 구비', offLabel: '자재 미구비' },
      hoisting: { label: '자재 양중 가능', offLabel: '양중 없음' },
      parking: { label: '주차 가능', offLabel: '주차 불가' },
      meal: { label: '식사 제공', offLabel: '식사 없음' },
      sameDayPay: { label: '당일 지급', offLabel: '익일 지급' },
    },
    checks: [
      { key: 'paper-paste', label: '풀기계 구비', offLabel: '풀기계 없음' },
      { key: 'paper-cutter', label: '재단기 구비', offLabel: '재단기 없음' },
      { key: 'paper-furniture', label: '가구 있음(이동 필요)', offLabel: '빈집' },
    ],
    defaultConditions: { materials: true, hoisting: true, parking: false, meal: false, sameDayPay: false },
  },
  {
    key: '필름',
    icon: 'film-outline',
    tone: 'purple',
    tagline: '문·문틀·싱크대·샷시',
    workTypes: ['문·문틀', '싱크대', '샷시', '현관문', '상업공간'],
    payOptions: [
      { type: '일당', label: '일당', unitLabel: '원 / 일', placeholder: '300000' },
      { type: '도급', unit: '면', label: '면당 도급', unitLabel: '원 / 면', placeholder: '45000', areaLabel: '시공 면 수', areaUnit: '면' },
      { type: '도급', unit: '세트', label: '세트 도급', unitLabel: '원 / 세트', placeholder: '280000', areaLabel: '시공 세트 수', areaUnit: '세트' },
    ],
    specLabel: '필름 종류',
    specs: ['인테리어 필름(무광)', '인테리어 필름(유광)', '에칭 필름', '시트지', '직접 입력'],
    defaultDayRate: 300000,
    conditionLabels: {
      materials: { label: '필름 자재 구비', offLabel: '필름 미구비' },
      hoisting: { label: '자재 양중 가능', offLabel: '양중 없음' },
      parking: { label: '주차 가능', offLabel: '주차 불가' },
      meal: { label: '식사 제공', offLabel: '식사 없음' },
      sameDayPay: { label: '당일 지급', offLabel: '익일 지급' },
    },
    checks: [
      { key: 'film-heat', label: '열풍기 지참', offLabel: '열풍기 없음' },
      { key: 'film-primer', label: '프라이머 지참', offLabel: '프라이머 없음' },
      { key: 'film-remove', label: '기존 필름 탈거 포함', offLabel: '탈거 별도' },
    ],
    defaultConditions: { materials: true, hoisting: false, parking: true, meal: false, sameDayPay: true },
  },
  {
    key: '전기·설비',
    icon: 'flash-outline',
    tone: 'blue',
    tagline: '배선·조명·분전반·배관',
    workTypes: ['배선', '조명·스위치', '분전반', '배관', '방수·위생기구'],
    payOptions: [
      { type: '일당', label: '일당', unitLabel: '원 / 일', placeholder: '330000' },
      { type: '도급', unit: '개소', label: '개소당 도급', unitLabel: '원 / 개소', placeholder: '90000', areaLabel: '시공 개소 수', areaUnit: '개소' },
      { type: '도급', unit: '건', label: '건당 도급', unitLabel: '원 / 건', placeholder: '1800000', areaLabel: '시공 건수', areaUnit: '건' },
    ],
    specLabel: '배선·기기 규격',
    specs: ['2.5SQ 배선', '4SQ 배선', 'LED 6인치', '분전반 12회로', 'PB 배관 15A', '직접 입력'],
    defaultDayRate: 330000,
    conditionLabels: {
      materials: { label: '부자재·기기 구비', offLabel: '자재 미구비' },
      hoisting: { label: '자재 양중 가능', offLabel: '양중 없음' },
      parking: { label: '주차 가능', offLabel: '주차 불가' },
      meal: { label: '식사 제공', offLabel: '식사 없음' },
      sameDayPay: { label: '당일 지급', offLabel: '익일 지급' },
    },
    checks: [
      { key: 'elec-license', label: '자격증 필요(전기기능사)', offLabel: '자격증 무관' },
      { key: 'elec-tools', label: '특수공구 지참', offLabel: '공구 미지참' },
      { key: 'elec-test', label: '검사·시운전 포함', offLabel: '검사 별도' },
    ],
    defaultConditions: { materials: true, hoisting: false, parking: true, meal: false, sameDayPay: true },
  },
];

export const TRADE_KEYS: TradeKind[] = TRADES.map((trade) => trade.key);
export const TRADE_FILTERS: TradeFilter[] = ['전체', ...TRADE_KEYS];

export function getTrade(kind: TradeKind): TradeConfig {
  return TRADES.find((trade) => trade.key === kind) ?? TRADES[0]!;
}

/** 저장된 예전 데이터에 공정이 없을 때 타일로 보정 */
export function normalizeTrade(value: unknown): TradeKind {
  return TRADE_KEYS.includes(value as TradeKind) ? (value as TradeKind) : '타일';
}

export function tradeChecksLabel(kind: TradeKind): string {
  return getTrade(kind).checks.map((check) => check.label).join(' · ');
}

export function payOptionOf(kind: TradeKind, type: PayType, unit?: PayUnit): TradePayOption {
  const options = getTrade(kind).payOptions;
  const byUnit = options.find((option) => option.type === type && option.unit === unit);
  const byType = options.find((option) => option.type === type);
  return byUnit ?? byType ?? options[0]!;
}

/** '330,000원 / 42,000원/㎡' — 카드·시트 공통 금액 표기 */
export function payUnitText(job: { trade: TradeKind; payType: PayType; payUnit?: PayUnit }): string {
  if (job.payType === '일당') return '원/일';
  return `원/${payOptionOf(job.trade, '도급', job.payUnit).unit ?? '㎡'}`;
}

/** '112㎡ · 34평 · 6톤' */
export function areaText(job: { trade: TradeKind; payUnit?: PayUnit; area?: number }): string | null {
  if (!job.area) return null;
  const unit = payOptionOf(job.trade, '도급', job.payUnit).unit ?? '㎡';
  return `${job.area}${unit}`;
}
