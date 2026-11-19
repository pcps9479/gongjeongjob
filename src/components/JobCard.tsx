import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { areaText, getTrade } from '../data/trades';
import { color, font, radius, shadow, space } from '../theme';
import { JobPost } from '../types';
import { fullDateKo } from '../utils/date';
import { comma, contractTotal, dDayLabel, payLabel, rolesLabel } from '../utils/format';
import { Badge } from './ui';

export function JobCard({
  job,
  applied,
  today,
  onPress,
}: {
  job: JobPost;
  applied: boolean;
  today: string;
  onPress: () => void;
}) {
  const dday = dDayLabel(job.date, today);
  const urgent = dday === '오늘' || dday === '내일';
  const trade = getTrade(job.trade);
  const area = areaText(job);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${job.trade} 공고 ${job.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.badges}>
          {job.isMine ? <Badge label="내가 등록" tone="purple" icon="create-outline" small /> : null}
          <Badge label={job.trade} tone={trade.tone} icon={trade.icon} small />
          {job.workTypes.slice(0, 2).map((type) => (
            <Badge key={type} label={type} tone="navy" small />
          ))}
          {job.workTypes.length > 2 ? <Badge label={`+${job.workTypes.length - 2}`} tone="gray" small /> : null}
        </View>
        {applied ? (
          <Badge label="지원 완료" tone="green" icon="checkmark-circle" small />
        ) : (
          <Badge label={dday} tone={urgent ? 'red' : 'gray'} small />
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>

      <View style={styles.metaRow}>
        <Ionicons name="location-outline" size={13} color={color.inkSoft} />
        <Text style={styles.meta} numberOfLines={1}>
          {job.region} {job.district}
        </Text>
        <View style={styles.dot} />
        <Text style={styles.meta}>{fullDateKo(job.date)}</Text>
        <View style={styles.dot} />
        <Text style={styles.meta}>{job.startTime}</Text>
      </View>

      <View style={styles.payBlock}>
        <View style={{ flex: 1 }}>
          <View style={styles.payTypeRow}>
            <View style={[styles.payTypeTag, job.payType === '도급' && styles.payTypeTagPiece]}>
              <Text style={[styles.payTypeText, job.payType === '도급' && { color: color.purple }]}>
                {job.payType}
              </Text>
            </View>
            <Text style={styles.payValue}>{payLabel(job)}</Text>
            {job.payType === '일당' ? <Text style={styles.payUnit}>/일</Text> : null}
          </View>
          <Text style={styles.paySub} numberOfLines={1}>
            {job.payType === '도급' && area
              ? `${area} · 총액 ${comma(contractTotal(job))}원`
              : `필요 인원 ${rolesLabel(job.roles)}`}
          </Text>
        </View>
        <View style={styles.specBox}>
          <Ionicons name={trade.icon} size={12} color={color.muted} />
          <Text style={styles.specText} numberOfLines={1}>
            {job.tileSpec}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.contractorRow}>
          <Text style={styles.contractor} numberOfLines={1}>
            {job.contractor}
          </Text>
          {job.contractorVerified ? (
            <Badge label="발주처 인증" tone="blue" icon="shield-checkmark" small />
          ) : (
            <Badge label="인증 대기" tone="gray" small />
          )}
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color="#F5A524" />
          <Text style={styles.rating}>{job.contractorRating.toFixed(1)}</Text>
          <Text style={styles.deals}>· {job.contractorDeals}건</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    gap: space.x2,
    ...shadow.card,
  },
  pressed: { transform: [{ scale: 0.994 }], opacity: 0.94 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badges: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  title: { ...font.h3, fontSize: 16.5, color: color.ink, lineHeight: 23 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  meta: { fontSize: 12.5, color: color.inkSoft, fontWeight: '600' },
  dot: { width: 2.5, height: 2.5, borderRadius: 2, backgroundColor: color.lineStrong },
  payBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
    marginTop: 2,
  },
  payTypeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  payTypeTag: {
    backgroundColor: color.accentSoft,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignSelf: 'center',
  },
  payTypeTagPiece: { backgroundColor: color.purpleSoft },
  payTypeText: { fontSize: 10.5, fontWeight: '800', color: color.accentDark },
  payValue: { fontSize: 17.5, fontWeight: '800', color: color.ink, letterSpacing: -0.4 },
  payUnit: { fontSize: 12, color: color.muted, fontWeight: '600' },
  paySub: { ...font.tiny, color: color.inkSoft, marginTop: 3, fontWeight: '600' },
  specBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 5,
    maxWidth: 132,
  },
  specText: { fontSize: 10.5, color: color.inkSoft, fontWeight: '700', flexShrink: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: space.x2,
    marginTop: 2,
  },
  contractorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  contractor: { fontSize: 12.5, fontWeight: '700', color: color.inkSoft, maxWidth: 110 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 12, fontWeight: '800', color: color.inkSoft },
  deals: { fontSize: 11.5, color: color.muted, fontWeight: '600' },
});
