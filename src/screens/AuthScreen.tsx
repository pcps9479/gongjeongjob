import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TermsSheet, TermsKey, TERMS_DOCS } from '../components/TermsSheet';
import { getTrade, TRADES } from '../data/trades';
import { newId, useApp } from '../store/AppStore';
import { color, font, radius, shadow, space } from '../theme';
import { AuthProvider, TradeKind, UserAccount, UserRole } from '../types';
import { nowStamp } from '../utils/date';
import { formatBizNumber, formatPhone, maskPhone } from '../utils/format';

type Step = 'welcome' | 'login' | 'name' | 'verify' | 'details' | 'terms';

const PROVIDERS: { key: AuthProvider; label: string; icon?: 'chatbubble-ellipses' | 'logo-apple' | 'call'; bg: string; fg: string; border: string; mark?: string }[] = [
  { key: 'kakao', label: '카카오로 계속하기', icon: 'chatbubble-ellipses', bg: '#FEE500', fg: '#3C1E1E', border: '#FEE500' },
  { key: 'naver', label: '네이버로 계속하기', bg: '#03C75A', fg: '#FFFFFF', border: '#03C75A', mark: 'N' },
  { key: 'apple', label: 'Apple로 계속하기', icon: 'logo-apple', bg: '#101828', fg: '#FFFFFF', border: '#101828' },
  { key: 'phone', label: '휴대폰 번호로 계속하기', icon: 'call', bg: '#FFFFFF', fg: color.ink, border: color.lineStrong },
];

const YEARS_OPTIONS: { label: string; value: number }[] = [
  { label: '1년 미만', value: 0 },
  { label: '1~3년', value: 2 },
  { label: '4~6년', value: 5 },
  { label: '7~10년', value: 9 },
  { label: '10년 이상', value: 13 },
];

const REGION_OPTIONS = ['서울', '경기', '인천', '부산', '대전', '대구', '광주', '울산'];

