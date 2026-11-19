import { PhotoPattern, PhotoTone, TradeKind, WorkerIntro } from '../types';
import { addDays, todayISO } from '../utils/date';

const base = todayISO();
const d = (offset: number) => addDays(base, offset);

/** 자기소개 카드 등록 시각은 어제 기준 — 새로 쓴 자기소개가 항상 목록 최상단에 오도록 */
const yday = addDays(base, -1);

/** 공정별 대표 보유 공구 (자기소개 작성 시 선택지) */
export const TRADE_TOOLS: Record<TradeKind, string[]> = {
  타일: ['타일커터 1200', '타일커터 600', '습식 절단기', '흡착기', '레이저 레벨', '줄눈기', '그라인더'],
  목공: ['타카', '콤프레샤', '전동 톱', '레이저 레벨', '전동 드라이버', '사다리'],
  철거: ['브레이커', '햄머드릴', '전동공구 세트', '방진 마스크', '집게차(1톤)'],
  '도배·마루': ['풀기계', '재단기', '롤러 세트', '마루 망치', '커터기'],
  필름: ['열풍기', '프라이머 세트', '스퀴지', '커터기', '히팅건'],
  '전기·설비': ['테스터기', '압착공구 세트', '배선 인입기', '절연저항계', '파이프 렌치'],
};

/** 시공 사진 샘플 (데모 — 실제 업로드 대신 고르는 현장 톤) */
export const PHOTO_SAMPLES: { tone: PhotoTone; pattern: PhotoPattern; label: string }[] = [
  { tone: 'navy', pattern: 'tile', label: '포세린 격자' },
  { tone: 'accent', pattern: 'tile', label: '욕실 마감' },
  { tone: 'gray', pattern: 'plank', label: '바닥 판재' },
  { tone: 'green', pattern: 'panel', label: '벽체 패널' },
  { tone: 'purple', pattern: 'panel', label: '문·문틀' },
  { tone: 'blue', pattern: 'mosaic', label: '모자이크' },
  { tone: 'amber', pattern: 'plank', label: '마루·도배' },
];

export const MAX_WORKER_PHOTOS = 3;

export const seedWorkerIntros: WorkerIntro[] = [
  {
    id: 'wk-1',
    name: '김도현',
    grade: '기공',
    years: 12,
    trades: ['타일'],
    regions: ['서울', '경기'],
    availableFrom: d(0),
    availableDays: 7,
    headline: '타일 12년차 기공, 600·1200각 포세린·졸리컷 가능 / 이번 주 서울·경기 출역 가능합니다',
    skills: ['포세린·대형', '졸리컷', '화장실', '바닥·벽'],
    tools: ['타일커터 1200', '습식 절단기', '흡착기', '레이저 레벨', '줄눈기'],
    dayRate: 350000,
    rating: 4.9,
    deals: 46,
    verified: true,
    photos: [
      {
        id: 'wkp-1a',
        part: '욕실 벽체',
        caption: '600×1200 포세린, 줄눈 2mm 마감',
        tone: 'accent',
        pattern: 'tile',
      },
      {
        id: 'wkp-1b',
        part: '카페 대형 벽체',
        caption: '900×1800 판재 흡착 시공 · 컷 손실 최소',
        tone: 'navy',
        pattern: 'tile',
      },
      {
        id: 'wkp-1c',
        part: '졸리컷 코너',
        caption: '상가 화장실 정밀 컷 마감',
        tone: 'blue',
        pattern: 'mosaic',
      },
    ],
    createdAt: `${yday}T09:40:00`,
  },
  {
    id: 'wk-2',
    name: '박○우',
    masked: true,
    grade: '준기공',
    years: 5,
    trades: ['타일'],
    regions: ['인천', '경기'],
    availableFrom: d(1),
    availableDays: 5,
    headline: '타일 준기공 5년차, 화장실·현관·베란다 마감 보조 가능 / 인천·경기 출역합니다',
    skills: ['화장실', '현관·베란다'],
    tools: ['타일커터 600', '그라인더', '줄눈기'],
    rating: 4.6,
    deals: 21,
    verified: true,
    photos: [
      {
        id: 'wkp-2a',
        part: '아파트 현관',
        caption: '300×600 세라믹 현관·베란다 마감',
        tone: 'gray',
        pattern: 'plank',
      },
    ],
    createdAt: `${yday}T08:20:00`,
  },
  {
    id: 'wk-3',
    name: '이승호',
    grade: '기공',
    years: 8,
    trades: ['목공'],
    regions: ['서울', '경기'],
    availableFrom: d(2),
    availableDays: 10,
    headline: '목공 8년차 기공, 경량철골 가벽·우물틀 천장과 붙박이 설치까지 / 서울 전지역 가능',
    skills: ['가벽·천장', '몰딩', '가구·붙박이'],
    tools: ['타카', '콤프레샤', '전동 톱', '레이저 레벨'],
    dayRate: 360000,
    rating: 4.8,
    deals: 33,
    verified: true,
    photos: [
      {
        id: 'wkp-3a',
        part: '사무실 가벽',
        caption: '스터드 65mm · 석고 2ply, 수직 수평 정밀',
        tone: 'green',
        pattern: 'panel',
      },
      {
        id: 'wkp-3b',
        part: '붙박이장 설치',
        caption: '탕비실 수납장 4조 현장 조립',
        tone: 'amber',
        pattern: 'plank',
      },
    ],
    createdAt: `${yday}T08:05:00`,
  },
  {
    id: 'wk-4',
    name: '정민재',
    grade: '기공',
    years: 15,
    trades: ['도배·마루'],
    regions: ['서울', '인천'],
    availableFrom: d(0),
    availableDays: 3,
    headline: '도배·마루 15년차, 실크 34평 하루 마감 / 강마루·장판 시공까지 한 팀으로 가능합니다',
    skills: ['실크', '강마루', '장판'],
    tools: ['풀기계', '재단기', '마루 망치'],
    dayRate: 320000,
    rating: 5.0,
    deals: 58,
    verified: true,
    photos: [
      {
        id: 'wkp-4a',
        part: '아파트 실크 도배',
        caption: '34평 거실·방 3칸, 몰딩 탈부착 포함',
        tone: 'amber',
        pattern: 'plank',
      },
      {
        id: 'wkp-4b',
        part: '거실 강마루',
        caption: '30평 강마루 · 걸레받이 재시공',
        tone: 'gray',
        pattern: 'plank',
      },
    ],
    createdAt: `${yday}T07:30:00`,
  },
  {
    id: 'wk-5',
    name: '최윤성',
    grade: '기공',
    years: 10,
    trades: ['전기·설비'],
    regions: ['경기', '서울'],
    availableFrom: d(3),
    availableDays: 14,
    headline: '전기 10년차 기공, 아파트 배선·조명·분전반 교체 / 전기기능사 보유, 경기·서울 출역',
    skills: ['배선', '조명·스위치', '분전반'],
    tools: ['테스터기', '압착공구 세트', '절연저항계'],
    dayRate: 340000,
    rating: 4.7,
    deals: 29,
    verified: true,
    photos: [],
    createdAt: `${yday}T06:55:00`,
  },
];
