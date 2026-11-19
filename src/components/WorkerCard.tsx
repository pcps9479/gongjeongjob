import { Ionicons } from '@expo/vector-icons';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { getTrade } from '../data/trades';
import { color, font, radius, shadow, space } from '../theme';
import { WorkerIntro } from '../types';
import { addDays, monthDay, todayISO } from '../utils/date';
import { comma } from '../utils/format';
import { SitePhoto } from './SitePhoto';
import { Badge } from './ui';

/** 출역 가능일 라벨: 오늘 / 이번 주 / 11/25부터 */
export function availabilityLabel(worker: WorkerIntro, today = todayISO()): string {
  const start = worker.availableFrom;
  if (!start || start <= today) return '오늘부터';
  if (start <= addDays(today, 7)) return '이번 주';
  return `${monthDay(start)}부터`;
}

export function rateLabel(worker: WorkerIntro): string {
  return worker.dayRate ? `${comma(worker.dayRate)}원/일` : '일당 협의';
}

export function WorkerCard({
  worker,
  requested,
  mine,
  onPress,
  onRequest,
}: {
  worker: WorkerIntro;
  requested: boolean;
  /** 지금 보고 있는 사람이 본인 자기소개인지 */
  mine?: boolean;
  onPress: () => void;
  onRequest: () => void;
}) {
  const trade = getTrade(worker.trades[0] ?? '타일');
  const today = todayISO();
  const photoCount = worker.photos.length;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`기술자 자기소개 ${worker.name} ${worker.grade}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: color.brand }]}>
          <Text style={styles.avatarText}>{worker.name.slice(0, 1)}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {worker.name}
            </Text>
            {worker.masked ? <Ionicons name="lock-closed" size={11} color={color.muted} /> : null}
            <Badge label={worker.grade} tone="accent" small />
            {mine ? <Badge label="내 자기소개" tone="purple" small /> : null}
          </View>
          <Text style={styles.sub} numberOfLines={1}>
            {trade.key} · 경력 {worker.years}년 · {worker.regions.join('·') || '지역 협의'}
          </Text>
        </View>
        {photoCount > 0 ? (
          <Badge label="시공사진 보유" tone="blue" icon="images" small />
        ) : worker.verified ? (
          <Badge label="이력 인증" tone="green" icon="shield-checkmark" small />
        ) : null}
      </View>

      <Text style={styles.headline} numberOfLines={3}>
        {worker.headline}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Ionicons name="calendar-outline" size={11} color={color.green} />
          <Text style={[styles.metaText, { color: color.green }]}>
            {availabilityLabel(worker, today)} 출역
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="location-outline" size={11} color={color.inkSoft} />
          <Text style={styles.metaText}>{worker.regions.slice(0, 3).join('·') || '지역 협의'}</Text>
        </View>
        <View style={[styles.metaChip, styles.rateChip]}>
          <Ionicons name="cash-outline" size={11} color={color.accentDark} />
          <Text style={[styles.metaText, { color: color.accentDark, fontWeight: '800' }]}>
            {rateLabel(worker)}
          </Text>
        </View>
      </View>

      {photoCount > 0 ? (
        <View style={styles.photoRow}>
          {worker.photos.slice(0, 3).map((photo) => (
            <View key={photo.id} style={styles.photoCell}>
              <SitePhoto tone={photo.tone} pattern={photo.pattern} icon={trade.icon} height={54} label={photo.part} />
            </View>
          ))}
          {photoCount === 1 ? (
            <View style={styles.photoHint}>
              <Ionicons name="images-outline" size={12} color={color.muted} />
              <Text style={styles.photoHintText}>시공사진 {photoCount}건</Text>
            </View>
          ) : (
            <View style={styles.photoHint}>
              <Ionicons name="images-outline" size={12} color={color.muted} />
              <Text style={styles.photoHintText}>{photoCount}건</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Ionicons name="construct-outline" size={12} color={color.muted} />
          <Text style={styles.tools} numberOfLines={1}>
            {worker.tools.length ? worker.tools.slice(0, 3).join(', ') : '공구 협의'}
          </Text>
        </View>
        <Pressable
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation?.();
            onRequest();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${worker.name} 섭외·연락 요청`}
          style={({ pressed }) => [styles.requestBtn, requested && styles.requestBtnDone, pressed && { opacity: 0.75 }]}
        >
          <Ionicons
            name={requested ? 'checkmark-circle' : 'send'}
            size={12}
            color={requested ? color.green : '#FFFFFF'}
          />
          <Text style={[styles.requestText, requested && { color: color.green }]}>
            {requested ? '섭외 요청함' : '섭외·연락 요청'}
          </Text>
        </Pressable>
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
  pressed: { transform: [{ scale: 0.994 }], opacity: 0.95 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '800', color: color.ink, letterSpacing: -0.3 },
  sub: { fontSize: 11, fontWeight: '600', color: color.muted },
  headline: { ...font.body, fontSize: 13, lineHeight: 19, color: color.ink, fontWeight: '600' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.xs,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  rateChip: { backgroundColor: color.accentSoft },
  metaText: { fontSize: 10.5, fontWeight: '700', color: color.inkSoft },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  photoCell: { flex: 1, maxWidth: 96 },
  photoHint: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 2 },
  photoHintText: { fontSize: 10, fontWeight: '700', color: color.muted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: space.x2,
    marginTop: 1,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  tools: { flex: 1, fontSize: 10.5, fontWeight: '600', color: color.muted },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: color.brand,
  },
  requestBtnDone: { backgroundColor: color.greenSoft, borderWidth: 1, borderColor: '#BFEBDC' },
  requestText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },
});
