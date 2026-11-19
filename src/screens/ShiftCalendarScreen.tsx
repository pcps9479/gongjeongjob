import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, SectionHeader } from '../components/ui';
import { getTrade } from '../data/trades';
import { useApp } from '../store/AppStore';
import { color, font, radius, shadow, space } from '../theme';
import { ShiftEntry, ShiftStatus, TradeKind } from '../types';
import {
  dayTone,
  fullDateKo,
  monthMatrix,
  monthTitle,
  parseISO,
  sameMonth,
  shiftMonth,
  todayISO,
  WEEKDAYS_KO,
} from '../utils/date';
import { comma, shiftAmount, shiftLabel } from '../utils/format';
import { ShiftEntrySheet } from './ShiftEntrySheet';

const STATUS_COLOR: Record<ShiftStatus, { bg: string; fg: string; dot: string }> = {
  예정: { bg: color.blueSoft, fg: color.blue, dot: color.blue },
  확정: { bg: color.accentSoft, fg: color.accentDark, dot: color.accent },
  완료: { bg: color.greenSoft, fg: color.green, dot: color.green },
};

function statusOf(entries: ShiftEntry[]): ShiftStatus {
  if (entries.some((e) => e.status === '완료')) return '완료';
  if (entries.some((e) => e.status === '확정')) return '확정';
  return '예정';
}

