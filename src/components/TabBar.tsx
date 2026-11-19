import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, shadow, space } from '../theme';
import { TabKey } from '../types';
import type { IconName } from './ui';

const TABS: { key: TabKey; label: string; icon: IconName; activeIcon: IconName }[] = [
  { key: 'jobs', label: '일자리', icon: 'briefcase-outline', activeIcon: 'briefcase' },
  { key: 'post', label: '공고등록', icon: 'megaphone-outline', activeIcon: 'megaphone' },
  { key: 'calendar', label: '공수달력', icon: 'calendar-outline', activeIcon: 'calendar' },
  { key: 'profile', label: '내 프로필', icon: 'person-outline', activeIcon: 'person' },
];

export function TabBar({
  tab,
  onChange,
  bottomInset,
}: {
  tab: TabKey;
  onChange: (tab: TabKey) => void;
  bottomInset: number;
}) {
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {TABS.map((item) => {
        const active = tab === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={20}
                color={active ? '#FFFFFF' : color.muted}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    paddingTop: 8,
    paddingHorizontal: space.x2,
    borderTopWidth: 1,
    borderTopColor: color.line,
    ...shadow.tabBar,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: color.brand },
  label: { fontSize: 10.5, fontWeight: '700', color: color.muted },
  labelActive: { color: color.ink },
});
