import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radius } from '../theme';
import { PhotoPattern, PhotoTone } from '../types';
import type { IconName } from './ui';

export const PHOTO_TONE_BG: Record<PhotoTone, string> = {
  navy: '#1B2C47',
  accent: '#B8551F',
  gray: '#3F4A5C',
  green: '#0B6B4C',
  purple: '#4E37B8',
  blue: '#1D3FA8',
  amber: '#8A5A16',
};

function Pattern({ pattern }: { pattern: PhotoPattern }) {
  if (pattern === 'plank') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0.25, 0.5, 0.75].map((y) => (
          <View key={y} style={[styles.line, { top: `${y * 100}%`, left: 0, right: 0, height: 1 }]} />
        ))}
      </View>
    );
  }
  if (pattern === 'panel') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[0.33, 0.66].map((x) => (
          <View key={x} style={[styles.line, { left: `${x * 100}%`, top: 0, bottom: 0, width: 1 }]} />
        ))}
        <View style={[styles.line, { top: '62%', left: 0, right: 0, height: 1 }]} />
      </View>
    );
  }
  if (pattern === 'mosaic') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.mosaic]} pointerEvents="none">
        {Array.from({ length: 12 }).map((_, index) => (
          <View key={index} style={styles.mosaicCell} />
        ))}
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0.33, 0.66].map((x) => (
        <View key={x} style={[styles.line, { left: `${x * 100}%`, top: 0, bottom: 0, width: 1 }]} />
      ))}
      {[0.5].map((y) => (
        <View key={y} style={[styles.line, { top: `${y * 100}%`, left: 0, right: 0, height: 1 }]} />
      ))}
    </View>
  );
}

/** 시공 사진 자리 (데모 샘플) — 톤 + 시공 패턴 + 공정 아이콘으로 현장 사진 느낌을 낸다 */
export function SitePhoto({
  tone = 'navy',
  pattern = 'tile',
  icon = 'image-outline',
  label,
  height = 72,
  width,
  style,
  rounded = radius.sm,
}: {
  tone?: PhotoTone;
  pattern?: PhotoPattern;
  icon?: IconName;
  label?: string;
  height?: number;
  width?: number | string;
  style?: ViewStyle;
  rounded?: number;
}) {
  return (
    <View
      style={[
        styles.photo,
        { backgroundColor: PHOTO_TONE_BG[tone], height, borderRadius: rounded },
        width === undefined ? { width: '100%' } : { width: width as number },
        style,
      ]}
      pointerEvents="none"
    >
      <Pattern pattern={pattern} />
      <View style={styles.glow} />
      <Ionicons name={icon} size={Math.max(14, Math.round(height * 0.28))} color="rgba(255,255,255,0.55)" />
      {label ? (
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  line: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.14)' },
  mosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    padding: 5,
    gap: 3,
  },
  mosaicCell: {
    width: '21%',
    height: '21%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  glow: {
    position: 'absolute',
    top: '-30%',
    right: '-18%',
    width: '70%',
    height: '90%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  label: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 4,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
  },
});
