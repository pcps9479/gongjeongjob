import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, font, radius, shadow, space } from '../theme';

const absoluteFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  scrollable = true,
  maxHeightRatio = 0.92,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  maxHeightRatio?: number;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: useNative,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, anim]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [560, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[absoluteFill, styles.backdrop, { opacity: anim }]} />
        <Pressable style={absoluteFill} onPress={onClose} accessibilityLabel="닫기" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: `${Math.round(maxHeightRatio * 100)}%`, paddingBottom: Math.max(insets.bottom, 14) },
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="닫기"
              >
                <Ionicons name="close" size={20} color={color.inkSoft} />
              </Pressable>
            </View>

            {scrollable ? (
              <ScrollView
                style={{ flexShrink: 1 }}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.body}>{children}</View>
            )}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(13,22,38,0.46)' },
  keyboardWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.x5,
    paddingTop: 8,
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.lineStrong,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: space.x3,
  },
  title: { ...font.h2, color: color.ink },
  subtitle: { ...font.small, color: color.inkSoft, marginTop: 4, fontWeight: '500' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingBottom: space.x4, gap: space.x3 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: space.x3,
    gap: space.x2,
  },
});

export const sheetSectionStyle: ViewStyle = {
  backgroundColor: color.surfaceAlt,
  borderRadius: radius.md,
  padding: space.x3,
  gap: 6,
};
