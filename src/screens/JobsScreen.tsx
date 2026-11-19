import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { JobCard } from '../components/JobCard';
import { TradeSwitcher } from '../components/TradeSwitcher';
import { Badge, Button, Chip } from '../components/ui';
import { getTrade, TRADES } from '../data/trades';
import { useApp } from '../store/AppStore';
import { color, font, radius, space } from '../theme';
import { Region, TradeFilter, TradeRole, WorkType } from '../types';
import { todayISO } from '../utils/date';
import { expectedDayPay, rolesLabel } from '../utils/format';
import { JobDetailSheet } from './JobDetailSheet';
import { ReportSheet } from './ReportSheet';

const REGIONS: (Region | '전체')[] = ['전체', '서울', '경기', '인천', '부산', '대전', '대구', '광주', '울산'];
const ROLES: (TradeRole | '전체')[] = ['전체', '기공', '준기공', '조공'];
const ALL_WORK_TYPES: WorkType[] = TRADES.flatMap((trade) => trade.workTypes);

type SortKey = 'recent' | 'pay';

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={{ flex: 1, width: 0 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function JobsScreen({
  focusJobId,
  onFocusHandled,
}: {
  focusJobId?: string | null;
  onFocusHandled?: () => void;
}) {
  const { jobs, appliedIds, isApplied, toggleApply, showToast, feedTrade, setFeedTrade, guest } = useApp();
  const today = todayISO();

  const [region, setRegion] = useState<Region | '전체'>('전체');
  const [role, setRole] = useState<TradeRole | '전체'>('전체');
  const [workType, setWorkType] = useState<WorkType | '전체'>('전체');
  const [sort, setSort] = useState<SortKey>('recent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // 알림함에서 넘어온 공고를 바로 열기
  useEffect(() => {
    if (!focusJobId) return;
    if (jobs.some((job) => job.id === focusJobId)) setSelectedId(focusJobId);
    onFocusHandled?.();
  }, [focusJobId, jobs, onFocusHandled]);

  const tradeCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: jobs.length };
    TRADES.forEach((trade) => {
      counts[trade.key] = jobs.filter((job) => job.trade === trade.key).length;
    });
    return counts;
  }, [jobs]);

  const tradeJobs = useMemo(
    () => (feedTrade === '전체' ? jobs : jobs.filter((job) => job.trade === feedTrade)),
    [jobs, feedTrade],
  );

  const workTypeOptions = useMemo<(WorkType | '전체')[]>(
    () => ['전체', ...(feedTrade === '전체' ? ALL_WORK_TYPES : getTrade(feedTrade).workTypes)],
    [feedTrade],
  );

  const filtered = useMemo(() => {
    const list = tradeJobs.filter((job) => {
      if (region !== '전체' && job.region !== region) return false;
      if (role !== '전체' && !job.roles.some((r) => r.role === role && r.count > 0)) return false;
      if (workType !== '전체' && !job.workTypes.includes(workType)) return false;
      return true;
    });
    return list.sort((a, b) =>
      sort === 'pay' ? expectedDayPay(b) - expectedDayPay(a) : b.createdAt.localeCompare(a.createdAt),
    );
  }, [tradeJobs, region, role, workType, sort]);

  const selected = useMemo(() => jobs.find((j) => j.id === selectedId) ?? null, [jobs, selectedId]);
  const hasFilter = region !== '전체' || role !== '전체' || workType !== '전체';
  const activeTrade = feedTrade === '전체' ? null : getTrade(feedTrade);

  const resetFilters = () => {
    setRegion('전체');
    setRole('전체');
    setWorkType('전체');
  };

  const changeTrade = (next: TradeFilter) => {
    setFeedTrade(next);
    setWorkType('전체');
  };

  const handleApply = () => {
    if (!selected) return;
    if (guest) {
      showToast('둘러보기 중에는 지원할 수 없어요. 로그인 후 이용해 주세요.');
      return;
    }
    const next = toggleApply(selected.id);
    showToast(next ? '지원했어요. 발주처 확정 시 연락처가 열립니다.' : '지원을 취소했어요.');
  };

  const urgentCount = tradeJobs.filter((j) => {
    const diff = (new Date(`${j.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000;
    return diff <= 1;
  }).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TradeSwitcher value={feedTrade} onChange={changeTrade} counts={tradeCounts} />

        <View style={styles.hero}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.heroTitle}>
              {activeTrade ? `${activeTrade.key} 현장 구인` : '오늘 바로 들어갈 현장'}
            </Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              공고 {filtered.length}건 · 오늘·내일 현장 {urgentCount}건
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color={color.green} />
            <Text style={styles.heroBadgeText}>안심 매칭</Text>
          </View>
        </View>

        {activeTrade ? (
          <View style={styles.tradeStrip}>
            <View style={[styles.tradeStripIcon, { backgroundColor: color.brand }]}>
              <Ionicons name={activeTrade.icon} size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.tradeStripText} numberOfLines={2}>
              <Text style={{ fontWeight: '800', color: color.ink }}>{activeTrade.key}</Text>
              {'  '}
              {activeTrade.tagline}
              {'\n'}단가 {activeTrade.payOptions.map((option) => option.label).join(' · ')}
            </Text>
          </View>
        ) : null}

        <View style={styles.filterCard}>
          <FilterRow label="지역">
            {REGIONS.map((item) => (
              <Chip key={item} label={item} active={region === item} onPress={() => setRegion(item)} />
            ))}
          </FilterRow>
          <FilterRow label="직급">
            {ROLES.map((item) => (
              <Chip key={item} label={item} active={role === item} onPress={() => setRole(item)} />
            ))}
          </FilterRow>
          <FilterRow label="시공">
            {workTypeOptions.map((item) => (
              <Chip key={item} label={item} active={workType === item} onPress={() => setWorkType(item)} />
            ))}
          </FilterRow>
        </View>

        <View style={styles.listHeader}>
          <View style={styles.listHeaderLeft}>
            <Text style={styles.listCount}>
              {feedTrade === '전체' ? '전체' : feedTrade} 공고{' '}
              <Text style={{ color: color.accent }}>{filtered.length}</Text>건
            </Text>
            {hasFilter ? (
              <Pressable onPress={resetFilters} hitSlop={6} style={styles.resetBtn}>
                <Ionicons name="refresh" size={11} color={color.inkSoft} />
                <Text style={styles.resetText}>필터 초기화</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSort(sort === 'recent' ? 'pay' : 'recent')}
            style={({ pressed }) => [styles.sortBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name={sort === 'recent' ? 'time-outline' : 'trending-up'} size={13} color={color.ink} />
            <Text style={styles.sortText}>{sort === 'recent' ? '최신순' : '급여 높은순'}</Text>
            <Ionicons name="swap-vertical" size={12} color={color.muted} />
          </Pressable>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={26} color={color.muted} />
            </View>
            <Text style={styles.emptyTitle}>조건에 맞는 공고가 없어요</Text>
            <Text style={styles.emptyText}>
              {feedTrade === '전체'
                ? <>지역이나 직급 필터를 넓혀보면 더 많은 현장이 보입니다. 임박 현장 {urgentCount}건.</>
                : <>{feedTrade} 공고가 아직 없습니다. 다른 공정을 골라보거나 필터를 넓혀보세요.</>}
            </Text>
            <Button label="필터 초기화" variant="outline" size="sm" onPress={resetFilters} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applied={isApplied(job.id)}
                today={today}
                onPress={() => setSelectedId(job.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="information-circle" size={15} color={color.blue} />
            <Text style={styles.noticeTitle}>지원 현황</Text>
          </View>
          <Text style={styles.noticeText}>
            지원한 공고 {appliedIds.length}건 · 발주처 확정 전에는 연락처가 서로에게 노출되지 않습니다.
          </Text>
          {appliedIds.length > 0 ? (
            <View style={styles.appliedList}>
              {jobs
                .filter((j) => appliedIds.includes(j.id))
                .slice(0, 3)
                .map((j) => (
                  <Pressable key={j.id} onPress={() => setSelectedId(j.id)} style={styles.appliedRow}>
                    <View style={styles.appliedDot} />
                    <Text style={styles.appliedTitle} numberOfLines={1}>
                      {j.title}
                    </Text>
                    <Badge label={j.trade} tone={getTrade(j.trade).tone} small />
                    <Badge label={rolesLabel(j.roles)} tone="gray" small />
                    <Ionicons name="chevron-forward" size={13} color={color.muted} />
                  </Pressable>
                ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <JobDetailSheet
        job={selected}
        applied={selected ? isApplied(selected.id) : false}
        onClose={() => setSelectedId(null)}
        onToggleApply={handleApply}
        onReport={() => setReportOpen(true)}
      />

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        job={selected}
        defaultTarget="contractor"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.x4, paddingBottom: 120, gap: space.x3 },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
    marginTop: space.x1,
  },
  heroTitle: { ...font.h3, color: color.ink, fontSize: 15 },
  heroSub: { ...font.small, color: color.inkSoft, fontWeight: '600', lineHeight: 17 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: color.greenSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: color.green },

  tradeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.x3,
    paddingVertical: 8,
  },
  tradeStripIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeStripText: { flex: 1, fontSize: 11, lineHeight: 16, color: color.inkSoft, fontWeight: '600' },

  filterCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: space.x3,
    paddingLeft: space.x3,
    gap: 8,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: { width: 30, fontSize: 11.5, fontWeight: '800', color: color.muted },
  chipRow: { gap: 6, paddingRight: space.x3 },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listCount: { fontSize: 13.5, fontWeight: '700', color: color.inkSoft },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetText: { fontSize: 10.5, fontWeight: '700', color: color.inkSoft },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  sortText: { fontSize: 11.5, fontWeight: '700', color: color.ink },

  list: { gap: space.x3 },

  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 40,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { ...font.h3, color: color.ink },
  emptyText: { ...font.small, color: color.muted, textAlign: 'center', paddingHorizontal: 32 },

  noticeCard: {
    backgroundColor: color.blueSoft,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 6,
    borderWidth: 1,
    borderColor: '#D3E0FF',
  },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  noticeTitle: { fontSize: 12.5, fontWeight: '800', color: color.blue },
  noticeText: { fontSize: 11.5, lineHeight: 17, color: '#2B4C9B', fontWeight: '600' },
  appliedList: { gap: 4, marginTop: 2 },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  appliedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.green },
  appliedTitle: { flex: 1, fontSize: 11.5, fontWeight: '700', color: color.ink },
});
