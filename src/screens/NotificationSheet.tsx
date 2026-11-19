import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Badge, Button } from '../components/ui';
import { NOTIFICATION_META } from '../data/notifications';
import { useApp } from '../store/AppStore';
import { color, font, radius, space, toneStyles } from '../theme';
import { AppNotification } from '../types';
import { addDays, todayISO } from '../utils/date';
import { relativeTimeKo } from '../utils/format';

export function NotificationSheet({
  visible,
  onClose,
  onOpenJob,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenJob: (jobId: string) => void;
}) {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead, guest, exitGuest, showToast } =
    useApp();

  const groups = useMemo(() => {
    const today = todayISO();
    const yesterday = addDays(today, -1);
    const order: { key: string; label: string; items: AppNotification[] }[] = [
      { key: today, label: '오늘', items: [] },
      { key: yesterday, label: '어제', items: [] },
      { key: 'older', label: '이전 알림', items: [] },
    ];
    notifications.forEach((item) => {
      const day = item.at.slice(0, 10);
      const bucket = order.find((group) => group.key === day) ?? order[2]!;
      bucket.items.push(item);
    });
    return order.filter((group) => group.items.length > 0);
  }, [notifications]);

  const openItem = (item: AppNotification) => {
    markNotificationRead(item.id);
    if (item.jobId) {
      onClose();
      onOpenJob(item.jobId);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="알림함"
      subtitle="지원 확정 · 연락처 공개 · 내 주변 공고 · 공수 정산"
      footer={
        notifications.length ? (
          <View style={{ gap: 8 }}>
            <Button
              label={unreadCount ? `모두 읽음 처리 (${unreadCount})` : '모두 읽음 처리 완료'}
              icon={unreadCount ? 'checkmark-done' : 'checkmark-circle'}
              variant="outline"
              onPress={() => {
                if (!unreadCount) {
                  showToast('이미 모든 알림을 확인했어요.');
                  return;
                }
                markAllNotificationsRead();
                showToast('모든 알림을 읽음 처리했어요.');
              }}
              disabled={!unreadCount}
            />
            <Pressable
              onPress={() => showToast('지원 확정·연락처·정산 알림을 휴대폰으로 받고 있어요.')}
              style={styles.footerRow}
            >
              <Ionicons name="notifications-outline" size={13} color={color.inkSoft} />
              <Text style={styles.footerRowText}>알림 수신 설정 · 확정·정산 알림 켜짐</Text>
              <Ionicons name="chevron-forward" size={13} color={color.muted} />
            </Pressable>
          </View>
        ) : null
      }
    >
      {guest ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="lock-closed" size={24} color={color.muted} />
          </View>
          <Text style={styles.emptyTitle}>로그인하면 알림을 받을 수 있어요</Text>
          <Text style={styles.emptyText}>지원 확정, 연락처 공개, 주변 신규 공고, 공수 정산 소식을 이곳에서 알려드려요.</Text>
          <Button label="로그인 · 회원가입" variant="dark" size="sm" onPress={exitGuest} style={{ marginTop: 8 }} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={24} color={color.muted} />
          </View>
          <Text style={styles.emptyTitle}>새 알림이 없어요</Text>
          <Text style={styles.emptyText}>공고에 지원하면 확정·연락처 공개 소식을 바로 알려드립니다.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Badge
              label={unreadCount ? `읽지 않은 알림 ${unreadCount}건` : '모두 확인함'}
              tone={unreadCount ? 'accent' : 'green'}
              icon={unreadCount ? 'ellipse' : 'checkmark-circle'}
            />
            <Text style={styles.summaryText}>최근 7일</Text>
          </View>

          {groups.map((group) => (
            <View key={group.key} style={{ gap: 6 }}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((item) => {
                const meta = NOTIFICATION_META[item.kind];
                const tone = toneStyles[meta.tone];
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title} 알림`}
                    style={({ pressed }) => [
                      styles.item,
                      !item.read && styles.itemUnread,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: tone.bg }]}>
                      <Ionicons name={meta.icon} size={16} color={tone.fg} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={styles.itemTitleRow}>
                        <Text style={[styles.itemTitle, !item.read && { color: color.ink }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemTime}>{relativeTimeKo(item.at)}</Text>
                      </View>
                      <Text style={styles.itemBody} numberOfLines={3}>
                        {item.body}
                      </Text>
                      <View style={styles.itemMetaRow}>
                        <Badge label={meta.label} tone={meta.tone} small />
                        {item.jobId ? (
                          <View style={styles.itemLink}>
                            <Text style={styles.itemLinkText}>공고 보기</Text>
                            <Ionicons name="chevron-forward" size={11} color={color.accentDark} />
                          </View>
                        ) : null}
                      </View>
                    </View>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryText: { fontSize: 10.5, fontWeight: '600', color: color.muted },

  groupLabel: { fontSize: 11, fontWeight: '800', color: color.muted, marginTop: 2 },

  item: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    padding: space.x3,
  },
  itemUnread: { backgroundColor: '#FFFDFB', borderColor: '#FFD9C7' },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTitle: { flex: 1, fontSize: 13, fontWeight: '800', color: color.inkSoft },
  itemTime: { fontSize: 9.5, fontWeight: '600', color: color.muted },
  itemBody: { ...font.small, fontSize: 11.5, lineHeight: 17, color: color.inkSoft, fontWeight: '500' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  itemLink: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  itemLinkText: { fontSize: 10.5, fontWeight: '800', color: color.accentDark },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent, marginTop: 4 },

  empty: { alignItems: 'center', gap: 6, paddingVertical: 26, paddingHorizontal: 10 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: color.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { ...font.h3, color: color.ink },
  emptyText: { ...font.small, color: color.muted, textAlign: 'center', lineHeight: 18, fontWeight: '500' },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: 10,
  },
  footerRowText: { flex: 1, fontSize: 11, fontWeight: '600', color: color.inkSoft },
});
