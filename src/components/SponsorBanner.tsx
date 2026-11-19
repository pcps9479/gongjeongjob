import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { Sheet } from './Sheet';
import { SponsorAd } from '../data/ads';
import { color, radius, space } from '../theme';

/**
 * 일자리 피드 중간의 1줄 스폰서 배너.
 * 흐름을 방해하지 않도록 한 줄로 넣고, 누르면 데모 광고 안내를 띄운다.
 */
export function SponsorBanner({ ad }: { ad: SponsorAd }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`스폰서 배너: ${ad.title}`}
        style={({ pressed }) => [styles.banner, pressed && { opacity: 0.75 }]}
      >
        <View style={styles.adTag}>
          <Text style={styles.adTagText}>AD</Text>
        </View>
        <View style={styles.iconWrap}>
          <Ionicons name={ad.icon} size={14} color={color.inkSoft} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {ad.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {ad.advertiser} · {ad.perk}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={color.muted} />
      </Pressable>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="스폰서 배너 예시"
        subtitle="일자리 피드 중간에 들어가는 1줄 광고입니다."
        footer={<Button label="확인" size="lg" onPress={() => setOpen(false)} />}
      >
        <View style={styles.modalBanner}>
          <View style={styles.adTag}>
            <Text style={styles.adTagText}>AD</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name={ad.icon} size={14} color={color.inkSoft} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>{ad.title}</Text>
            <Text style={styles.meta}>
              {ad.advertiser} · {ad.perk}
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteRow}>
            <Ionicons name="call-outline" size={14} color={color.blue} />
            <Text style={styles.noteLabel}>연결</Text>
            <Text style={styles.noteValue}>{ad.action}로 바로 이동</Text>
          </View>
          <View style={styles.noteRow}>
            <Ionicons name="megaphone-outline" size={14} color={color.blue} />
            <Text style={styles.noteLabel}>광고 단가</Text>
            <Text style={styles.noteValue}>공정 탭 노출 · 월 30~50만 원 (협의)</Text>
          </View>
        </View>

        <Text style={styles.detail}>{ad.detail}</Text>

        <View style={styles.demoBox}>
          <Ionicons name="information-circle" size={13} color={color.amber} />
          <Text style={styles.demoText}>
            데모 광고 예시입니다. 실제 제휴 시 전화 연결/주문 링크로 이동하며, 광고주는 내 프로필의{' '}
            <Text style={{ fontWeight: '800' }}>광고 · 제휴 문의</Text>로 접수할 수 있어요.
          </Text>
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  adTag: {
    backgroundColor: color.surfaceSunken,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  adTagText: { fontSize: 8.5, fontWeight: '800', color: color.muted, letterSpacing: 0.5 },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: color.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 12, fontWeight: '800', color: color.ink },
  meta: { fontSize: 10, fontWeight: '600', color: color.muted },

  modalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.x3,
    paddingVertical: space.x3,
  },
  noteCard: {
    backgroundColor: color.blueSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D3E0FF',
    padding: space.x3,
    gap: 6,
  },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteLabel: { fontSize: 10.5, fontWeight: '700', color: color.blue, width: 52 },
  noteValue: { flex: 1, fontSize: 11.5, fontWeight: '600', color: '#2B4C9B' },
  detail: { fontSize: 12, lineHeight: 18, fontWeight: '600', color: color.inkSoft },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: color.amberSoft,
    borderRadius: radius.sm,
    padding: space.x3,
  },
  demoText: { flex: 1, fontSize: 10.5, lineHeight: 16, fontWeight: '600', color: '#8A5A0B' },
});
