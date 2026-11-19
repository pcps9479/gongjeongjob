import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getTrade, TRADE_KEYS } from '../data/trades';
import { color, radius, space } from '../theme';
import { TradeFilter } from '../types';

const ALL_ICON: React.ComponentProps<typeof Ionicons>['name'] = 'apps-outline';

export function TradeSwitcher({
  value,
  onChange,
  counts,
}: {
  value: TradeFilter;
  onChange: (trade: TradeFilter) => void;
  counts: Record<string, number>;
}) {
  const items: { key: TradeFilter; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { key: '전체', label: '전체', icon: ALL_ICON },
    ...TRADE_KEYS.map((key) => ({ key: key as TradeFilter, label: key, icon: getTrade(key).icon })),
  ];

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const active = value === item.key;
        const count = counts[item.key] ?? 0;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.label} 공정${count ? ` 공고 ${count}건` : ''}`}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name={item.icon} size={12} color={active ? '#FFB98F' : color.muted} />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.count, active && styles.countActive]}>{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: space.x1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
  },
  itemActive: { backgroundColor: color.brand, borderColor: color.brand },
  label: { fontSize: 12, fontWeight: '700', color: color.inkSoft },
  labelActive: { color: '#FFFFFF' },
  count: { fontSize: 9.5, fontWeight: '800', color: color.muted, marginLeft: 1 },
  countActive: { color: '#C9D6E8' },
});
