export type TradeRole = '기공' | '준기공' | '조공';

export type Region = '서울' | '경기' | '인천' | '부산' | '대전' | '대구' | '광주' | '울산' | '세종' | '강원' | '충북' | '충남' | '전북' | '전남' | '경북' | '경남' | '제주';

/** 인테리어 공정 */
export type TradeKind = '타일' | '목공' | '철거' | '도배·마루' | '필름' | '전기·설비';

/** 피드 상단 공정 탭 (전체 포함) */
export type TradeFilter = '전체' | TradeKind;

export type WorkType =
  // 타일
  | '화장실'
  | '바닥·벽'
  | '포세린·대형'
  | '졸리컷'
  | '현관·베란다'
  // 목공
  | '몰딩'
  | '걸레받이'
  | '가벽·천장'
  | '도어·중문'
  | '가구·붙박이'
  // 철거
  | '전체 철거'
  | '부분 철거'
  | '화장실 철거'
  | '마루·장판 철거'
  | '폐기물 반출'
  // 도배·마루
  | '실크'
  | '합지'
  | '강마루'
  | '원목마루'
  | '장판'
  // 필름
  | '문·문틀'
  | '싱크대'
  | '샷시'
  | '현관문'
  | '상업공간'
  // 전기·설비
  | '배선'
  | '조명·스위치'
  | '분전반'
  | '배관'
  | '방수·위생기구';

export type PayType = '일당' | '도급';

/** 도급 단가 기준 */
export type PayUnit = '㎡' | '평' | '톤' | '롤' | '면' | '세트' | '개소' | '건';

export type ShiftStatus = '예정' | '확정' | '완료';

export interface RoleNeed {
  role: TradeRole;
  count: number;
}

export interface SiteConditions {
  /** 자재·부자재 현장 구비 */
  materials: boolean;
  /** 양중(자재 운반) 있음 */
  hoisting: boolean;
  /** 주차 가능 */
  parking: boolean;
  /** 식사 제공 */
  meal: boolean;
  /** 당일 지급 */
  sameDayPay: boolean;
}

export interface JobPost {
  id: string;
  title: string;
  /** 모집 공정 */
  trade: TradeKind;
  region: Region;
  district: string;
  /** YYYY-MM-DD */
  date: string;
  startTime: string;
  payType: PayType;
  /** 일당: 원/일, 도급: 원/payUnit */
  payAmount: number;
  /** 도급 단가 기준 (㎡·평·톤·롤·면·세트·개소·건) */
  payUnit?: PayUnit;
  roles: RoleNeed[];
  /** 타일 규격·목재·도배지 등 자재/규격 */
  tileSpec: string;
  workTypes: WorkType[];
  /** 도급일 때 시공 면적(㎡·평·톤 등 payUnit 기준) */
  area?: number;
  conditions: SiteConditions;
  /** 공정별 추가 현장 조건 키 (타카·콤프, 폐기물 처리 등) */
  siteChecks?: string[];
  memo: string;
  contractor: string;
  contractorVerified: boolean;
  contractorRating: number;
  contractorDeals: number;
  createdAt: string;
  isMine?: boolean;
}

export interface ShiftEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  siteName: string;
  /** 출역한 공정 */
  trade: TradeKind;
  /** 공수 (0.5 단위) */
  shift: number;
  /** 일당 */
  dayRate: number;
  status: ShiftStatus;
  paid: boolean;
  memo?: string;
}

export interface TechnicianProfile {
  name: string;
  handle: string;
  grade: TradeRole;
  years: number;
  regions: string[];
  /** 주력 공정 (복수) */
  trades: TradeKind[];
  skills: WorkType[];
  /** 대표 보유 공구 (타일 기준) */
  tools: string[];
  /** 공정별 보유 공구 */
  tradeTools: Partial<Record<TradeKind, string[]>>;
  bio: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  trade: TradeKind;
  /** 카드 배경 톤 */
  tone: 'navy' | 'accent' | 'gray' | 'green' | 'purple';
  workTypes: WorkType[];
  tileSpec: string;
  area: number;
  /** 면적 단위 (㎡ 기본) */
  areaUnit?: '㎡' | '평' | '개소';
  date: string;
  contractor: string;
}

