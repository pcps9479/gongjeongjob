import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { SitePhoto } from '../components/SitePhoto';
import { Badge, Button, Chip, FieldLabel, Stepper } from '../components/ui';
import { getTrade, TRADE_KEYS } from '../data/trades';
import { TRADE_TOOLS } from '../data/workerIntros';
import { useApp } from '../store/AppStore';
import { color, radius, space } from '../theme';
import { Region, TradeKind, TradeRole, WorkerIntro } from '../types';
import { comma, maskName } from '../utils/format';
import { todayISO } from '../utils/date';
import {
  DEFAULT_URGENT_CONDITIONS,
  demoPhone,
  matchUrgentWorkers,
  MIN_YEARS_OPTIONS,
  UrgentMatchConditions,
  urgentPool,
} from '../utils/matching';

const REGIONS: (Region | '전체')[] = ['전체', '서울', '경기', '인천', '부산', '대전', '대구', '광주', '울산'];
const ROLES: (TradeRole | '전체')[] = ['전체', '기공', '준기공', '조공'];

type Phase = 'idle' | 'sending' | 'accepted' | 'confirmed';

function SwitchRow({
  label,
  caption,
  value,
  onToggle,
  accessibilityLabel,
}: {
  label: string;
  caption?: string;
  value: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.switchRow, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        {caption ? <Text style={styles.switchCaption}>{caption}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <FieldLabel label={title} hint={caption} />
      {children}
    </View>
  );
}

export function UrgentMatchSheet({
  visible,
  onClose,
  defaultTrade,
}: {
  visible: boolean;
  onClose: () => void;
  defaultTrade?: TradeKind;
}) {
  const { workerIntros, guest, addNotification, showToast } = useApp();
  const today = todayISO();

  const [conditions, setConditions] = useState<UrgentMatchConditions>({
    ...DEFAULT_URGENT_CONDITIONS,
    trade: defaultTrade ?? '타일',
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [accepted, setAccepted] = useState<WorkerIntro | null>(null);

  const wasVisible = useRef(visible);
  useEffect(() => {
    if (visible && !wasVisible.current) {
      setConditions({ ...DEFAULT_URGENT_CONDITIONS, trade: defaultTrade ?? '타일' });
      setPhase('idle');
      setAccepted(null);
    }
    wasVisible.current = visible;
  }, [visible, defaultTrade]);

  const pool = useMemo(() => urgentPool(workerIntros, today), [workerIntros, today]);
  const matched = useMemo(
    () => matchUrgentWorkers(workerIntros, conditions, today),
    [workerIntros, conditions, today],
  );

  // 선착순 수락 시뮬레이션: 알림을 보낸 뒤 1명이 먼저 수락한다
  useEffect(() => {
    if (phase !== 'sending' || !accepted) return;
    const timer = setTimeout(() => {
      setPhase('accepted');
      addNotification({
        kind: 'match',
        title: `긴급 매칭 수락 · ${conditions.trade}`,
        body: `${accepted.name} ${accepted.grade}(경력 ${accepted.years}년)님이 오늘·내일 긴급 출역을 수락했습니다. 연락처가 공개되었습니다.`,
      });
    }, 1600);
    return () => clearTimeout(timer);
  }, [phase, accepted, addNotification, conditions.trade]);

  const patch = (next: Partial<UrgentMatchConditions>) => setConditions((prev) => ({ ...prev, ...next }));

  const changeTrade = (trade: TradeKind) => {
    // 필수 시공 스킬은 공정에 맞춰 자동 전환 — 이전 공정의 스킬은 지운다
    setConditions((prev) => ({ ...prev, trade, skills: [] }));
  };

  const toggleSkill = (skill: UrgentMatchConditions['skills'][number]) => {
    setConditions((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((item) => item !== skill)
        : [...prev.skills, skill],
    }));
  };

  const send = () => {
    if (guest) {
      showToast('둘러보기 중에는 긴급 매칭 알림을 보낼 수 없어요. 로그인 후 이용해 주세요.');
      return;
    }
    if (!matched.length) {
      showToast('조건에 맞는 기술자가 없어요. 조건을 조금 넓혀보세요.');
      return;
    }
    setAccepted(matched[0] ?? null);
    setPhase('sending');
  };

  const confirm = () => {
    setPhase('confirmed');
    showToast('매칭을 확정했어요. 성사 시에만 수수료가 청구됩니다.');
  };

  const restart = () => {
    setPhase('idle');
    setAccepted(null);
  };

  const skillOptions = getTrade(conditions.trade).workTypes;
  const tradeConfig = getTrade(conditions.trade);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="⚡ 긴급 펑크 자동 매칭"
      subtitle="현장에 사람이 빠졌을 때, 조건을 고르면 지금 출역 가능한 기술자에게 바로 알림이 갑니다."
      footer={
        phase === 'idle' ? (
          <Button
            label={
              matched.length
                ? `조건 맞는 ${matched.length}명에게 매칭 알림 보내기`
                : '조건에 맞는 기술자가 없어요'
            }
            icon="notifications"
            size="lg"
            disabled={matched.length === 0}
            onPress={send}
          />
        ) : phase === 'sending' ? (
          <Button label="알림 보내는 중…" loading size="lg" />
        ) : phase === 'accepted' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="다시 매칭" variant="outline" size="lg" onPress={restart} style={{ flex: 1 }} />
            <Button label="매칭 확정" icon="checkmark" size="lg" onPress={confirm} style={{ flex: 1.4 }} />
          </View>
        ) : (
          <Button label="닫기" size="lg" onPress={onClose} />
        )
      }
    >
      <View testID="urgent-match-sheet" style={{ gap: space.x3 }}>
      <View style={styles.countCard}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.countKicker}>지금 조건에 맞는 기술자</Text>
          <View style={styles.countRow}>
            <Text style={styles.countValue}>{matched.length}</Text>
            <Text style={styles.countUnit}>명</Text>
          </View>
          <Text style={styles.countSub}>
            긴급 출역 대기 {pool.length}명 중 · 오늘·내일 출역 가능 기준
          </Text>
        </View>
        <View style={styles.countIcon}>
          <Ionicons name="flash" size={20} color="#FFD9C7" />
        </View>
      </View>

      {matched.length ? (
        <View style={styles.previewRow}>
          {matched.slice(0, 3).map((worker) => (
            <View key={worker.id} style={styles.previewChip}>
              <View style={styles.previewDot} />
              <Text style={styles.previewText} numberOfLines={1}>
                {worker.masked ? worker.name : maskName(worker.name)} {worker.grade} · {worker.years}년
              </Text>
            </View>
          ))}
          {matched.length > 3 ? (
            <View style={styles.previewChip}>
              <Text style={styles.previewText}>+{matched.length - 3}명</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.previewEmpty}>
          지금은 조건에 맞는 기술자가 없어요. 지역·직급·경력을 넓히거나 일당 상한을 올려보세요.
        </Text>
      )}

      {phase === 'idle' ? (
        <>
          <Section title="공정" caption="공정을 바꾸면 필수 스킬이 자동 전환">
            <View style={styles.wrapRow}>
              {TRADE_KEYS.map((trade) => (
                <Chip
                  key={trade}
                  label={trade}
                  active={conditions.trade === trade}
                  onPress={() => changeTrade(trade)}
                  icon={getTrade(trade).icon}
                />
              ))}
            </View>
          </Section>

          <Section title="지역" caption="출역 가능 지역">
            <View style={styles.wrapRow}>
              {REGIONS.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  active={conditions.region === region}
                  onPress={() => patch({ region })}
                />
              ))}
            </View>
          </Section>

          <Section title="필요 직급">
            <View style={styles.wrapRow}>
              {ROLES.map((role) => (
                <Chip
                  key={role}
                  label={role === '전체' ? '무관' : role}
                  active={conditions.role === role}
                  onPress={() => patch({ role })}
                />
              ))}
            </View>

            <View style={{ height: 10 }} />
            <FieldLabel label="최소 경력" />
            <View style={styles.wrapRow}>
              {MIN_YEARS_OPTIONS.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  active={conditions.minYears === option.value}
                  onPress={() => patch({ minYears: option.value })}
                />
              ))}
            </View>
          </Section>

          <Section title="필수 시공 스킬" caption={`${conditions.trade} 시공 부위 · 복수 선택`}>
            <View style={styles.wrapRow}>
              {skillOptions.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  active={conditions.skills.includes(skill)}
                  onPress={() => toggleSkill(skill)}
                />
              ))}
            </View>
            {conditions.skills.length ? (
              <Text style={styles.sectionHint}>
                고른 스킬 {conditions.skills.length}개를 모두 할 수 있는 기술자만 알림을 받아요.
              </Text>
            ) : null}
          </Section>

          <Section title="공구 · 단가">
            <SwitchRow
              label="필수 공구 지참"
              caption={`${(TRADE_TOOLS[conditions.trade] ?? []).slice(0, 2).join('·')} 등 보유자만`}
              value={conditions.requireTools}
              onToggle={() => patch({ requireTools: !conditions.requireTools })}
              accessibilityLabel="필수 공구 지참"
            />
            <View style={styles.divider} />
            <View style={styles.rateRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.switchLabel}>일당 상한</Text>
                <Text style={styles.switchCaption}>이 금액 이하로 가능한 기술자만</Text>
              </View>
              <Stepper
                value={conditions.maxDayRate}
                min={180000}
                max={600000}
                step={10000}
                onChange={(next) => patch({ maxDayRate: next })}
                format={(value) => `${comma(value)}원`}
              />
            </View>
            <Text style={styles.sectionHint}>{comma(conditions.maxDayRate)}원/일 이하 · 희망 일당 ‘협의’ 기술자 포함</Text>
          </Section>

          <Section title="시공사진">
            <SwitchRow
              label="시공사진 보유 필수"
              caption="작업물 사진을 1건 이상 올린 기술자만"
              value={conditions.requirePhotos}
              onToggle={() => patch({ requirePhotos: !conditions.requirePhotos })}
              accessibilityLabel="시공사진 보유 필수"
            />
          </Section>

          <View style={styles.feeNotice}>
            <Ionicons name="shield-checkmark" size={14} color={color.green} />
            <Text style={styles.feeNoticeText}>
              <Text style={{ fontWeight: '800' }}>성사 시에만 매칭 수수료 부과 · 미성사 시 0원</Text>
              {'\n'}조건이 맞는 기술자에게 동시에 알림을 보내고, 먼저 수락한 1명과 확정됩니다.
            </Text>
          </View>
        </>
      ) : null}

      {phase === 'sending' && accepted ? (
        <View style={styles.sendingCard}>
          <ActivityIndicator color={color.accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.sendingTitle}>{matched.length}명에게 알림을 보냈어요</Text>
            <Text style={styles.sendingSub}>선착순 수락을 기다리는 중… 보통 1~2분 안에 첫 수락이 옵니다.</Text>
          </View>
        </View>
      ) : null}

      {(phase === 'accepted' || phase === 'confirmed') && accepted ? (
        <View style={[styles.resultCard, phase === 'confirmed' && styles.resultCardDone]}>
          <View style={styles.resultTop}>
            <View style={[styles.checkCircle, phase === 'confirmed' && { backgroundColor: color.green }]}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.resultTitle}>
                {phase === 'confirmed' ? '출역 확정 · 매칭 성사' : '1명 수락 완료'}
              </Text>
              <Text style={styles.resultSub}>
                {phase === 'confirmed'
                  ? '연락처가 공개됐고, 성사 건으로 기록됩니다.'
                  : matched.length > 1
                    ? `선착순 수락 · 남은 ${matched.length - 1}명에게는 대기 안내를 보냈어요.`
                    : '선착순 수락 · 첫 수락으로 바로 확정할 수 있어요.'}
              </Text>
            </View>
            <Badge label={phase === 'confirmed' ? '성사' : '수락'} tone="green" small />
          </View>

          <View style={styles.workerRow}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>{accepted.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={styles.workerNameRow}>
                <Text style={styles.workerName}>{accepted.name}</Text>
                <Badge label={accepted.grade} tone="accent" small />
                {accepted.verified ? <Badge label="이력 인증" tone="navy" icon="shield-checkmark" small /> : null}
              </View>
              <Text style={styles.workerMeta}>
                경력 {accepted.years}년 · 평점 {accepted.rating.toFixed(1)} · 거래 {accepted.deals}건
              </Text>
              <View style={styles.workerBadges}>
                {accepted.photos.length ? (
                  <Badge label={`시공사진 ${accepted.photos.length}건`} tone="blue" icon="images" small />
                ) : (
                  <Badge label="사진 없음" tone="gray" small />
                )}
                <Badge label={`공구 ${accepted.tools.length}종`} tone="gray" icon="construct" small />
              </View>
            </View>
          </View>

          {accepted.photos.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {accepted.photos.map((photo) => (
                <SitePhoto
                  key={photo.id}
                  tone={photo.tone}
                  pattern={photo.pattern}
                  icon={getTrade(accepted.trades[0] ?? conditions.trade).icon}
                  height={54}
                  width={72}
                  label={photo.part}
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.phoneBox}>
            <View style={styles.phoneIcon}>
              <Ionicons name="call" size={13} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={styles.phoneLabel}>연락처 공개</Text>
              <Text style={styles.phoneValue}>{demoPhone(accepted.id)}</Text>
            </View>
            <Badge label="데모 번호" tone="gray" small />
          </View>

          <View style={styles.feeBox}>
            <Ionicons name="wallet-outline" size={14} color={color.green} />
            <Text style={styles.feeText}>
              <Text style={{ fontWeight: '800' }}>성사 시에만 매칭 수수료 부과 · 미성사 시 0원</Text>
              {'\n'}실제로 출역이 확정된 건에만 수수료가 청구됩니다. 당일 취소·노쇼·미성사는 0원이에요.
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Badge label={conditions.trade} tone={tradeConfig.tone} small />
            <Badge label={conditions.region === '전체' ? '지역 무관' : conditions.region} tone="gray" small />
            <Badge
              label={conditions.role === '전체' ? '직급 무관' : conditions.role}
              tone="gray"
              small
            />
            <Badge
              label={conditions.minYears ? `경력 ${conditions.minYears}년+` : '경력 무관'}
              tone="gray"
              small
            />
            <Badge label={`일당 ${comma(conditions.maxDayRate)}원 이하`} tone="gray" small />
            {conditions.requirePhotos ? <Badge label="시공사진 필수" tone="blue" small /> : null}
            {conditions.requireTools ? <Badge label="공구 지참" tone="gray" small /> : null}
          </View>
        </View>
      ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.brand,
    borderRadius: radius.lg,
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  countKicker: { fontSize: 11, fontWeight: '700', color: '#9FB0C7' },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  countValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8 },
  countUnit: { fontSize: 13, fontWeight: '800', color: '#C9D6E8' },
  countSub: { fontSize: 10.5, fontWeight: '600', color: '#9FB0C7' },
  countIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(240,90,34,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  previewDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.green },
  previewText: { fontSize: 10.5, fontWeight: '700', color: color.inkSoft },
  previewEmpty: { fontSize: 11, lineHeight: 16, fontWeight: '600', color: color.muted },

  section: {
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 4,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  sectionHint: { fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: color.muted, marginTop: 4 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  switchLabel: { fontSize: 12.5, fontWeight: '800', color: color.inkSoft },
  switchCaption: { fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: color.muted },
  track: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.lineStrong,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: { backgroundColor: color.accent },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  knobOn: { alignSelf: 'flex-end' },
  divider: { height: 1, backgroundColor: color.line, marginVertical: 6 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  feeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: color.greenSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFEBDC',
    padding: space.x3,
  },
  feeNoticeText: { flex: 1, fontSize: 10.5, lineHeight: 16, fontWeight: '600', color: '#08694A' },

  sendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x3,
  },
  sendingTitle: { fontSize: 13, fontWeight: '800', color: color.ink },
  sendingSub: { fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: color.muted },

  resultCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#BFEBDC',
    padding: space.x3,
    gap: 10,
  },
  resultCardDone: { borderColor: color.green, backgroundColor: '#F4FCF8' },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { fontSize: 14.5, fontWeight: '800', color: color.ink },
  resultSub: { fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: color.muted },

  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  workerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  workerName: { fontSize: 14, fontWeight: '800', color: color.ink },
  workerMeta: { fontSize: 10.5, fontWeight: '600', color: color.inkSoft },
  workerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },

  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  phoneIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLabel: { fontSize: 9.5, fontWeight: '700', color: color.muted },
  phoneValue: { fontSize: 14, fontWeight: '800', color: color.ink, letterSpacing: 0.3 },

  feeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: color.greenSoft,
    borderRadius: radius.sm,
    padding: 9,
  },
  feeText: { flex: 1, fontSize: 10.5, lineHeight: 16, fontWeight: '600', color: '#08694A' },

  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
