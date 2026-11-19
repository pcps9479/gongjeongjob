import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { SitePhoto } from '../components/SitePhoto';
import { Badge, Button, InfoRow, Stars } from '../components/ui';
import { availabilityLabel } from '../components/WorkerCard';
import { getTrade } from '../data/trades';
import { color, font, radius, space } from '../theme';
import { WorkerIntro } from '../types';
import { addDays, fullDateKo, monthDay, todayISO } from '../utils/date';
import { comma } from '../utils/format';

/** 출역 가능 기간 문구: '11월 20일 (목) ~ 11월 26일 (수)' */
function availableRange(worker: WorkerIntro): string {
  const start = worker.availableFrom || todayISO();
  const end = addDays(start, Math.max(0, worker.availableDays - 1));
  if (worker.availableDays <= 1) return fullDateKo(start);
  return `${monthDay(start)} ~ ${fullDateKo(end)}`;
}

export function WorkerDetailSheet({
  worker,
  requested,
  mine,
  onClose,
  onRequest,
}: {
  worker: WorkerIntro | null;
  requested: boolean;
  mine?: boolean;
  onClose: () => void;
  onRequest: () => void;
}) {
  const trade = worker ? getTrade(worker.trades[0] ?? '타일') : null;
  const today = todayISO();

  return (
    <Sheet
      visible={!!worker}
      onClose={onClose}
      title={worker ? `${worker.name} · ${worker.grade}` : ''}
      subtitle={worker ? `${trade?.key ?? ''} · 경력 ${worker.years}년 · ${worker.regions.join('·')}` : undefined}
      footer={
        worker ? (
          <View style={{ gap: 8 }}>
            {requested ? (
              <View style={styles.requestedBanner}>
                <Ionicons name="checkmark-circle" size={14} color={color.green} />
                <Text style={styles.requestedText}>
                  섭외 요청을 보냈어요. 기술자가 수락하면 연락처가 열립니다.
                </Text>
              </View>
            ) : null}
            <Button
              label={requested ? '섭외 요청 보냄 · 다시 요청하기' : '섭외·연락 요청'}
              accessibilityLabel="섭외 요청 보내기"
              icon={requested ? 'checkmark-circle' : 'send'}
              variant={requested ? 'outline' : 'primary'}
              size="lg"
              onPress={onRequest}
            />
            <View style={styles.footerNote}>
              <Ionicons name="lock-closed-outline" size={11} color={color.muted} />
              <Text style={styles.footerNoteText}>
                연락처는 기술자가 수락한 뒤에만 공개됩니다.
              </Text>
            </View>
          </View>
        ) : null
      }
    >
      {worker ? (
        <>
          <View style={styles.badgeRow}>
            {mine ? <Badge label="내 자기소개" tone="purple" icon="create-outline" /> : null}
            <Badge label={worker.grade} tone="accent" icon="hammer" />
            {worker.trades.map((item) => (
              <Badge key={item} label={item} tone={getTrade(item).tone} />
            ))}
            {worker.photos.length > 0 ? (
              <Badge label={`시공사진 ${worker.photos.length}건`} tone="blue" icon="images" />
            ) : null}
            {worker.verified ? <Badge label="이력 인증" tone="green" icon="shield-checkmark" /> : null}
          </View>

          <View style={styles.quoteCard}>
            <Ionicons name="chatbox-ellipses" size={14} color={color.accentDark} />
            <Text style={styles.quote}>{worker.headline}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>출역 조건</Text>
            <InfoRow icon="calendar-outline" label="가능일" value={availableRange(worker)} />
            <InfoRow icon="flash-outline" label="바로 출역" value={`${availabilityLabel(worker, today)} 가능`} />
            <InfoRow icon="location-outline" label="지역" value={worker.regions.join(' · ') || '협의'} />
            <InfoRow
              icon="cash-outline"
              label="희망 일당"
              value={worker.dayRate ? `${comma(worker.dayRate)}원 / 일` : '협의 (현장 조건에 맞춰 조정)'}
              valueStyle={worker.dayRate ? { color: color.ink, fontWeight: '800' } : undefined}
            />
            <InfoRow icon="time-outline" label="경력" value={`${worker.years}년 · ${worker.grade}`} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>가능한 시공</Text>
            <View style={styles.chipWrap}>
              {worker.skills.map((skill) => (
                <View key={skill} style={styles.chip}>
                  <Ionicons name={trade ? trade.icon : 'construct'} size={11} color={color.brand} />
                  <Text style={styles.chipText}>{skill}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionSub}>보유 공구</Text>
            <View style={styles.chipWrap}>
              {worker.tools.length ? (
                worker.tools.map((tool) => (
                  <View key={tool} style={[styles.chip, styles.toolChip]}>
                    <Ionicons name="construct-outline" size={11} color={color.inkSoft} />
                    <Text style={[styles.chipText, { color: color.inkSoft }]}>{tool}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>등록된 공구가 없어요.</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>시공 사진 · 작업물</Text>
              <Text style={styles.sectionCount}>{worker.photos.length}건</Text>
            </View>
            {worker.photos.length ? (
              <View style={{ gap: 8 }}>
                {worker.photos.map((photo) => (
                  <View key={photo.id} style={styles.photoCard}>
                    <SitePhoto
                      tone={photo.tone}
                      pattern={photo.pattern}
                      icon={trade ? trade.icon : 'image-outline'}
                      height={104}
                      width={116}
                      rounded={radius.sm}
                    />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={styles.photoPart} numberOfLines={1}>
                        {photo.part}
                      </Text>
                      <Text style={styles.photoCaption} numberOfLines={3}>
                        {photo.caption}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="images-outline" size={22} color={color.muted} />
                <Text style={styles.emptyText}>
                  아직 시공 사진이 없어요. 요청하면 현장에서 촬영한 작업물을 받아볼 수 있습니다.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>평가</Text>
            <View style={styles.ratingRow}>
              <Stars value={worker.rating} size={13} />
              <Text style={styles.ratingValue}>{worker.rating.toFixed(1)}</Text>
              <Text style={styles.ratingMeta}>· 현장 {worker.deals}건 완료</Text>
            </View>
            <View style={styles.trustRow}>
              <Badge label="노쇼 0회" tone="green" small />
              <Badge label="임금 분쟁 0건" tone="green" small />
              <Badge label="휴대폰 인증" tone="blue" small />
            </View>
            {worker.masked ? (
              <View style={styles.maskedNote}>
                <Ionicons name="lock-closed" size={11} color={color.muted} />
                <Text style={styles.maskedText}>연락처·실명은 섭외 확정 후 공개됩니다.</Text>
              </View>
            ) : null}
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  quoteCard: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: color.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FFD9C7',
    padding: space.x3,
  },
  quote: { flex: 1, fontSize: 13.5, lineHeight: 20, fontWeight: '700', color: '#8A3A16' },
  section: {
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 6,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { ...font.h3, fontSize: 14, color: color.ink },
  sectionSub: { fontSize: 11, fontWeight: '800', color: color.muted, marginTop: 4 },
  sectionCount: { fontSize: 11, fontWeight: '800', color: color.muted },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: {
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
  toolChip: { backgroundColor: color.surfaceSunken, borderColor: color.line },
  chipText: { fontSize: 11, fontWeight: '700', color: color.brand },
  photoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    padding: 8,
  },
  photoPart: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  photoCaption: { fontSize: 11.5, lineHeight: 16, fontWeight: '600', color: color.inkSoft },
  emptyBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 11.5, fontWeight: '600', color: color.muted, textAlign: 'center', lineHeight: 17 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingValue: { fontSize: 13, fontWeight: '800', color: color.inkSoft },
  ratingMeta: { fontSize: 11.5, fontWeight: '600', color: color.muted },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  maskedNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  maskedText: { fontSize: 10.5, fontWeight: '600', color: color.muted },
  footerNote: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  footerNoteText: { fontSize: 10.5, fontWeight: '600', color: color.muted, flex: 1 },
  requestedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.greenSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  requestedText: { flex: 1, fontSize: 11.5, fontWeight: '700', color: '#08694A', lineHeight: 16 },
});