export interface ReviewItem {
  id: string;
  contractor: string;
  site: string;
  trade: TradeKind;
  rating: number;
  date: string;
  text: string;
}

export type TabKey = 'jobs' | 'post' | 'calendar' | 'profile';

/** 피드 상단 전환: 현장 공고 / 기술자 구직 자기소개 */
export type FeedMode = 'jobs' | 'workers';

/* ───────────── 기술자 구직 자기소개 ───────────── */

/** 시공 사진 샘플 톤 */
export type PhotoTone = 'navy' | 'accent' | 'gray' | 'green' | 'purple' | 'blue' | 'amber';

/** 시공 사진 샘플 패턴 (타일 격자·판재·패널·모자이크) */
export type PhotoPattern = 'tile' | 'plank' | 'panel' | 'mosaic';

export interface WorkerPhoto {
  id: string;
  /** 시공 부위 (예: 욕실 벽체) */
  part: string;
  /** 한 줄 설명 */
  caption: string;
  tone: PhotoTone;
  pattern: PhotoPattern;
}

/** 기술자가 올리는 구직 자기소개 */
export interface WorkerIntro {
  id: string;
  name: string;
  /** 실명 대신 마스킹 표기 (섭외 확정 후 공개) */
  masked?: boolean;
  grade: TradeRole;
  years: number;
  /** 주력 공정 (첫 항목이 대표 공정) */
  trades: TradeKind[];
  regions: string[];
  /** 출역 가능 시작일 YYYY-MM-DD */
  availableFrom: string;
  /** 출역 가능 기간(일) */
  availableDays: number;
  /** 한 줄 자기소개 */
  headline: string;
  skills: WorkType[];
  tools: string[];
  /** 희망 일당 (없으면 협의) */
  dayRate?: number;
  rating: number;
  deals: number;
  /** 이력 인증 */
  verified: boolean;
  photos: WorkerPhoto[];
  createdAt: string;
  isMine?: boolean;
}

/* ───────────── 회원가입 · 계정 ───────────── */

/** 앱을 쓰는 역할 */
export type UserRole = 'technician' | 'contractor';

/** 간편 로그인 수단 */
export type AuthProvider = 'kakao' | 'naver' | 'apple' | 'phone';

export interface UserAccount {
  id: string;
  role: UserRole;
  name: string;
  handle: string;
  phone: string;
  provider: AuthProvider;
  /** 휴대폰 본인인증 완료 */
  phoneVerified: boolean;
  /** 기술자: 주력 공정 */
  trades: TradeKind[];
  /** 기술자: 경력 연차 */
  years?: number;
  /** 활동 지역 */
  regions: string[];
  /** 발주처: 업체명 */
  businessName?: string;
  /** 발주처: 사업자등록번호 */
  businessNumber?: string;
  /** 발주처: 사업자 인증 완료 */
  businessVerified?: boolean;
  agreedTerms: boolean;
  agreedPrivacy: boolean;
  agreedLocation: boolean;
  /** ISO datetime */
  createdAt: string;
}

/* ───────────── 알림 ───────────── */

export type NotificationKind = 'match' | 'contact' | 'nearby' | 'settlement' | 'report' | 'notice';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO datetime 'YYYY-MM-DDTHH:MM:SS' */
  at: string;
  read: boolean;
  /** 연결된 공고 (알림을 누르면 공고 상세로 이동) */
  jobId?: string;
}

/* ───────────── 신고 · 안전센터 ───────────── */

export type ReportTarget = 'contractor' | 'worker';

export type ReportReason = '노쇼' | '임금체불' | '허위공고';

export interface ReportItem {
  id: string;
  /** 접수번호 R-YYYYMMDD-XXXX */
  receiptNo: string;
  target: ReportTarget;
  targetName: string;
  jobId?: string;
  jobTitle?: string;
  reason: ReportReason;
  detail: string;
  /** ISO datetime */
  createdAt: string;
  status: '접수' | '확인 중';
}
