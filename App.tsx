import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBar } from './src/components/TabBar';
import { AuthScreen } from './src/screens/AuthScreen';
import { JobsScreen } from './src/screens/JobsScreen';
import { NotificationSheet } from './src/screens/NotificationSheet';
import { PostJobScreen } from './src/screens/PostJobScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ShiftCalendarScreen } from './src/screens/ShiftCalendarScreen';
import { AppProvider, useApp } from './src/store/AppStore';
import { color, font, radius, shadow, space } from './src/theme';
import { TabKey } from './src/types';

const TAB_META: Record<TabKey, { title: string; caption: string; contractorCaption?: string; technicianCaption?: string }> = {
  jobs: { title: '일자리 피드', caption: '전 공정 현장 구인 · 안심 매칭' },
  post: { title: '공고 등록', caption: '공정별 인원 모집', technicianCaption: '구직 자기소개 · 현장 공고 등록' },
  calendar: { title: '공수달력', caption: '공정별 출역 기록 · 수입 정산' },
  profile: { title: '내 프로필', caption: '주력 공정 · 포트폴리오', contractorCaption: '업체 정보 · 사업자 인증' },
};

function Splash() {
  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <View style={styles.splashLogo}>
        <Ionicons name="layers" size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.splashBrand}>공정잡</Text>
      <Text style={styles.splashTag}>공정별 인테리어 구인구직</Text>
      <ActivityIndicator color="#9FB0C7" style={{ marginTop: 14 }} />
    </View>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const { ready, account, guest, toast, unreadCount, feedMode } = useApp();
  const [tab, setTab] = useState<TabKey>('jobs');
  const [notifOpen, setNotifOpen] = useState(false);
  const [focusJobId, setFocusJobId] = useState<string | null>(null);

  const isContractor = account?.role === 'contractor';
  const accountId = account?.id;

  // 로그인·게스트 진입 시에만 기본 탭을 잡는다 (프로필 수정으로 탭이 튀지 않도록)
  useEffect(() => {
    if (guest && !accountId) {
      setTab('jobs');
      return;
    }
    if (!accountId) return;
    setTab(isContractor ? 'post' : 'jobs');
  }, [accountId, isContractor, guest]);

  const clearFocus = useCallback(() => setFocusJobId(null), []);

  const openJobFromNotification = useCallback((jobId: string) => {
    setTab('jobs');
    setFocusJobId(jobId);
  }, []);

  if (!ready) return <Splash />;
  if (!account && !guest) return <AuthScreen />;

  const meta = TAB_META[tab];
  const headerTitle = tab === 'jobs' && feedMode === 'workers' ? '기술자 자기소개' : meta.title;
  const headerCaption =
    tab === 'jobs' && feedMode === 'workers'
      ? '일할 기술자 찾기 · 섭외·연락 요청'
      : guest && tab === 'profile'
        ? '로그인하면 내 프로필이 열려요'
        : isContractor && meta.contractorCaption
          ? meta.contractorCaption
          : !isContractor && meta.technicianCaption
            ? meta.technicianCaption
            : meta.caption;

  const screens: { key: TabKey; node: React.ReactNode }[] = [
    { key: 'jobs', node: <JobsScreen focusJobId={focusJobId} onFocusHandled={clearFocus} /> },
    { key: 'post', node: <PostJobScreen onNavigate={setTab} /> },
    { key: 'calendar', node: <ShiftCalendarScreen /> },
    { key: 'profile', node: <ProfileScreen onNavigate={setTab} onOpenNotifications={() => setNotifOpen(true)} /> },
  ];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="layers" size={15} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>공정잡</Text>
          <View style={styles.betaTag}>
            <Text style={styles.betaText}>PROTO</Text>
          </View>
          {guest ? (
            <View style={styles.guestTag}>
              <Text style={styles.guestTagText}>둘러보기</Text>
            </View>
          ) : (
            <View style={styles.roleTag}>
              <Ionicons
                name={isContractor ? 'business' : 'hammer'}
                size={9}
                color="#FFD9C7"
              />
              <Text style={styles.roleTagText}>{isContractor ? '발주처' : '기술자'}</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setNotifOpen(true)}
            style={({ pressed }) => [styles.bell, pressed && { opacity: 0.6 }]}
            accessibilityLabel={`알림${unreadCount ? ` ${unreadCount}건` : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
            {unreadCount ? (
              <View style={styles.bellCount}>
                <Text style={styles.bellCountText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.caption}>{headerCaption}</Text>
          </View>
        </View>
      </View>

      <View style={styles.screenArea}>
        {screens.map((screen) => (
          <View
            key={screen.key}
            style={[styles.screen, { display: tab === screen.key ? 'flex' : 'none' }]}
          >
            {screen.node}
          </View>
        ))}
      </View>

      <TabBar tab={tab} onChange={setTab} bottomInset={insets.bottom} />

      <NotificationSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onOpenJob={openJobFromNotification}
      />

      {toast ? (
        <View style={[styles.toastWrap, { bottom: insets.bottom + 96 }]} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={15} color="#7CE3B8" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },

  splash: { flex: 1, backgroundColor: color.brand, alignItems: 'center', justifyContent: 'center', gap: 4 },
  splashLogo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  splashBrand: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6 },
  splashTag: { fontSize: 11.5, fontWeight: '600', color: '#9FB0C7' },

  header: {
    backgroundColor: color.brand,
    paddingHorizontal: space.x4,
    paddingBottom: space.x3,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  betaTag: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  betaText: { fontSize: 8.5, fontWeight: '800', color: '#C9D6E8', letterSpacing: 0.4 },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(240,90,34,0.22)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    marginLeft: 2,
  },
  roleTagText: { fontSize: 9, fontWeight: '800', color: '#FFD9C7' },
  guestTag: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    marginLeft: 2,
  },
  guestTagText: { fontSize: 9, fontWeight: '800', color: '#C9D6E8' },
  bell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCount: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: color.accent,
    borderWidth: 1.5,
    borderColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellCountText: { fontSize: 8.5, fontWeight: '800', color: '#FFFFFF' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: space.x3 },
  title: { fontSize: 23, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.6 },
  caption: { ...font.tiny, color: '#9FB0C7', fontWeight: '600', marginTop: 2 },

  screenArea: { flex: 1 },
  screen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(13,22,38,0.94)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
    ...shadow.sheet,
  },
  toastText: { ...font.small, color: '#FFFFFF', fontWeight: '600', flexShrink: 1 },
});