export function ShiftCalendarScreen() {
  const { shifts, saveShift, deleteShift, togglePaid, showToast } = useApp();
  const today = todayISO();
  const todayDate = parseISO(today);

  const [cursor, setCursor] = useState({ year: todayDate.getFullYear(), month0: todayDate.getMonth() });
  const [selected, setSelected] = useState(today);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ShiftEntry | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, ShiftEntry[]>();
    shifts.forEach((entry) => {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    });
    return map;
  }, [shifts]);

  const monthEntries = useMemo(
    () => shifts.filter((e) => sameMonth(e.date, cursor.year, cursor.month0)),
    [shifts, cursor],
  );

  const summary = useMemo(() => {
    const totalShift = monthEntries.reduce((sum, e) => sum + e.shift, 0);
    const expected = monthEntries.reduce((sum, e) => sum + shiftAmount(e), 0);
    const confirmed = monthEntries
      .filter((e) => e.status !== '예정')
      .reduce((sum, e) => sum + shiftAmount(e), 0);
    const paid = monthEntries.filter((e) => e.paid).reduce((sum, e) => sum + shiftAmount(e), 0);
    return { totalShift, expected, confirmed, paid, unpaid: expected - paid };
  }, [monthEntries]);

  const weeks = useMemo(() => monthMatrix(cursor.year, cursor.month0), [cursor]);
  const selectedEntries = byDate.get(selected) ?? [];

  const tradeSummary = useMemo(() => {
    const map = new Map<TradeKind, number>();
    monthEntries.forEach((entry) => map.set(entry.trade, (map.get(entry.trade) ?? 0) + entry.shift));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [monthEntries]);

  const moveMonth = (delta: number) => {
    const next = shiftMonth(cursor.year, cursor.month0, delta);
    setCursor(next);
    if (!sameMonth(selected, next.year, next.month0)) {
      setSelected(next.year === todayDate.getFullYear() && next.month0 === todayDate.getMonth()
        ? today
        : `${next.year}-${`${next.month0 + 1}`.padStart(2, '0')}-01`);
    }
  };

  const goToday = () => {
    setCursor({ year: todayDate.getFullYear(), month0: todayDate.getMonth() });
    setSelected(today);
  };

  const openAdd = () => {
    setEditingEntry(null);
    setEditorOpen(true);
  };

  const openEdit = (entry: ShiftEntry) => {
    setEditingEntry(entry);
    setEditorOpen(true);
  };

  const paidRatio = summary.expected > 0 ? summary.paid / summary.expected : 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 월 요약 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>{monthTitle(cursor.year, cursor.month0)} 공수</Text>
              <View style={styles.summaryShiftRow}>
                <Text style={styles.summaryShift}>{summary.totalShift}</Text>
                <Text style={styles.summaryShiftUnit}>공수</Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryRightLabel}>예상 수입</Text>
              <Text style={styles.summaryRightValue}>{comma(summary.expected)}원</Text>
            </View>
          </View>

          <View style={styles.dividerLight} />

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.statLabel}>확정 수입</Text>
              <Text style={styles.statValue}>{comma(summary.confirmed)}원</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.statLabel}>수령 완료</Text>
              <Text style={[styles.statValue, { color: '#7CE3B8' }]}>{comma(summary.paid)}원</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.statLabel}>미수령</Text>
              <Text style={[styles.statValue, summary.unpaid > 0 ? { color: '#FFB59B' } : null]}>
                {comma(summary.unpaid)}원
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.round(paidRatio * 100))}%` }]} />
          </View>
          <Text style={styles.progressCaption}>
            수령률 {Math.round(paidRatio * 100)}% · 미수령 {comma(summary.unpaid)}원
          </Text>

          <View style={styles.tradeRow}>
            {tradeSummary.length === 0 ? (
              <Text style={styles.tradeEmpty}>이번 달 기록된 공정이 없습니다</Text>
            ) : (
              tradeSummary.map(([kind, shiftSum]) => (
                <View key={kind} style={styles.tradePill}>
                  <Ionicons name={getTrade(kind).icon} size={10} color="#D7E1EF" />
                  <Text style={styles.tradePillText}>
                    {kind} {Number.isInteger(shiftSum) ? shiftSum : shiftSum.toFixed(1)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 캘린더 */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={() => moveMonth(-1)} hitSlop={8} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color={color.ink} />
            </Pressable>
            <View style={styles.calendarTitleWrap}>
              <Text style={styles.calendarTitle}>{monthTitle(cursor.year, cursor.month0)}</Text>
              <Pressable onPress={goToday} style={styles.todayBtn}>
                <Text style={styles.todayText}>오늘</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => moveMonth(1)} hitSlop={8} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={color.ink} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS_KO.map((day, index) => (
              <Text
                key={day}
                style={[
                  styles.weekLabel,
                  index === 0 && { color: color.red },
                  index === 6 && { color: color.blue },
                ]}
              >
                {day}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={`w-${wi}`} style={styles.week}>
              {week.map((iso, di) => {
                if (!iso) return <View key={`e-${wi}-${di}`} style={styles.dayCell} />;
                const entries = byDate.get(iso) ?? [];
                const dayShift = entries.reduce((sum, e) => sum + e.shift, 0);
                const isSelected = selected === iso;
                const isToday = iso === today;
                const status = statusOf(entries);
                const tone = dayTone(iso);
                return (
                  <Pressable
                    key={iso}
                    onPress={() => setSelected(iso)}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        tone === 'sun' && { color: color.red },
                        tone === 'sat' && { color: color.blue },
                        isSelected && { color: '#FFFFFF' },
                      ]}
                    >
                      {parseISO(iso).getDate()}
                    </Text>
                    {isToday && !isSelected ? <View style={styles.todayDot} /> : null}
                    {dayShift > 0 ? (
                      <View
                        style={[
                          styles.shiftPill,
                          { backgroundColor: isSelected ? 'rgba(255,255,255,0.22)' : STATUS_COLOR[status].bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.shiftPillText,
                            { color: isSelected ? '#FFFFFF' : STATUS_COLOR[status].fg },
                          ]}
                        >
                          {Number.isInteger(dayShift) ? dayShift : dayShift.toFixed(1)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.shiftPillEmpty} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={styles.legendRow}>
            {(['예정', '확정', '완료'] as ShiftStatus[]).map((item) => (
              <View key={item} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLOR[item].dot }]} />
                <Text style={styles.legendText}>{item}</Text>
              </View>
            ))}
            <Text style={styles.legendHint}>칸 안 숫자 = 공수</Text>
          </View>
        </View>

        {/* 선택 날짜 상세 */}
        <View style={styles.selectedCard}>
          <View style={styles.selectedHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedDate}>{fullDateKo(selected)}</Text>
              <Text style={styles.selectedSub}>
                {selectedEntries.length > 0
                  ? `${selectedEntries.reduce((s, e) => s + e.shift, 0)}공수 · ${comma(
                      selectedEntries.reduce((s, e) => s + shiftAmount(e), 0),
                    )}원`
                  : '기록된 공수가 없습니다'}
              </Text>
            </View>
            <Button label="공수 추가" icon="add" size="sm" onPress={openAdd} />
          </View>

          {selectedEntries.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="cafe-outline" size={22} color={color.muted} />
              <Text style={styles.emptyDayText}>이 날은 비어 있어요. 현장을 추가해 보세요.</Text>
            </View>
          ) : (
            <View style={{ gap: space.x2 }}>
              {selectedEntries.map((entry) => {
                const tone = STATUS_COLOR[entry.status];
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryTop}>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.entrySite} numberOfLines={1}>
                          {entry.siteName}
                        </Text>
                        <View style={styles.entryMetaRow}>
                          <Badge label={entry.trade} tone={getTrade(entry.trade).tone} small />
                          <Badge label={shiftLabel(entry.shift)} tone={entry.status === '완료' ? 'green' : entry.status === '확정' ? 'accent' : 'blue'} small />
                          <Text style={styles.entryMeta}>
                            일당 {comma(entry.dayRate)}원
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.entryAmount}>{comma(shiftAmount(entry))}원</Text>
                    </View>

                    {entry.memo ? <Text style={styles.entryMemo}>{entry.memo}</Text> : null}

                    <View style={styles.entryActions}>
                      <View style={[styles.statusTag, { backgroundColor: tone.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: tone.dot }]} />
                        <Text style={[styles.statusText, { color: tone.fg }]}>{entry.status}</Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          togglePaid(entry.id);
                          showToast(entry.paid ? '미수령으로 바꿨어요.' : '수령 완료로 체크했어요.');
                        }}
                        style={[styles.payToggle, entry.paid && styles.payToggleOn]}
                      >
                        <Ionicons
                          name={entry.paid ? 'checkmark-circle' : 'ellipse-outline'}
                          size={13}
                          color={entry.paid ? color.green : color.muted}
                        />
                        <Text style={[styles.payToggleText, entry.paid && { color: color.green }]}>
                          {entry.paid ? '임금 수령' : '미수령'}
                        </Text>
                      </Pressable>

                      <View style={{ flex: 1 }} />

                      <Pressable onPress={() => openEdit(entry)} hitSlop={6} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={15} color={color.inkSoft} />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          deleteShift(entry.id);
                          showToast('공수를 삭제했어요.');
                        }}
                        hitSlop={6}
                        style={styles.iconBtn}
                      >
                        <Ionicons name="trash-outline" size={15} color={color.red} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.tipCard}>
          <SectionHeader title="공수 정산 팁" caption="이번 달 기준으로 자동 계산됩니다" />
          <View style={styles.tipRow}>
            <Ionicons name="calculator-outline" size={14} color={color.inkSoft} />
            <Text style={styles.tipText}>
              총 {summary.totalShift}공수 × 일당 기준 예상 수입 {comma(summary.expected)}원 · 확정 {comma(summary.confirmed)}원
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="alert-circle-outline" size={14} color={color.amber} />
            <Text style={styles.tipText}>
              미수령 {comma(summary.unpaid)}원은 현장별로 '임금 수령' 체크를 눌러 정리하세요.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ShiftEntrySheet
        visible={editorOpen}
        date={selected}
        entry={editingEntry}
        onClose={() => setEditorOpen(false)}
        onSave={(entry) => {
          saveShift(entry);
          showToast(editingEntry ? '공수를 수정했어요.' : '공수를 추가했어요.');
        }}
        onDelete={(id) => {
          deleteShift(id);
          showToast('공수를 삭제했어요.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.x4, paddingBottom: 130, gap: space.x3 },

  summaryCard: {
    backgroundColor: color.brand,
    borderRadius: radius.lg,
    padding: space.x4,
    gap: 10,
    marginTop: space.x1,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#B9C6DA' },
  summaryShiftRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  summaryShift: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.2 },
  summaryShiftUnit: { fontSize: 15, fontWeight: '700', color: '#D7E1EF' },
  summaryRight: { alignItems: 'flex-end', gap: 3 },
  summaryRightLabel: { fontSize: 11, fontWeight: '700', color: '#B9C6DA' },
  summaryRightValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  summaryStats: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { flex: 1, gap: 3 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },
  statLabel: { fontSize: 10.5, fontWeight: '700', color: '#9FB0C7' },
  statValue: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: '#4ADE9E' },
  progressCaption: { fontSize: 10.5, fontWeight: '600', color: '#9FB0C7' },
  tradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  tradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tradePillText: { fontSize: 10, fontWeight: '800', color: '#E4ECF8' },
  tradeEmpty: { fontSize: 10, fontWeight: '600', color: '#9FB0C7' },

  calendarCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x3,
    ...shadow.card,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  calendarTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarTitle: { ...font.h3, color: color.ink },
  todayBtn: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  todayText: { fontSize: 10.5, fontWeight: '700', color: color.inkSoft },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginTop: 10, marginBottom: 4 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: color.muted,
    paddingVertical: 4,
  },
  week: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    paddingTop: 6,
    margin: 2,
    borderRadius: radius.sm,
  },
  dayCellSelected: { backgroundColor: color.brand },
  dayNum: { fontSize: 12.5, fontWeight: '700', color: color.ink },
  todayDot: {
    position: 'absolute',
    top: 3,
    right: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.accent,
  },
  shiftPill: {
    marginTop: 3,
    minWidth: 22,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    alignItems: 'center',
  },
  shiftPillText: { fontSize: 9.5, fontWeight: '800' },
  shiftPillEmpty: { height: 15, marginTop: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: color.line },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10.5, fontWeight: '700', color: color.inkSoft },
  legendHint: { flex: 1, textAlign: 'right', fontSize: 10, color: color.muted, fontWeight: '500' },

  selectedCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    gap: space.x3,
  },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedDate: { ...font.h3, color: color.ink },
  selectedSub: { ...font.tiny, color: color.muted, fontWeight: '600', marginTop: 2 },
  emptyDay: { alignItems: 'center', gap: 6, paddingVertical: 18 },
  emptyDayText: { ...font.small, color: color.muted, fontWeight: '600' },

  entryCard: {
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 7,
    borderWidth: 1,
    borderColor: color.line,
  },
  entryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  entrySite: { fontSize: 14, fontWeight: '800', color: color.ink },
  entryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  entryMeta: { fontSize: 11, color: color.muted, fontWeight: '600' },
  entryAmount: { fontSize: 14, fontWeight: '800', color: color.ink, letterSpacing: -0.3 },
  entryMemo: { fontSize: 11.5, color: color.inkSoft, fontWeight: '500', lineHeight: 17 },
  entryActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  payToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: color.lineStrong,
    backgroundColor: color.surface,
  },
  payToggleOn: { borderColor: '#BFEBDC', backgroundColor: color.greenSoft },
  payToggleText: { fontSize: 10.5, fontWeight: '700', color: color.muted },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    gap: 7,
  },
  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: color.inkSoft, fontWeight: '600' },
});
