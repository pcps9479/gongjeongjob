import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Badge, Button, Divider, InfoRow, Stars } from '../components/ui';
import { areaText, getTrade, payOptionOf } from '../data/trades';
import { color, font, radius, space } from '../theme';
import { JobPost, SiteConditions } from '../types';
import { fullDateKo, todayISO } from '../utils/date';
import { comma, contractTotal, dDayLabel, rolesLabel } from '../utils/format';

const CONDITION_KEYS: (keyof SiteConditions)[] = ['materials', 'hoisting', 'parking', 'meal', 'sameDayPay'];

export function JobDetailSheet({
  job,
  applied,
  onClose,
  onToggleApply,
  onReport,
}: {
  job: JobPost | null;
  applied: boolean;
  onClose: () => void;
  onToggleApply: () => void;
  onReport?: () => void;
}) {
  const today = todayISO();
  const trade = job ? getTrade(job.trade) : null;
  const payOption = job && job.payType === '도급' ? payOptionOf(job.trade, '도급', job.payUnit) : null;
  const area = job ? areaText(job) : null;

  return (
    <Sheet
      visible={!!job}
      onClose={onClose}
      title={job ? job.title : ''}
      subtitle={job ? `${job.region} ${job.district} · ${fullDateKo(job.date)} ${job.startTime}` : undefined}
      footer={
        job ? (
          <View style={{ gap: 8 }}>
            {applied ? (
              <View style={styles.appliedBanner}>
                <Ionicons name="checkmark-circle" size={14} color={color.green} />
                <Text style={styles.appliedBannerText}>
                  지원 완료 · 발주처 확정을 기다리는 중이에요. 확정되면 연락처가 열립니다.
                </Text>
              </View>
            ) : null}
            <Button
              label={applied ? '지원 완료 · 다시 누르면 취소' : '원터치 지원하기'}
              icon={applied ? 'checkmark-circle' : 'flash'}
              variant={applied ? 'outline' : 'primary'}
              size="lg"
              onPress={onToggleApply}
            />
            <View style={styles.footerNote}>
              <Ionicons name="lock-closed-outline" size={11} color={color.muted} />
              <Text style={styles.footerNoteText}>
                지원 시 발주처에 내 프로필(등급·경력·포트폴리오)만 전달되고, 연락처는 확정 후 공개됩니다.
              </Text>
            </View>
          </View>
        ) : null
      }
    >
      {job ? (
        <>
          <View style={styles.badgeRow}>
            {job.isMine ? <Badge label="내가 등록한 공고" tone="purple" icon="create-outline" /> : null}
            <Badge label={job.trade} tone={trade ? trade.tone : 'navy'} icon={trade ? trade.icon : 'grid-outline'} />
            {job.workTypes.map((type) => (
              <Badge key={type} label={type} tone="navy" />
            ))}
            <Badge label={dDayLabel(job.date, today)} tone="red" />
          </View>

          <View style={styles.payCard}>
            <Text style={styles.payCaption}>
              {job.payType === '도급' ? `도급 단가 (${payOption?.unit ?? '㎡'}당)` : '일당'}
            </Text>
            <View style={styles.payLine}>
              <Text style={styles.payValue}>{comma(job.payAmount)}</Text>
              <Text style={styles.payUnit}>{job.payType === '도급' ? `원/${payOption?.unit ?? '㎡'}` : '원/일'}</Text>
            </View>
            <View style={styles.payMeta}>
              {job.payType === '도급' && area ? (
                <Badge
                  label={`${area} · 총액 ${comma(contractTotal(job))}원`}
                  tone="purple"
                  icon="resize-outline"
                />
              ) : null}
              <Badge label={`모집 ${rolesLabel(job.roles)}`} tone="gray" icon="people-outline" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>현장 정보</Text>
            <InfoRow icon="location-outline" label="현장" value={`${job.region} ${job.district}`} />
            <InfoRow icon="calendar-outline" label="작업일" value={fullDateKo(job.date)} />
            <InfoRow icon="time-outline" label="집합" value={`${job.startTime} 현장 집합`} />
            <InfoRow icon="hammer-outline" label="공정" value={`${job.trade} · ${trade?.tagline ?? ''}`} />
            <InfoRow icon={trade ? trade.icon : 'grid-outline'} label={trade ? trade.specLabel : '규격'} value={job.tileSpec} />
            <InfoRow icon="construct-outline" label="시공" value={job.workTypes.join(' · ')} />
            <InfoRow icon="people-outline" label="인원" value={rolesLabel(job.roles)} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>현장 조건</Text>
            <View style={styles.conditionGrid}>
              {trade
                ? CONDITION_KEYS.map((key) => {
                    const on = job.conditions[key];
                    const labels = trade.conditionLabels[key];
                    return (
                      <View key={key} style={styles.conditionItem}>
                        <View
                          style={[
                            styles.conditionIcon,
                            { backgroundColor: on ? color.greenSoft : color.surfaceSunken },
                          ]}
                        >
                          <Ionicons
                            name={on ? 'checkmark' : 'close'}
                            size={12}
                            color={on ? color.green : color.muted}
                          />
                        </View>
                        <Text style={[styles.conditionText, !on && { color: color.muted }]} numberOfLines={2}>
                          {on ? labels.label : labels.offLabel}
                        </Text>
                      </View>
                    );
                  })
                : null}
              {trade
                ? trade.checks.map((check) => {
                    const on = !!job.siteChecks?.includes(check.key);
                    return (
                      <View key={check.key} style={styles.conditionItem}>
                        <View
                          style={[
                            styles.conditionIcon,
                            { backgroundColor: on ? color.greenSoft : color.surfaceSunken },
                          ]}
                        >
                          <Ionicons
                            name={on ? 'checkmark' : 'close'}
                            size={12}
                            color={on ? color.green : color.muted}
                          />
                        </View>
                        <Text style={[styles.conditionText, !on && { color: color.muted }]} numberOfLines={2}>
                          {on ? check.label : check.offLabel}
                        </Text>
                      </View>
                    );
                  })
                : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>현장 메모</Text>
            <Text style={styles.memo}>{job.memo}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>발주처</Text>
            <View style={styles.contractorCard}>
              <View style={styles.contractorAvatar}>
                <Ionicons name="business" size={18} color={color.brand} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.contractorNameRow}>
                  <Text style={styles.contractorName}>{job.contractor}</Text>
                  {job.contractorVerified ? (
                    <Badge label="인증" tone="blue" icon="shield-checkmark" small />
                  ) : (
                    <Badge label="미인증" tone="gray" small />
                  )}
                </View>
                <View style={styles.contractorMeta}>
                  <Stars value={job.contractorRating} />
                  <Text style={styles.contractorMetaText}>
                    {job.contractorRating.toFixed(1)} · 거래 {job.contractorDeals}건
                  </Text>
                </View>
                <View style={styles.historyRow}>
                  <Badge label="노쇼 0회" tone="green" small />
                  <Badge label="임금체불 0건" tone="green" small />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.safeBox}>
            <View style={styles.safeHeader}>
              <Ionicons name="shield-checkmark" size={16} color={color.accentDark} />
              <Text style={styles.safeTitle}>안심 매칭 안내</Text>
            </View>
            <View style={styles.safeLine}>
              <View style={styles.bullet} />
              <Text style={styles.safeText}>채용 확정 전까지 서로의 연락처가 노출되지 않습니다.</Text>
            </View>
            <View style={styles.safeLine}>
              <View style={styles.bullet} />
              <Text style={styles.safeText}>발주처가 내 프로필을 확인하고 확정하면 연락처와 상세 주소가 열립니다.</Text>
            </View>
            <View style={styles.safeLine}>
              <View style={styles.bullet} />
              <Text style={styles.safeText}>노쇼·임금체불 이력이 있는 계정은 매칭에서 제외됩니다.</Text>
            </View>
          </View>

          {onReport ? (
            <Pressable onPress={onReport} accessibilityRole="button" style={styles.reportBtn}>
              <View style={styles.reportIcon}>
                <Ionicons name="shield-outline" size={15} color={color.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>노쇼 · 임금체불 · 허위공고 신고</Text>
                <Text style={styles.reportSub}>안전센터에서 24시간 내 확인 · 비공개 처리</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={color.muted} />
            </Pressable>
          ) : null}

          <Divider />
          <Text style={styles.registered}>등록 {job.createdAt.replace('T', ' ').slice(0, 16)}</Text>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  payCard: {
    backgroundColor: color.brand,
    borderRadius: radius.lg,
    padding: space.x4,
    gap: 6,
  },
  payCaption: { ...font.tiny, color: '#B9C6DA', fontWeight: '700' },
  payLine: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  payValue: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  payUnit: { fontSize: 14, fontWeight: '700', color: '#D7E1EF' },
  payMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },

  section: { gap: 3, marginTop: 2 },
  sectionTitle: { ...font.small, color: color.muted, fontWeight: '800', marginBottom: 4 },

  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  conditionItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  conditionIcon: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  conditionText: { fontSize: 12.5, fontWeight: '600', color: color.ink },

  memo: {
    ...font.body,
    color: color.inkSoft,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    lineHeight: 21,
  },

  contractorCard: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    padding: space.x3,
    alignItems: 'flex-start',
  },
  contractorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contractorName: { ...font.h3, fontSize: 15, color: color.ink },
  contractorMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contractorMetaText: { ...font.tiny, color: color.inkSoft, fontWeight: '600' },
  historyRow: { flexDirection: 'row', gap: 4, marginTop: 2 },

  safeBox: {
    backgroundColor: color.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FFD9C7',
    padding: space.x3,
    gap: 6,
    marginTop: 2,
  },
  safeHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  safeTitle: { fontSize: 13, fontWeight: '800', color: color.accentDark },
  safeLine: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bullet: { width: 3, height: 3, borderRadius: 2, backgroundColor: color.accentDark, marginTop: 7 },
  safeText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#8A3A16', fontWeight: '600' },

  registered: { ...font.tiny, color: color.muted, textAlign: 'center', fontWeight: '500' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  reportIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: color.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  reportSub: { fontSize: 10, fontWeight: '600', color: color.muted, marginTop: 1 },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: color.greenSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#BFEBDC',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  appliedBannerText: { flex: 1, fontSize: 11, lineHeight: 16, color: '#08694A', fontWeight: '700' },
  footerNote: { flexDirection: 'row', gap: 5, alignItems: 'flex-start', paddingHorizontal: 2 },
  footerNoteText: { flex: 1, fontSize: 10.5, lineHeight: 15, color: color.muted, fontWeight: '500' },
});