const providerLabel = (provider: AuthProvider) =>
  PROVIDERS.find((item) => item.key === provider)?.label.replace(/로 계속하기$/, '') ?? '휴대폰';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 7 }}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function StepHeader({ step, onBack }: { step: Step; onBack: () => void }) {
  if (step === 'login') {
    return (
      <View style={styles.stepHeader}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="뒤로" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={styles.stepCount}>계정 로그인</Text>
      </View>
    );
  }
  const index = step === 'name' ? 1 : step === 'verify' ? 2 : step === 'details' ? 3 : 4;
  return (
    <View style={styles.stepHeader}>
      <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="뒤로" style={styles.backBtn}>
        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
      </Pressable>
      <View style={styles.stepDots}>
        {[1, 2, 3, 4].map((n) => (
          <View key={n} style={[styles.stepDot, n <= index ? styles.stepDotOn : null]} />
        ))}
      </View>
      <Text style={styles.stepCount}>{index}/4</Text>
    </View>
  );
}

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, continueAsGuest, lastAccount, showToast } = useApp();

  const [step, setStep] = useState<Step>('welcome');
  const [role, setRole] = useState<UserRole | null>(null);
  const [provider, setProvider] = useState<AuthProvider>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<TradeKind[]>([]);
  const [years, setYears] = useState(5);
  const [regions, setRegions] = useState<string[]>(['서울']);
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [businessVerified, setBusinessVerified] = useState(false);
  const [agree, setAgree] = useState({ terms: false, privacy: false, location: false });
  const [termsDoc, setTermsDoc] = useState<TermsKey | null>(null);
  const [loginMode, setLoginMode] = useState(false);

  const digits = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const allAgreed = agree.terms && agree.privacy && agree.location;

  const goWelcome = () => {
    setStep('welcome');
    setLoginMode(false);
    setError(null);
    setCode('');
  };

  const chooseRole = (next: UserRole) => {
    setRole(next);
    setError(null);
  };

  const startSignup = (nextProvider: AuthProvider) => {
    if (!role) {
      setError('먼저 어떤 역할로 시작할지 골라주세요.');
      return;
    }
    setProvider(nextProvider);
    setError(null);
    setName(lastAccount && lastAccount.role === role ? lastAccount.name : '');
    setStep('name');
  };

  const startLogin = () => {
    setStep('login');
    setLoginMode(false);
    setError(null);
    setCode('');
    setPhone(lastAccount ? lastAccount.phone : '');
  };

  const sendCode = (forLogin: boolean) => {
    if (digits.length < 10) {
      setError('휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }
    const nextCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    setSentCode(nextCode);
    setCode('');
    setError(null);
    setLoginMode(forLogin);
    showToast(`인증번호를 발송했어요. 데모 번호는 ${nextCode}입니다.`);
  };

  const confirmCode = () => {
    if (!sentCode) {
      setError('인증번호를 먼저 받아주세요.');
      return;
    }
    if (code !== sentCode) {
      setError('인증번호가 일치하지 않아요. 다시 확인해 주세요.');
      return;
    }
    setError(null);
    if (loginMode) {
      const isSame = lastAccount && lastAccount.phone.replace(/\D/g, '') === digits;
      if (lastAccount && isSame) {
        signIn(lastAccount);
        showToast(`${lastAccount.name}님, 다시 오신 걸 환영해요.`);
        return;
      }
      setError('이 번호로 가입된 계정이 없어요. 같은 번호로 회원가입을 진행해 주세요.');
      return;
    }
    setStep('details');
  };

  const completeSignup = () => {
    if (!role || !allAgreed) return;
    const account: UserAccount = {
      id: newId('usr'),
      role,
      name: name.trim() || (role === 'contractor' ? businessName.trim() : '공정잡 회원'),
      handle: `@gj${digits.slice(-4)}`,
      phone: formatPhone(digits),
      provider,
      phoneVerified: true,
      trades: role === 'technician' ? trades : [],
      years: role === 'technician' ? years : undefined,
      regions: role === 'technician' ? regions : [],
      businessName: role === 'contractor' ? businessName.trim() : undefined,
      businessNumber: role === 'contractor' ? businessNumber : undefined,
      businessVerified: role === 'contractor' ? businessVerified : undefined,
      agreedTerms: true,
      agreedPrivacy: true,
      agreedLocation: true,
      createdAt: nowStamp(),
    };
    signIn(account);
    showToast(role === 'technician' ? '가입이 완료됐어요. 내 주변 현장을 찾아볼게요.' : '가입이 완료됐어요. 공고를 등록해 보세요.');
  };

  const toggleTrade = (trade: TradeKind) => {
    setTrades((prev) => (prev.includes(trade) ? prev.filter((item) => item !== trade) : [...prev, trade]));
  };

  const toggleRegion = (region: string) => {
    setRegions((prev) => (prev.includes(region) ? prev.filter((item) => item !== region) : [...prev, region]));
  };

  const verifyBusiness = () => {
    if (businessNumber.replace(/\D/g, '').length !== 10) {
      setError('사업자등록번호 10자리를 입력해 주세요.');
      return;
    }
    setBusinessVerified(true);
    setError(null);
    showToast('사업자 인증이 완료됐어요. (데모)');
  };

  const renderWelcome = () => (
    <>
      <View style={[styles.hero, { paddingTop: insets.top + 14 }]}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="layers" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>공정잡</Text>
          <View style={styles.betaTag}>
            <Text style={styles.betaText}>PROTO</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable onPress={startLogin} hitSlop={8} accessibilityRole="button" style={styles.loginLink}>
            <Text style={styles.loginLinkText}>로그인</Text>
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>현장과 기술자를{'\n'}공정으로 바로 잇다</Text>
        <Text style={styles.heroSub}>타일 · 목공 · 철거 · 도배·마루 · 필름 · 전기·설비</Text>

        <View style={styles.statRow}>
          {[
            { value: '6', label: '인테리어 공정' },
            { value: '23', label: '데모 공고' },
            { value: '0원', label: '중개 수수료' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCell}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <View>
          <Text style={styles.cardTitle}>어떤 역할로 시작할까요?</Text>
          <Text style={styles.cardCaption}>역할에 따라 첫 화면과 프로필 배지가 달라져요</Text>
        </View>

        <View style={styles.roleRow}>
          {(
            [
              {
                key: 'technician' as UserRole,
                icon: 'hammer' as const,
                title: '시공 기술자',
                lines: ['일자리 찾기', '공수·수입 관리'],
                badge: '기공 · 준기공 · 조공',
              },
              {
                key: 'contractor' as UserRole,
                icon: 'business' as const,
                title: '발주처 · 현장소장',
                lines: ['인력 구인', '포트폴리오 확인'],
                badge: '사업자 인증',
              },
            ]
          ).map((item) => {
            const active = role === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => chooseRole(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.title} 역할 선택`}
                style={[styles.roleCard, active && styles.roleCardActive]}
              >
                <View style={[styles.roleIcon, active && { backgroundColor: color.accent }]}>
                  <Ionicons name={item.icon} size={16} color={active ? '#FFFFFF' : color.brand} />
                </View>
                <Text style={[styles.roleTitle, active && { color: color.accentDark }]}>{item.title}</Text>
                {item.lines.map((line) => (
                  <Text key={line} style={styles.roleLine}>
                    · {line}
                  </Text>
                ))}
                <Text style={styles.roleBadge}>{item.badge}</Text>
                {active ? (
                  <View style={styles.roleCheck}>
                    <Ionicons name="checkmark-circle" size={16} color={color.accent} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={13} color={color.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>간편 로그인 · 회원가입</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={{ gap: 8 }}>
          {PROVIDERS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => startSignup(item.key)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.providerBtn,
                { backgroundColor: item.bg, borderColor: item.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              {item.icon ? (
                <Ionicons name={item.icon} size={17} color={item.fg} />
              ) : (
                <Text style={[styles.providerMark, { color: item.fg }]}>{item.mark}</Text>
              )}
              <Text style={[styles.providerText, { color: item.fg }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {lastAccount ? (
          <Pressable
            onPress={() => {
              signIn(lastAccount);
              showToast(`${lastAccount.name}님, 다시 오신 걸 환영해요.`);
            }}
            accessibilityRole="button"
            style={styles.recentCard}
          >
            <View style={styles.recentAvatar}>
              <Text style={styles.recentAvatarText}>{lastAccount.name.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.recentLabel}>최근 계정</Text>
              <Text style={styles.recentName} numberOfLines={1}>
                {lastAccount.role === 'contractor'
                  ? `${lastAccount.businessName ?? lastAccount.name} · 담당 ${lastAccount.name}`
                  : `${lastAccount.name} · 시공 기술자`}
              </Text>
            </View>
            <Text style={styles.recentCta}>이어서</Text>
            <Ionicons name="chevron-forward" size={14} color={color.inkSoft} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            continueAsGuest();
            showToast('둘러보기 모드로 입장했어요. 지원·등록은 로그인 후 가능해요.');
          }}
          accessibilityRole="button"
          style={styles.guestBtn}
        >
          <Text style={styles.guestText}>로그인 없이 둘러보기</Text>
          <Ionicons name="arrow-forward" size={13} color={color.inkSoft} />
        </Pressable>

        <Text style={styles.termsNote}>
          계속 진행하면{' '}
          <Text style={styles.termsLink} onPress={() => setTermsDoc('terms')}>
            이용약관
          </Text>
          {' · '}
          <Text style={styles.termsLink} onPress={() => setTermsDoc('privacy')}>
            개인정보 처리방침
          </Text>
          {' · '}
          <Text style={styles.termsLink} onPress={() => setTermsDoc('location')}>
            위치기반 서비스 약관
          </Text>
          에 동의하게 됩니다.
        </Text>
      </View>
    </>
  );

  const renderLogin = () => (
    <View style={styles.stepBody}>
      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepKicker}>로그인</Text>
        <Text style={styles.stepTitle}>다시 오셨네요</Text>
        <Text style={styles.stepSub}>가입할 때 인증한 휴대폰 번호로 로그인할 수 있어요.</Text>
      </View>

      {lastAccount ? (
        <Pressable
          onPress={() => {
            signIn(lastAccount);
            showToast(`${lastAccount.name}님, 다시 오신 걸 환영해요.`);
          }}
          accessibilityRole="button"
          style={styles.recentCard}
        >
          <View style={styles.recentAvatar}>
            <Text style={styles.recentAvatarText}>{lastAccount.name.slice(0, 1)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.recentName}>
              {lastAccount.role === 'contractor' ? lastAccount.businessName ?? lastAccount.name : lastAccount.name}
            </Text>
            <Text style={styles.recentMeta}>
              {maskPhone(lastAccount.phone)} · {providerLabel(lastAccount.provider)} ·{' '}
              {lastAccount.role === 'technician' ? '시공 기술자' : `담당 ${lastAccount.name}`}
            </Text>
          </View>
          <Text style={styles.recentCta}>로그인</Text>
        </Pressable>
      ) : null}

      <View style={styles.formCard}>
        <Field label="휴대폰 번호" hint="숫자만 입력해도 돼요">
          <TextInput
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            placeholder="010-0000-0000"
            placeholderTextColor={color.muted}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Field>

        {sentCode && loginMode ? (
          <Pressable onPress={() => sendCode(true)} accessibilityRole="button" style={styles.inlineBtn}>
            <Ionicons name="refresh" size={14} color={color.brand} />
            <Text style={styles.inlineBtnText}>인증번호 다시 받기</Text>
          </Pressable>
        ) : null}

        {sentCode && loginMode ? (
          <>
            <View style={styles.demoBox}>
              <Ionicons name="information-circle" size={14} color={color.blue} />
              <Text style={styles.demoText}>데모 인증번호 {sentCode} · 실제 문자는 발송되지 않아요.</Text>
            </View>
            <Field label="인증번호 6자리">
              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={color.muted}
                keyboardType="number-pad"
                style={[styles.input, styles.codeInput]}
              />
            </Field>
          </>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={13} color={color.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (sentCode && loginMode) confirmCode();
          else sendCode(true);
        }}
        accessibilityRole="button"
        style={[styles.primaryBtn, !sentCode && digits.length < 10 && styles.primaryBtnDim]}
      >
        <Text style={styles.primaryText}>{sentCode && loginMode ? '로그인' : '인증번호 받기'}</Text>
      </Pressable>

      <View style={styles.centerRow}>
        <Text style={styles.mutedText}>아직 계정이 없나요?</Text>
        <Pressable onPress={goWelcome} hitSlop={6}>
          <Text style={styles.linkText}>회원가입</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderName = () => (
    <View style={styles.stepBody}>
      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepKicker}>{providerLabel(provider)}로 시작</Text>
        <Text style={styles.stepTitle}>기본 정보를 알려주세요</Text>
        <Text style={styles.stepSub}>
          {role === 'technician' ? '현장에서 사용할 이름과 연락처를 입력해 주세요.' : '현장 담당자 이름과 연락처를 입력해 주세요.'}
        </Text>
      </View>

      <View style={styles.formCard}>
        <Field label={role === 'technician' ? '이름 · 닉네임' : '담당자 이름'}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="예) 차승민"
            placeholderTextColor={color.muted}
            style={styles.input}
          />
        </Field>

        <Field label="휴대폰 번호" hint="본인인증에 사용돼요">
          <TextInput
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            placeholder="010-0000-0000"
            placeholderTextColor={color.muted}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </Field>

        <View style={styles.privacyLine}>
          <Ionicons name="lock-closed" size={12} color={color.muted} />
          <Text style={styles.privacyText}>번호는 채용 확정 전까지 발주처에 공개되지 않습니다.</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={13} color={color.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (name.trim().length < 2) {
            setError('이름을 2자 이상 입력해 주세요.');
            return;
          }
          if (digits.length < 10) {
            setError('휴대폰 번호를 정확히 입력해 주세요.');
            return;
          }
          sendCode(false);
          setStep('verify');
        }}
        accessibilityRole="button"
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryText}>인증번호 받기</Text>
      </Pressable>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.stepBody}>
      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepKicker}>휴대폰 본인인증</Text>
        <Text style={styles.stepTitle}>인증번호 6자리를 입력해 주세요</Text>
        <Text style={styles.stepSub}>{formatPhone(digits)}로 인증번호를 보냈습니다.</Text>
      </View>

      <View style={styles.formCard}>
        <Field label="인증번호">
          <TextInput
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={color.muted}
            keyboardType="number-pad"
            style={[styles.input, styles.codeInput]}
          />
        </Field>

        {sentCode ? (
          <View style={styles.demoBox}>
            <Ionicons name="information-circle" size={14} color={color.blue} />
            <Text style={styles.demoText}>데모 인증번호 {sentCode} · 실제 문자는 발송되지 않아요.</Text>
          </View>
        ) : null}

        <View style={styles.verifyActions}>
          <Pressable onPress={() => sendCode(false)} accessibilityRole="button" style={styles.textBtn}>
            <Ionicons name="refresh" size={12} color={color.inkSoft} />
            <Text style={styles.textBtnLabel}>다시 받기</Text>
          </Pressable>
          <Pressable onPress={() => setStep('name')} accessibilityRole="button" style={styles.textBtn}>
            <Ionicons name="create-outline" size={12} color={color.inkSoft} />
            <Text style={styles.textBtnLabel}>번호 수정</Text>
          </Pressable>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={13} color={color.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={confirmCode}
        accessibilityRole="button"
        style={[styles.primaryBtn, code.length !== 6 && styles.primaryBtnDim]}
      >
        <Text style={styles.primaryText}>인증 확인</Text>
      </Pressable>

      <View style={styles.infoStrip}>
        <Ionicons name="shield-checkmark" size={14} color={color.green} />
        <Text style={styles.infoStripText}>
          인증이 완료되면 프로필에 <Text style={{ fontWeight: '800' }}>휴대폰 인증</Text> 배지가 표시됩니다.
        </Text>
      </View>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepBody}>
      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepKicker}>{role === 'technician' ? '기술자 정보' : '업체 정보'}</Text>
        <Text style={styles.stepTitle}>
          {role === 'technician' ? '주력 공정을 골라주세요' : '사업자 정보를 등록해 주세요'}
        </Text>
        <Text style={styles.stepSub}>
          {role === 'technician'
            ? '지금 바로 일할 수 있는 공정을 모두 선택하면 맞춤 공고를 먼저 보여드려요.'
            : '사업자 인증을 마치면 공고 등록과 지원자 확인이 가능해요.'}
        </Text>
      </View>

      {role === 'technician' ? (
        <>
          <View style={styles.formCard}>
            <Field label="주력 공정" hint="복수 선택">
              <View style={styles.chipWrap}>
                {TRADES.map((trade) => {
                  const active = trades.includes(trade.key);
                  return (
                    <Pressable
                      key={trade.key}
                      onPress={() => toggleTrade(trade.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${trade.key} 공정`}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Ionicons name={trade.icon} size={13} color={active ? '#FFFFFF' : color.inkSoft} />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{trade.key}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="경력">
              <View style={styles.chipWrap}>
                {YEARS_OPTIONS.map((option) => {
                  const active = years === option.value;
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => setYears(option.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label="활동 지역" hint="복수 선택">
              <View style={styles.chipWrap}>
                {REGION_OPTIONS.map((region) => {
                  const active = regions.includes(region);
                  return (
                    <Pressable
                      key={region}
                      onPress={() => toggleRegion(region)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{region}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
          </View>

          {trades.length ? (
            <View style={styles.selectedStrip}>
              <Ionicons name="construct" size={13} color={color.brand} />
              <Text style={styles.selectedText} numberOfLines={2}>
                {trades.map((trade) => getTrade(trade).tagline).join(' · ')}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.formCard}>
          <Field label="업체명">
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="예) 정한건설"
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </Field>

          <Field label="사업자등록번호" hint="10자리">
            <TextInput
              value={businessNumber}
              onChangeText={(text) => {
                setBusinessNumber(formatBizNumber(text));
                setBusinessVerified(false);
              }}
              placeholder="000-00-00000"
              placeholderTextColor={color.muted}
              keyboardType="number-pad"
              style={styles.input}
            />
          </Field>

          <Pressable
            onPress={verifyBusiness}
            accessibilityRole="button"
            style={[styles.verifyBizBtn, businessVerified && styles.verifyBizDone]}
          >
            <Ionicons
              name={businessVerified ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={15}
              color={businessVerified ? color.green : color.brand}
            />
            <Text style={[styles.verifyBizText, businessVerified && { color: color.green }]}>
              {businessVerified ? '사업자 인증 완료 (데모)' : '사업자 인증하기'}
            </Text>
          </Pressable>

          <View style={styles.infoStripLight}>
            <Ionicons name="information-circle-outline" size={13} color={color.muted} />
            <Text style={styles.infoStripLightText}>
              인증된 발주처만 공고를 등록할 수 있어 기술자에게 안심 매칭으로 표시됩니다.
            </Text>
          </View>
        </View>
      )}

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={13} color={color.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (role === 'technician') {
            if (!trades.length) {
              setError('주력 공정을 1개 이상 골라주세요.');
              return;
            }
            if (!regions.length) {
              setError('활동 지역을 1개 이상 골라주세요.');
              return;
            }
          } else {
            if (businessName.trim().length < 2) {
              setError('업체명을 입력해 주세요.');
              return;
            }
            if (!businessVerified) {
              setError('사업자 인증을 먼저 완료해 주세요.');
              return;
            }
          }
          setError(null);
          setStep('terms');
        }}
        accessibilityRole="button"
        style={styles.primaryBtn}
      >
        <Text style={styles.primaryText}>다음</Text>
      </Pressable>
    </View>
  );

  const renderTerms = () => (
    <View style={styles.stepBody}>
      <View style={styles.stepTitleBlock}>
        <Text style={styles.stepKicker}>마지막 단계</Text>
        <Text style={styles.stepTitle}>약관에 동의해 주세요</Text>
        <Text style={styles.stepSub}>필수 항목 3개를 확인하면 가입이 완료됩니다.</Text>
      </View>

      <View style={styles.formCard}>
        <Pressable
          onPress={() => {
            const next = !allAgreed;
            setAgree({ terms: next, privacy: next, location: next });
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: allAgreed }}
          style={styles.agreeAll}
        >
          <View style={[styles.checkbox, allAgreed && styles.checkboxOn]}>
            {allAgreed ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.agreeAllText}>전체 동의하기</Text>
        </Pressable>

        <View style={styles.dividerLineFull} />

        {TERMS_DOCS.map((doc) => {
          const checked = agree[doc.key];
          return (
            <View key={doc.key} style={styles.agreeRow}>
              <Pressable
                onPress={() => setAgree((prev) => ({ ...prev, [doc.key]: !prev[doc.key] }))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`${doc.title} 동의`}
                style={styles.agreePress}
              >
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agreeTitle}>
                    <Text style={{ color: color.accent }}>[필수] </Text>
                    {doc.title}
                  </Text>
                  <Text style={styles.agreeCaption}>{doc.short}</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => setTermsDoc(doc.key)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`${doc.title} 보기`}>
                <Text style={styles.docLink}>보기</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.infoStrip}>
        <Ionicons name="people" size={14} color={color.green} />
        <Text style={styles.infoStripText}>
          {role === 'technician'
            ? `${trades.length}개 공정 · ${regions.join('·')} 활동 · 경력 ${years}년으로 시작합니다.`
            : `${businessName || '업체'} · 사업자 인증 완료 상태로 시작합니다.`}
        </Text>
      </View>

      <Pressable
        onPress={completeSignup}
        disabled={!allAgreed}
        accessibilityRole="button"
        style={[styles.primaryBtn, !allAgreed && styles.primaryBtnDim]}
      >
        <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
        <Text style={styles.primaryText}>가입 완료</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            step !== 'welcome' && { backgroundColor: color.bg },
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'welcome' ? (
            renderWelcome()
          ) : (
            <>
              <View style={[styles.stepTop, { paddingTop: insets.top + 4 }]}>
                <StepHeader
                  step={step}
                  onBack={() => {
                    if (step === 'login') goWelcome();
                    else if (step === 'name') goWelcome();
                    else if (step === 'verify') setStep('name');
                    else if (step === 'details') setStep('verify');
                    else setStep('details');
                  }}
                />
              </View>
              <View style={styles.stepCard}>
                {step === 'login'
                  ? renderLogin()
                  : step === 'name'
                    ? renderName()
                    : step === 'verify'
                      ? renderVerify()
                      : step === 'details'
                        ? renderDetails()
                        : renderTerms()}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsSheet visible={!!termsDoc} initialDoc={termsDoc ?? 'terms'} onClose={() => setTermsDoc(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.brand },
  scroll: { flexGrow: 1, backgroundColor: color.brand },

  hero: { paddingHorizontal: space.x5, paddingBottom: space.x5, gap: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  betaTag: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  betaText: { fontSize: 8.5, fontWeight: '800', color: '#C9D6E8', letterSpacing: 0.4 },
  loginLink: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  loginLinkText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  heroTitle: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginTop: 8 },
  heroSub: { ...font.small, color: '#9FB0C7', fontWeight: '600' },
  statRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  statCell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingVertical: 9,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#9FB0C7' },

  card: {
    backgroundColor: color.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: space.x4,
    paddingTop: space.x5,
    paddingBottom: space.x4,
    gap: 12,
    flexGrow: 1,
  },
  cardTitle: { ...font.h2, color: color.ink },
  cardCaption: { ...font.small, color: color.inkSoft, fontWeight: '500', marginTop: 3 },

  roleRow: { flexDirection: 'row', gap: 8 },
  roleCard: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.line,
    padding: space.x3,
    gap: 2,
    minHeight: 132,
    ...shadow.card,
  },
  roleCardActive: { borderColor: color.accent, backgroundColor: '#FFFCFA' },
  roleIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  roleTitle: { fontSize: 14, fontWeight: '800', color: color.ink, letterSpacing: -0.3 },
  roleLine: { fontSize: 10.5, fontWeight: '600', color: color.inkSoft, marginTop: 1 },
  roleBadge: { fontSize: 9.5, fontWeight: '700', color: color.muted, marginTop: 6 },
  roleCheck: { position: 'absolute', top: 8, right: 8 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: color.line },
  dividerText: { fontSize: 10.5, fontWeight: '700', color: color.muted },

  providerBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  providerMark: { fontSize: 13, fontWeight: '900', width: 18, textAlign: 'center' },
  providerText: { fontSize: 14, fontWeight: '700' },

  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.lineStrong,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  recentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  recentLabel: { fontSize: 9.5, fontWeight: '700', color: color.muted },
  recentName: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  recentMeta: { fontSize: 10.5, fontWeight: '600', color: color.muted },
  recentCta: { fontSize: 11.5, fontWeight: '800', color: color.accentDark },

  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
  },
  guestText: { fontSize: 12.5, fontWeight: '700', color: color.inkSoft },

  termsNote: { fontSize: 10.5, lineHeight: 16, color: color.muted, textAlign: 'center', fontWeight: '500' },
  termsLink: { color: color.inkSoft, textDecorationLine: 'underline', fontWeight: '700' },

  stepTop: { paddingHorizontal: space.x4, paddingBottom: 26, backgroundColor: color.brand },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDots: { flex: 1, flexDirection: 'row', gap: 4 },
  stepDot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
  stepDotOn: { backgroundColor: color.accent },
  stepCount: { fontSize: 10.5, fontWeight: '800', color: '#9FB0C7' },

  stepCard: {
    backgroundColor: color.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -18,
    paddingBottom: 24,
    flexGrow: 1,
  },
  stepBody: { paddingHorizontal: space.x4, paddingTop: space.x5, gap: 12 },
  stepTitleBlock: { gap: 4 },
  stepKicker: { fontSize: 10.5, fontWeight: '800', color: color.accentDark, letterSpacing: 0.2 },
  stepTitle: { ...font.h1, color: color.ink, fontSize: 22 },
  stepSub: { ...font.small, color: color.inkSoft, fontWeight: '500', lineHeight: 18 },

  formCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    gap: 12,
    ...shadow.card,
  },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldLabel: { fontSize: 12.5, fontWeight: '800', color: color.inkSoft },
  fieldHint: { fontSize: 10, fontWeight: '600', color: color.muted },
  input: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '700',
    color: color.ink,
  },
  codeInput: { letterSpacing: 5, fontSize: 19, textAlign: 'center' },

  inlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: color.brandSoft,
  },
  inlineBtnText: { fontSize: 12.5, fontWeight: '800', color: color.brand },

  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.blueSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  demoText: { flex: 1, fontSize: 11, fontWeight: '700', color: '#1D3FA8', lineHeight: 16 },

  privacyLine: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  privacyText: { flex: 1, fontSize: 10.5, fontWeight: '500', color: color.muted },

  verifyActions: { flexDirection: 'row', gap: 8 },
  textBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
  },
  textBtnLabel: { fontSize: 11, fontWeight: '700', color: color.inkSoft },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
  },
  chipActive: { backgroundColor: color.brand, borderColor: color.brand },
  chipText: { fontSize: 12, fontWeight: '700', color: color.inkSoft },
  chipTextActive: { color: '#FFFFFF' },

  selectedStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: color.brandSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  selectedText: { flex: 1, fontSize: 11, fontWeight: '600', color: color.brand, lineHeight: 16 },

  verifyBizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#D5DDEA',
    backgroundColor: color.brandSoft,
  },
  verifyBizDone: { borderColor: '#BFEBDC', backgroundColor: color.greenSoft },
  verifyBizText: { fontSize: 12.5, fontWeight: '800', color: color.brand },
  infoStripLight: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  infoStripLightText: { flex: 1, fontSize: 10.5, lineHeight: 15, color: color.muted, fontWeight: '500' },

  agreeAll: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 2 },
  agreeAllText: { fontSize: 14.5, fontWeight: '800', color: color.ink },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: color.accent, borderColor: color.accent },
  dividerLineFull: { height: 1, backgroundColor: color.line },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agreePress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  agreeTitle: { fontSize: 12.5, fontWeight: '700', color: color.ink },
  agreeCaption: { fontSize: 10, fontWeight: '500', color: color.muted, marginTop: 1 },
  docLink: { fontSize: 11, fontWeight: '700', color: color.inkSoft, textDecorationLine: 'underline' },

  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.greenSoft,
    borderRadius: radius.sm,
    paddingHorizontal: space.x3,
    paddingVertical: 9,
  },
  infoStripText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#08694A', lineHeight: 16 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.redSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: { flex: 1, fontSize: 11, fontWeight: '700', color: color.red, lineHeight: 16 },

  primaryBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: color.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadow.card,
  },
  primaryBtnDim: { opacity: 0.45 },
  primaryText: { fontSize: 15.5, fontWeight: '800', color: '#FFFFFF' },

  centerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  mutedText: { fontSize: 11.5, fontWeight: '600', color: color.muted },
  linkText: { fontSize: 11.5, fontWeight: '800', color: color.accentDark },
});
