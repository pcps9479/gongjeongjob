import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Badge, Button, Chip, FieldLabel, Stepper } from '../components/ui';
import { SitePhoto } from '../components/SitePhoto';
import { availabilityLabel, rateLabel } from '../components/WorkerCard';
import { getTrade, payOptionOf, TRADES } from '../data/trades';
import { newId, useApp } from '../store/AppStore';
import { color, font, radius, space } from '../theme';
import {
  JobPost,
  PayType,
  PayUnit,
  Region,
  SiteConditions,
  TabKey,
  TradeKind,
  TradeRole,
  WorkType,
} from '../types';
import { addDays, monthDay, nowStamp, todayISO, weekdayKo } from '../utils/date';
import { comma } from '../utils/format';
import { UrgentMatchSheet } from './UrgentMatchSheet';
import { WorkerIntroSheet } from './WorkerIntroSheet';

const REGIONS: Region[] = ['서울', '경기', '인천', '부산', '대전', '대구', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TIMES = ['07:00', '07:30', '08:00', '08:30', '09:00', '10:00', '13:00'];
const ROLE_HINTS: Record<TradeRole, string> = {
  기공: '단독 시공 가능한 숙련공',
  준기공: '부분 시공·보조',
  조공: '자재 운반·정리',
};
const TITLE_PLACEHOLDER: Record<TradeKind, string> = {
  타일: '예) 송파 헬리오시티 84㎡ 화장실 2실',
  목공: '예) 성수동 사무실 가벽·천장 목공',
  철거: '예) 용산 상가 45평 전체철거',
  '도배·마루': '예) 잠실 아파트 34평 실크 도배',
  필름: '예) 마포 오피스텔 문·문틀 필름 12면',
  '전기·설비': '예) 송파 아파트 배선·조명 교체',
};

type Errors = Partial<Record<'title' | 'amount' | 'roles' | 'workTypes' | 'spec', string>>;

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.checkBox, checked && styles.checkBoxOn]}>
        {checked ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
      </View>
      <Text style={[styles.checkLabel, checked && { color: color.ink, fontWeight: '700' }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  caption,
  children,
  required,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {required ? <Badge label="필수" tone="accent" small /> : null}
      </View>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
      {children}
    </View>
  );
}

export function PostJobScreen({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const { profile, account, guest, addJob, showToast, setFeedTrade, myWorkerIntro, setFeedMode, workerIntros } =
    useApp();
  const today = todayISO();
  const isTechnician = account?.role === 'technician';

  /** 기술자는 기본이 ‘내 구직 자기소개’, 발주처는 기본이 ‘현장 공고 등록’ */
  const [mode, setMode] = useState<'job' | 'intro'>(isTechnician ? 'intro' : 'job');
  const [introOpen, setIntroOpen] = useState(false);
  const [urgentOpen, setUrgentOpen] = useState(false);

  // 로그인 계정이 바뀌면 역할에 맞는 기본 모드로
  const accountId = account?.id;
  useEffect(() => {
    setMode(isTechnician ? 'intro' : 'job');
  }, [accountId, isTechnician]);

  const [trade, setTrade] = useState<TradeKind>('타일');
  const [title, setTitle] = useState('');
  const [contractor, setContractor] = useState(
    account?.role === 'contractor'
      ? account.businessName || `${account.name} 인테리어`
      : `${profile.name} 인테리어`,
  );
  const [region, setRegion] = useState<Region>('서울');
  const [district, setDistrict] = useState('');
  const [date, setDate] = useState(addDays(today, 2));
  const [startTime, setStartTime] = useState('08:00');
  const [payType, setPayType] = useState<PayType>('일당');
  const [payUnit, setPayUnit] = useState<PayUnit | undefined>(undefined);
  const [amount, setAmount] = useState('');
  const [area, setArea] = useState('');
  const [heads, setHeads] = useState<Record<TradeRole, number>>({ 기공: 1, 준기공: 0, 조공: 0 });
  const [workTypes, setWorkTypes] = useState<WorkType[]>([getTrade('타일').workTypes[0]!]);
  const [specChoice, setSpecChoice] = useState(getTrade('타일').specs[2] ?? getTrade('타일').specs[0]!);
  const [customSpec, setCustomSpec] = useState('');
  const [conditions, setConditions] = useState<SiteConditions>(getTrade('타일').defaultConditions);
  const [siteChecks, setSiteChecks] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const config = getTrade(trade);
  const payOption = payOptionOf(trade, payType, payUnit);
  const dates = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(today, i)), [today]);
  const totalHeads = heads.기공 + heads.준기공 + heads.조공;
  const amountNumber = Number(amount || '0');
  const areaNumber = Number(area || '0');
  const spec = specChoice === '직접 입력' ? customSpec.trim() : specChoice;

  const changeTrade = (next: TradeKind) => {
    const nextConfig = getTrade(next);
    setTrade(next);
    setPayType('일당');
    setPayUnit(undefined);
    setWorkTypes([nextConfig.workTypes[0]!]);
    setSpecChoice(nextConfig.specs[0]!);
    setCustomSpec('');
    setConditions(nextConfig.defaultConditions);
    setSiteChecks([]);
    setAmount('');
    setArea('');
    setErrors({});
  };

  const selectPayOption = (type: PayType, unit?: PayUnit) => {
    setPayType(type);
    setPayUnit(unit);
    setAmount('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const toggleWorkType = (type: WorkType) => {
    setWorkTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    setErrors((prev) => ({ ...prev, workTypes: undefined }));
  };

  const toggleSiteCheck = (key: string) => {
    setSiteChecks((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const submit = () => {
    if (guest) {
      showToast('둘러보기 중에는 공고를 등록할 수 없어요. 로그인 후 이용해 주세요.');
      return;
    }
    const nextErrors: Errors = {};
    if (title.trim().length < 2) nextErrors.title = '현장명을 2자 이상 입력해 주세요.';
    if (amountNumber <= 0) {
      nextErrors.amount =
        payType === '도급' ? `${payOption.unit ?? '㎡'}당 단가를 입력해 주세요.` : '일당을 입력해 주세요.';
    }
    if (totalHeads === 0) nextErrors.roles = '모집할 직급 인원을 1명 이상 선택해 주세요.';
    if (workTypes.length === 0) nextErrors.workTypes = '시공 부위를 하나 이상 선택해 주세요.';
    if (!spec) nextErrors.spec = `${config.specLabel}을 입력해 주세요.`;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast('필수 항목을 확인해 주세요.');
      return;
    }

    const job: JobPost = {
      id: newId('job'),
      title: title.trim(),
      trade,
      region,
      district: district.trim() || '인근',
      date,
      startTime,
      payType,
      payUnit: payType === '도급' ? payOption.unit : undefined,
      payAmount: amountNumber,
      area: payType === '도급' ? areaNumber || undefined : undefined,
      roles: (['기공', '준기공', '조공'] as TradeRole[])
        .map((role) => ({ role, count: heads[role] }))
        .filter((r) => r.count > 0),
      tileSpec: spec,
      workTypes,
      conditions,
      siteChecks,
      memo: memo.trim() || '현장 상세 조건은 지원 후 발주처와 협의해 주세요.',
      contractor: contractor.trim() || `${profile.name} 인테리어`,
      contractorVerified: true,
      contractorRating: 5.0,
      contractorDeals: 1,
      createdAt: nowStamp(),
      isMine: true,
    };

    addJob(job);
    setFeedTrade(trade);
    showToast(`${trade} 공고를 등록했어요. 일자리 피드 최상단에 올라갑니다.`);
    setTitle('');
    setDistrict('');
    setAmount('');
    setArea('');
    setMemo('');
    setSiteChecks([]);
    setHeads({ 기공: 1, 준기공: 0, 조공: 0 });
    setErrors({});
    onNavigate('jobs');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.modeSwitch}>
          <Pressable
            onPress={() => setMode('job')}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'job' }}
            accessibilityLabel="현장 공고 등록"
            style={[styles.modeItem, mode === 'job' && styles.modeItemActive]}
          >
            <Ionicons name="megaphone" size={13} color={mode === 'job' ? '#FFFFFF' : color.inkSoft} />
            <Text style={[styles.modeLabel, mode === 'job' && styles.modeLabelActive]}>현장 공고</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('intro')}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'intro' }}
            accessibilityLabel="기술자 자기소개"
            style={[styles.modeItem, mode === 'intro' && styles.modeItemActive]}
          >
            <Ionicons name="people" size={13} color={mode === 'intro' ? '#FFFFFF' : color.inkSoft} />
            <Text style={[styles.modeLabel, mode === 'intro' && styles.modeLabelActive]}>기술자 자기소개</Text>
          </Pressable>
        </View>

        {mode === 'intro' ? (
          <>
            {isTechnician ? (
              <>
                <View style={styles.introHero}>
                  <Text style={styles.introKicker}>구직 자기소개</Text>
                  <Text style={styles.introTitle}>
                    {myWorkerIntro ? '내 자기소개가 올라가 있어요' : '일자리를 구하는 내 소개를 올려보세요'}
                  </Text>
                  <Text style={styles.introBody}>
                    공정·등급·경력, 출역 가능 날짜와 지역, 한 줄 소개와 시공 사진을 올리면 발주처가 먼저
                    <Text style={{ fontWeight: '800' }}> 섭외·연락 요청</Text>을 보냅니다.
                  </Text>
                </View>

                {myWorkerIntro ? (
                  <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                      <View style={styles.previewAvatar}>
                        <Text style={styles.previewAvatarText}>{myWorkerIntro.name.slice(0, 1)}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.previewName}>{myWorkerIntro.name}</Text>
                        <Text style={styles.previewMeta}>
                          {myWorkerIntro.trades[0]} · {myWorkerIntro.grade} · 경력 {myWorkerIntro.years}년
                        </Text>
                      </View>
                      {myWorkerIntro.photos.length ? (
                        <Badge label="시공사진 보유" tone="blue" icon="images" small />
                      ) : (
                        <Badge label="사진 없음" tone="gray" small />
                      )}
                    </View>
                    <Text style={styles.previewHeadline} numberOfLines={3}>
                      {myWorkerIntro.headline}
                    </Text>
                    <View style={styles.previewMetaRow}>
                      <Badge label={`${availabilityLabel(myWorkerIntro)} 출역`} tone="green" icon="calendar" small />
                      <Badge label={myWorkerIntro.regions.join('·') || '지역 협의'} tone="gray" icon="location" small />
                      <Badge label={rateLabel(myWorkerIntro)} tone="accent" icon="cash" small />
                    </View>
                    {myWorkerIntro.photos.length ? (
                      <View style={styles.previewPhotos}>
                        {myWorkerIntro.photos.map((photo) => (
                          <View key={photo.id} style={styles.previewPhotoCell}>
                            <SitePhoto
                              tone={photo.tone}
                              pattern={photo.pattern}
                              icon={getTrade(myWorkerIntro.trades[0] ?? '타일').icon}
                              height={52}
                              label={photo.part}
                            />
                          </View>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.previewActions}>
                      <Button label="자기소개 수정" icon="create" onPress={() => setIntroOpen(true)} style={{ flex: 1 }} />
                      <Button
                        label="피드에서 보기"
                        variant="outline"
                        icon="people"
                        onPress={() => {
                          setFeedMode('workers');
                          onNavigate('jobs');
                        }}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIcon}>
                      <Ionicons name="person-add" size={22} color={color.brand} />
                    </View>
                    <Text style={styles.emptyTitle}>아직 올린 자기소개가 없어요</Text>
                    <Text style={styles.emptyText}>
                      지금 올리면 ‘기술자 소개’ 피드 최상단에 노출되고, 발주처가 연락을 받을 수 있어요.
                    </Text>
                    <Button
                      label="구직 자기소개 작성하기"
                      icon="create"
                      size="lg"
                      onPress={() => setIntroOpen(true)}
                      style={{ alignSelf: 'stretch', marginTop: 4 }}
                    />
                  </View>
                )}

                <View style={styles.tipCard}>
                  <Ionicons name="bulb" size={14} color={color.amber} />
                  <Text style={styles.tipText}>
                    시공 사진 1건만 올려도 카드에 <Text style={{ fontWeight: '800' }}>시공사진 보유</Text> 배지가
                    붙어 섭외율이 올라갑니다. 이름 마스킹도 선택할 수 있어요.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.introHero}>
                  <Text style={styles.introKicker}>기술자 자기소개</Text>
                  <Text style={styles.introTitle}>일할 기술자를 먼저 찾아보세요</Text>
                  <Text style={styles.introBody}>
                    기술자가 직접 올린 구직 자기소개에서 공정·등급·경력, 출역 가능일, 시공 사진을 확인하고
                    <Text style={{ fontWeight: '800' }}> 섭외·연락 요청</Text>을 보낼 수 있습니다.
                  </Text>
                </View>

                <View style={styles.previewCard}>
                  <View style={styles.statRow}>
                    {[
                      { label: '등록된 자기소개', value: `${workerIntros.length}명` },
                      { label: '시공사진 보유', value: `${workerIntros.filter((w) => w.photos.length).length}명` },
                      { label: '오늘 출역 가능', value: `${workerIntros.filter((w) => w.availableFrom <= today).length}명` },
                    ].map((stat) => (
                      <View key={stat.label} style={styles.statCell}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                  <Button
                    label="기술자 자기소개 보기"
                    icon="people"
                    size="lg"
                    onPress={() => {
                      setFeedMode('workers');
                      onNavigate('jobs');
                    }}
                  />
                </View>

                <View style={styles.tipCard}>
                  <Ionicons name="information-circle" size={14} color={color.blue} />
                  <Text style={styles.tipText}>
                    발주처 계정은 공고를 등록하면 지원자 지원서가 들어옵니다. 먼저 연락할 기술자는 ‘기술자
                    소개’ 피드에서 찾아 섭외 요청을 보내세요.
                  </Text>
                </View>
              </>
            )}
          </>
        ) : (
          <>
        <View style={styles.intro}>
          <Ionicons name="megaphone" size={16} color={color.accentDark} />
          <Text style={styles.introText}>
            공정을 먼저 고르면 시공 부위·단가 방식·현장 조건이 그 공정에 맞게 바뀝니다. 등록한 공고는 바로{' '}
            <Text style={{ fontWeight: '800' }}>일자리 피드 최상단</Text>에 노출됩니다.
          </Text>
        </View>

        <Pressable
          testID="urgent-match-entry-post"
          onPress={() => setUrgentOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="긴급 펑크 자동 매칭 열기"
          style={({ pressed }) => [styles.urgentEntry, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.urgentEntryIcon}>
            <Ionicons name="flash" size={15} color="#16233A" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.urgentEntryTitle}>오늘 사람이 빠졌나요? 긴급 펑크 자동 매칭</Text>
            <Text style={styles.urgentEntrySub}>
              공고를 올리지 않고 조건만 골라 지금 출역 가능한 기술자에게 바로 알림을 보내요.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color="#9FB0C7" />
        </Pressable>

        <Section title="모집 공정" required caption="공정을 바꾸면 아래 입력 항목과 단가 기준이 함께 전환됩니다">
          <View style={styles.tradeGrid}>
            {TRADES.map((item) => {
              const active = trade === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => changeTrade(item.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.key} 공정 선택`}
                  accessibilityState={{ selected: active }}
                  style={[styles.tradeCard, active && styles.tradeCardActive]}
                >
                  <View style={[styles.tradeIcon, active && styles.tradeIconActive]}>
                    <Ionicons name={item.icon} size={15} color={active ? '#FFFFFF' : color.inkSoft} />
                  </View>
                  <Text style={[styles.tradeName, active && { color: '#FFFFFF' }]} numberOfLines={1}>
                    {item.key}
                  </Text>
                  {active ? <Ionicons name="checkmark-circle" size={13} color="#FFB98F" style={styles.tradeCheck} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.tradeHint}>
            <Ionicons name={config.icon} size={12} color={color.inkSoft} />
            <Text style={styles.tradeHintText}>
              {config.tagline} · {config.payOptions.map((option) => option.label).join(' / ')}
            </Text>
          </View>
        </Section>

        <Section title="현장 기본 정보" required>
          <FieldLabel label="현장명 / 공고 제목" required />
          <TextInput
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder={TITLE_PLACEHOLDER[trade]}
            placeholderTextColor={color.muted}
            style={[styles.input, errors.title ? styles.inputError : null]}
            returnKeyType="next"
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

          <View style={{ height: 6 }} />
          <FieldLabel label="발주처" hint="피드에 표시되는 이름" />
          <TextInput
            value={contractor}
            onChangeText={setContractor}
            placeholder="예) 정한건설"
            placeholderTextColor={color.muted}
            style={styles.input}
          />

          <View style={{ height: 10 }} />
          <FieldLabel label="지역" required />
          <View style={styles.wrapRow}>
            {REGIONS.map((item) => (
              <Chip key={item} label={item} active={region === item} onPress={() => setRegion(item)} />
            ))}
          </View>

          <View style={{ height: 10 }} />
          <FieldLabel label="세부 지역" hint="동·구 단위" />
          <TextInput
            value={district}
            onChangeText={setDistrict}
            placeholder="예) 송파구 잠실동"
            placeholderTextColor={color.muted}
            style={styles.input}
          />

          <View style={{ height: 10 }} />
          <FieldLabel label="작업일" required />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6 }}
            style={{ width: '100%' }}
          >
            {dates.map((iso) => {
              const active = date === iso;
              return (
                <Pressable
                  key={iso}
                  onPress={() => setDate(iso)}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                >
                  <Text style={[styles.dateChipWeek, active && { color: '#C9D4E4' }]}>
                    {iso === today ? '오늘' : weekdayKo(iso)}
                  </Text>
                  <Text style={[styles.dateChipDay, active && { color: '#FFFFFF' }]}>{monthDay(iso)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ height: 10 }} />
          <FieldLabel label="집합 시간" />
          <View style={styles.wrapRow}>
            {TIMES.map((time) => (
              <Chip key={time} label={time} active={startTime === time} onPress={() => setStartTime(time)} />
            ))}
          </View>
        </Section>

        <Section title="모집 직급" required caption="직급별 필요 인원을 정해주세요 (합계 1명 이상)">
          <View style={styles.roleList}>
            {(['기공', '준기공', '조공'] as TradeRole[]).map((role) => (
              <View key={role} style={styles.roleRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.roleName}>{role}</Text>
                  <Text style={styles.roleHint}>{ROLE_HINTS[role]}</Text>
                </View>
                <Stepper
                  value={heads[role]}
                  min={0}
                  max={12}
                  onChange={(next) => {
                    setHeads((prev) => ({ ...prev, [role]: next }));
                    setErrors((prev) => ({ ...prev, roles: undefined }));
                  }}
                  format={(v) => `${v}명`}
                />
              </View>
            ))}
          </View>
          <View style={styles.totalRow}>
            <Ionicons name="people" size={13} color={color.inkSoft} />
            <Text style={styles.totalText}>총 {totalHeads}명 모집</Text>
          </View>
          {errors.roles ? <Text style={styles.errorText}>{errors.roles}</Text> : null}
        </Section>

        <Section title="급여" required caption={`${trade} 공정 단가 방식 — ${config.payOptions.map((o) => o.label).join(' · ')}`}>
          <View style={styles.wrapRow}>
            {config.payOptions.map((option) => {
              const active = payType === option.type && payUnit === option.unit;
              return (
                <Chip
                  key={`${option.type}-${option.unit ?? 'day'}`}
                  label={option.label}
                  icon={option.type === '일당' ? 'cash-outline' : 'calculator-outline'}
                  active={active}
                  onPress={() => selectPayOption(option.type, option.unit)}
                />
              );
            })}
          </View>

          <View style={{ height: 10 }} />
          <View style={[styles.amountRow, errors.amount ? styles.inputError : null]}>
            <TextInput
              value={amount ? comma(amountNumber) : ''}
              onChangeText={(text) => {
                setAmount(text.replace(/[^0-9]/g, ''));
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              placeholder={payOption.placeholder}
              placeholderTextColor={color.muted}
              keyboardType="number-pad"
              style={styles.amountInput}
            />
            <Text style={styles.amountUnit}>{payOption.unitLabel}</Text>
          </View>
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          {payType === '도급' ? (
            <>
              <View style={{ height: 8 }} />
              <FieldLabel label={payOption.areaLabel ?? '시공 면적'} hint="도급비 계산용" />
              <View style={styles.areaRow}>
                <TextInput
                  value={area}
                  onChangeText={(text) => setArea(text.replace(/[^0-9.]/g, ''))}
                  placeholder="12"
                  placeholderTextColor={color.muted}
                  keyboardType="decimal-pad"
                  style={[styles.input, { flex: 1 }]}
                />
                <Text style={styles.areaUnit}>{payOption.areaUnit ?? '㎡'}</Text>
              </View>
              {amountNumber > 0 && areaNumber > 0 ? (
                <View style={styles.estimateRow}>
                  <Ionicons name="sparkles" size={12} color={color.purple} />
                  <Text style={styles.estimateText}>
                    도급 총액 약 {comma(amountNumber * areaNumber)}원 ({areaNumber}
                    {payOption.areaUnit ?? '㎡'} 기준)
                  </Text>
                </View>
              ) : null}
            </>
          ) : totalHeads > 0 && amountNumber > 0 ? (
            <View style={styles.estimateRow}>
              <Ionicons name="sparkles" size={12} color={color.purple} />
              <Text style={styles.estimateText}>
                하루 인건비 약 {comma(amountNumber * totalHeads)}원 ({totalHeads}명 기준)
              </Text>
            </View>
          ) : null}
        </Section>

        <Section title={`${trade} 시공 정보`} required>
          <FieldLabel label="시공 부위" hint="복수 선택" required />
          <View style={styles.wrapRow}>
            {config.workTypes.map((type) => (
              <Chip key={type} label={type} active={workTypes.includes(type)} onPress={() => toggleWorkType(type)} />
            ))}
          </View>
          {errors.workTypes ? <Text style={styles.errorText}>{errors.workTypes}</Text> : null}

          <View style={{ height: 10 }} />
          <FieldLabel label={config.specLabel} required />
          <View style={styles.wrapRow}>
            {config.specs.map((item) => (
              <Chip
                key={item}
                label={item}
                active={specChoice === item}
                onPress={() => {
                  setSpecChoice(item);
                  setErrors((prev) => ({ ...prev, spec: undefined }));
                }}
              />
            ))}
          </View>
          {specChoice === '직접 입력' ? (
            <TextInput
              value={customSpec}
              onChangeText={(text) => {
                setCustomSpec(text);
                setErrors((prev) => ({ ...prev, spec: undefined }));
              }}
              placeholder="예) 1200×2400 대형 포세린"
              placeholderTextColor={color.muted}
              style={[styles.input, { marginTop: 8 }]}
            />
          ) : null}
          {errors.spec ? <Text style={styles.errorText}>{errors.spec}</Text> : null}
        </Section>

        <Section title="현장 조건" caption={`${trade} 현장에서 지원자가 먼저 확인하는 항목이에요`}>
          <View style={styles.checkGrid}>
            {(['materials', 'hoisting', 'parking', 'meal', 'sameDayPay'] as (keyof SiteConditions)[]).map((key) => (
              <CheckRow
                key={key}
                label={config.conditionLabels[key].label}
                checked={conditions[key]}
                onToggle={() => setConditions((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
            ))}
            {config.checks.map((check) => (
              <CheckRow
                key={check.key}
                label={check.label}
                checked={siteChecks.includes(check.key)}
                onToggle={() => toggleSiteCheck(check.key)}
              />
            ))}
          </View>
        </Section>

        <Section title="상세 메모" caption="자재 위치, 층수, 주의사항 등을 적어주세요">
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="예) 자재 입고 완료. 3층, 엘리베이터 양중 가능. 줄눈 2mm."
            placeholderTextColor={color.muted}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.memoInput]}
          />
        </Section>

        <Button label={`${trade} 공고 등록하기`} icon="megaphone" size="lg" onPress={submit} style={{ marginTop: 4 }} />
        <Text style={styles.submitNote}>
          등록 후에도 지원자 프로필은 채용 확정 전까지 연락처가 공개되지 않습니다.
        </Text>
          </>
        )}
      </ScrollView>

      <WorkerIntroSheet visible={introOpen} onClose={() => setIntroOpen(false)} />
      <UrgentMatchSheet
        visible={urgentOpen}
        onClose={() => setUrgentOpen(false)}
        defaultTrade={trade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.x4, paddingBottom: 130, gap: space.x3 },

  urgentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: color.brand,
    borderRadius: radius.md,
    paddingHorizontal: space.x3,
    paddingVertical: 10,
  },
  urgentEntryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFD9C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentEntryTitle: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  urgentEntrySub: { fontSize: 10, lineHeight: 14, fontWeight: '600', color: '#9FB0C7' },

  modeSwitch: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: space.x1,
  },
  modeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    borderRadius: radius.pill,
  },
  modeItemActive: { backgroundColor: color.brand },
  modeLabel: { fontSize: 12.5, fontWeight: '800', color: color.inkSoft },
  modeLabelActive: { color: '#FFFFFF' },

  introHero: {
    backgroundColor: color.brand,
    borderRadius: radius.lg,
    padding: space.x4,
    gap: 5,
  },
  introKicker: { fontSize: 10.5, fontWeight: '800', color: '#FFB98F', letterSpacing: 0.2 },
  introTitle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.4 },
  introBody: { fontSize: 11.5, lineHeight: 18, fontWeight: '600', color: '#C9D6E8' },

  previewCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    gap: 9,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  previewName: { fontSize: 14.5, fontWeight: '800', color: color.ink },
  previewMeta: { fontSize: 10.5, fontWeight: '600', color: color.muted },
  previewHeadline: { fontSize: 13, lineHeight: 19, fontWeight: '600', color: color.ink },
  previewMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  previewPhotos: { flexDirection: 'row', gap: 5 },
  previewPhotoCell: { flex: 1 },
  previewActions: { flexDirection: 'row', gap: 8, marginTop: 2 },

  emptyCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    paddingTop: space.x5,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: { ...font.h3, color: color.ink },
  emptyText: {
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '600',
    color: color.muted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: color.amberSoft,
    borderRadius: radius.md,
    padding: space.x3,
  },
  tipText: { flex: 1, fontSize: 11, lineHeight: 17, fontWeight: '600', color: '#7A4A0B' },

  statRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: 10,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: color.ink },
  statLabel: { fontSize: 10, fontWeight: '700', color: color.muted },

  intro: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: color.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FFD9C7',
    padding: space.x3,
    marginTop: space.x1,
  },
  introText: { flex: 1, fontSize: 11.5, lineHeight: 17, color: '#8A3A16', fontWeight: '600' },

  section: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { ...font.h3, color: color.ink },
  sectionCaption: { ...font.tiny, color: color.muted, marginTop: 3, marginBottom: 10, fontWeight: '500' },

  tradeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 } as ViewStyle,
  tradeCard: {
    width: '31.8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surfaceAlt,
  },
  tradeCardActive: { backgroundColor: color.brand, borderColor: color.brand },
  tradeIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeIconActive: { backgroundColor: 'rgba(255,255,255,0.16)' },
  tradeName: { fontSize: 11.5, fontWeight: '800', color: color.ink, flexShrink: 1 },
  tradeCheck: { position: 'absolute', top: 3, right: 3 },
  tradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: color.brandSoft,
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tradeHintText: { flex: 1, fontSize: 10.5, fontWeight: '700', color: color.brand },

  input: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14.5,
    color: color.ink,
    fontWeight: '600',
  } as TextStyle,
  inputError: { borderColor: color.red, backgroundColor: '#FFF8F7' },
  errorText: { ...font.tiny, color: color.red, marginTop: 5, fontWeight: '600' },
  memoInput: { minHeight: 92, lineHeight: 21 },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },

  dateChip: {
    width: 54,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    gap: 2,
  },
  dateChipActive: { backgroundColor: color.brand, borderColor: color.brand },
  dateChipWeek: { fontSize: 10.5, fontWeight: '700', color: color.muted },
  dateChipDay: { fontSize: 13, fontWeight: '800', color: color.ink },

  roleList: {
    gap: 8,
    marginTop: 8,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleName: { fontSize: 14, fontWeight: '800', color: color.ink },
  roleHint: { fontSize: 11, color: color.muted, fontWeight: '600' },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, justifyContent: 'flex-end' },
  totalText: { fontSize: 12, fontWeight: '700', color: color.inkSoft },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 19,
    fontWeight: '800',
    color: color.ink,
    letterSpacing: -0.4,
  },
  amountUnit: { fontSize: 12.5, fontWeight: '700', color: color.muted, flexShrink: 0 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  areaUnit: { fontSize: 13, fontWeight: '700', color: color.muted },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: color.purpleSoft,
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  estimateText: { fontSize: 11.5, fontWeight: '700', color: color.purple },

  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginTop: 8 } as ViewStyle,
  checkRow: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 7, paddingRight: 4 },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOn: { backgroundColor: color.accent, borderColor: color.accent },
  checkLabel: { fontSize: 12.5, fontWeight: '600', color: color.inkSoft, flex: 1 },

  submitNote: { ...font.tiny, color: color.muted, textAlign: 'center', fontWeight: '500', marginTop: 2, lineHeight: 16 },
});
