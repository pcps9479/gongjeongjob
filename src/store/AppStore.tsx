import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { normalizeTrade } from '../data/trades';
import { buildSeedNotifications } from '../data/notifications';
import { seedJobs, seedProfile, seedShifts } from '../data/seed';
import {
  AppNotification,
  JobPost,
  ReportItem,
  ReportReason,
  ReportTarget,
  ShiftEntry,
  TechnicianProfile,
  TradeFilter,
  UserAccount,
} from '../types';
import { nowStamp, todayISO } from '../utils/date';

const STORAGE_KEY = 'gongjeongjob.state.v3';
const LEGACY_KEYS = ['gongjeongjob.state.v2', 'tilejob.state.v1'];

interface PersistShape {
  myJobs: JobPost[];
  appliedIds: string[];
  shifts: ShiftEntry[];
  profile: TechnicianProfile;
  account: UserAccount | null;
  lastAccount: UserAccount | null;
  guest: boolean;
  notifications: AppNotification[];
  reports: ReportItem[];
}

export interface ReportInput {
  target: ReportTarget;
  targetName: string;
  reason: ReportReason;
  detail: string;
  jobId?: string;
  jobTitle?: string;
}

interface AppContextValue extends PersistShape {
  ready: boolean;
  jobs: JobPost[];
  feedTrade: TradeFilter;
  setFeedTrade: (trade: TradeFilter) => void;
  unreadCount: number;
  isApplied: (jobId: string) => boolean;
  /** 지원/취소 토글 후 새 상태(true=지원함) 반환 */
  toggleApply: (jobId: string) => boolean;
  addJob: (job: JobPost) => void;
  saveShift: (entry: ShiftEntry) => void;
  deleteShift: (id: string) => void;
  togglePaid: (id: string) => void;
  updateProfile: (patch: Partial<TechnicianProfile>) => void;
  resetDemo: () => void;
  /** 로그인 · 회원가입 완료 */
  signIn: (account: UserAccount) => void;
  /** 로그아웃 (최근 계정은 남겨 재로그인 가능) */
  signOut: () => void;
  /** 로그인 없이 둘러보기 */
  continueAsGuest: () => void;
  /** 둘러보기 종료 → 로그인 화면 */
  exitGuest: () => void;
  updateAccount: (patch: Partial<UserAccount>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  submitReport: (input: ReportInput) => ReportItem;
  toast: string | null;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** 이전 버전(타일잡) 저장 데이터에 공정 필드를 채워 넣는다 */
function normalizeJob(job: JobPost): JobPost {
  return {
    ...job,
    trade: normalizeTrade(job.trade),
    payUnit: job.payType === '도급' ? (job.payUnit ?? '㎡') : undefined,
    siteChecks: job.siteChecks ?? [],
  };
}

function normalizeShift(entry: ShiftEntry): ShiftEntry {
  return { ...entry, trade: normalizeTrade(entry.trade) };
}

function normalizeProfile(profile: TechnicianProfile): TechnicianProfile {
  const trades = Array.isArray(profile.trades) && profile.trades.length
    ? profile.trades.map((trade) => normalizeTrade(trade))
    : (['타일'] as TechnicianProfile['trades']);
  return {
    ...seedProfile,
    ...profile,
    trades,
    tradeTools: profile.tradeTools ?? { 타일: profile.tools ?? seedProfile.tools },
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [myJobs, setMyJobs] = useState<JobPost[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [shifts, setShifts] = useState<ShiftEntry[]>(seedShifts);
  const [profile, setProfile] = useState<TechnicianProfile>(seedProfile);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [lastAccount, setLastAccount] = useState<UserAccount | null>(null);
  const [guest, setGuest] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [feedTrade, setFeedTrade] = useState<TradeFilter>('전체');
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(STORAGE_KEY);
        for (const key of LEGACY_KEYS) {
          if (raw) break;
          raw = await AsyncStorage.getItem(key);
        }
        if (raw && mounted) {
          const saved = JSON.parse(raw) as Partial<PersistShape>;
          if (Array.isArray(saved.myJobs)) setMyJobs(saved.myJobs.map(normalizeJob));
          if (Array.isArray(saved.appliedIds)) setAppliedIds(saved.appliedIds);
          if (Array.isArray(saved.shifts) && saved.shifts.length) {
            setShifts(saved.shifts.map(normalizeShift));
          }
          if (saved.profile) setProfile(normalizeProfile(saved.profile));
          if (saved.account) setAccount(saved.account);
          if (saved.lastAccount) setLastAccount(saved.lastAccount);
          if (saved.guest) setGuest(true);
          if (Array.isArray(saved.notifications)) setNotifications(saved.notifications);
          if (Array.isArray(saved.reports)) setReports(saved.reports);
        }
      } catch {
        // 저장소를 쓸 수 없는 환경(웹 시크릿 모드 등)에서는 메모리 상태만 사용
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const payload: PersistShape = {
      myJobs,
      appliedIds,
      shifts,
      profile,
      account,
      lastAccount,
      guest,
      notifications,
      reports,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch(() => undefined);
  }, [ready, myJobs, appliedIds, shifts, profile, account, lastAccount, guest, notifications, reports]);

  const jobs = useMemo(() => [...myJobs, ...seedJobs], [myJobs]);

  const isApplied = useCallback((jobId: string) => appliedIds.includes(jobId), [appliedIds]);

  const toggleApply = useCallback((jobId: string) => {
    let next = false;
    setAppliedIds((prev) => {
      next = !prev.includes(jobId);
      return next ? [...prev, jobId] : prev.filter((id) => id !== jobId);
    });
    return next;
  }, []);

  const addJob = useCallback((job: JobPost) => {
    setMyJobs((prev) => [job, ...prev]);
  }, []);

  const saveShift = useCallback((entry: ShiftEntry) => {
    setShifts((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry];
    });
  }, []);

  const deleteShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const togglePaid = useCallback((id: string) => {
    setShifts((prev) => prev.map((e) => (e.id === id ? { ...e, paid: !e.paid } : e)));
  }, []);

  const updateProfile = useCallback((patch: Partial<TechnicianProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const signIn = useCallback((next: UserAccount) => {
    setAccount(next);
    setLastAccount(next);
    setGuest(false);
    setNotifications(buildSeedNotifications(next.role));
    if (next.role === 'technician') {
      setProfile((prev) => ({
        ...prev,
        name: next.name || prev.name,
        handle: next.handle || prev.handle,
        trades: next.trades.length ? next.trades : prev.trades,
        years: next.years ?? prev.years,
        regions: next.regions.length ? next.regions : prev.regions,
      }));
    }
  }, []);

  const signOut = useCallback(() => {
    setAccount(null);
    setGuest(false);
    setNotifications([]);
  }, []);

  const continueAsGuest = useCallback(() => {
    setAccount(null);
    setGuest(true);
    setNotifications([]);
  }, []);

  const exitGuest = useCallback(() => {
    setGuest(false);
  }, []);

  const updateAccount = useCallback((patch: Partial<UserAccount>) => {
    setAccount((prev) => (prev ? { ...prev, ...patch } : prev));
    setLastAccount((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const submitReport = useCallback((input: ReportInput) => {
    const stamp = nowStamp();
    const dateKey = todayISO().replace(/-/g, '');
    const receiptNo = `R-${dateKey}-${Math.floor(1000 + Math.random() * 9000)}`;
    const item: ReportItem = {
      id: newId('rpt'),
      receiptNo,
      target: input.target,
      targetName: input.targetName,
      jobId: input.jobId,
      jobTitle: input.jobTitle,
      reason: input.reason,
      detail: input.detail.trim(),
      createdAt: stamp,
      status: '접수',
    };
    setReports((prev) => [item, ...prev]);
    return item;
  }, []);

  const resetDemo = useCallback(() => {
    setMyJobs([]);
    setAppliedIds([]);
    setShifts(seedShifts);
    setProfile(seedProfile);
    setFeedTrade('전체');
    setReports([]);
    setNotifications(account ? buildSeedNotifications(account.role) : []);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    for (const key of LEGACY_KEYS) AsyncStorage.removeItem(key).catch(() => undefined);
  }, [account]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      jobs,
      myJobs,
      appliedIds,
      shifts,
      profile,
      account,
      lastAccount,
      guest,
      notifications,
      reports,
      unreadCount,
      feedTrade,
      setFeedTrade,
      isApplied,
      toggleApply,
      addJob,
      saveShift,
      deleteShift,
      togglePaid,
      updateProfile,
      resetDemo,
      signIn,
      signOut,
      continueAsGuest,
      exitGuest,
      updateAccount,
      markNotificationRead,
      markAllNotificationsRead,
      submitReport,
      toast,
      showToast,
    }),
    [
      ready,
      jobs,
      myJobs,
      appliedIds,
      shifts,
      profile,
      account,
      lastAccount,
      guest,
      notifications,
      reports,
      unreadCount,
      feedTrade,
      isApplied,
      toggleApply,
      addJob,
      saveShift,
      deleteShift,
      togglePaid,
      updateProfile,
      resetDemo,
      signIn,
      signOut,
      continueAsGuest,
      exitGuest,
      updateAccount,
      markNotificationRead,
      markAllNotificationsRead,
      submitReport,
      toast,
      showToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
