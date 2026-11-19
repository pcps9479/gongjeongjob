import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TermsKey, TermsSheet } from '../components/TermsSheet';
import { Badge, Chip, Divider, SectionHeader, Stars } from '../components/ui';
import { getTrade } from '../data/trades';
import { portfolio, reviews } from '../data/seed';
import { useApp } from '../store/AppStore';
import { color, font, radius, shadow, space } from '../theme';
import { PortfolioItem, TabKey, TradeFilter, TradeKind, WorkType } from '../types';
import { maskPhone } from '../utils/format';
import { ContractorEditSheet } from './ContractorEditSheet';
import { ProfileEditSheet } from './ProfileEditSheet';
import { ReportSheet } from './ReportSheet';

const TONE_BG: Record<PortfolioItem['tone'], string> = {
  navy: '#1B2C47',
  accent: '#C4551F',
  green: '#0B7A55',
  purple: '#5B3FD1',
  gray: '#3F4A5C',
};

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  apple: 'Apple',
  phone: '휴대폰 번호',
};

function TilePattern() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0.33, 0.66].map((x) => (
        <View key={`v${x}`} style={[styles.patternLine, { left: `${x * 100}%`, top: 0, bottom: 0, width: 1 }]} />
      ))}
      {[0.5].map((y) => (
        <View key={`h${y}`} style={[styles.patternLine, { top: `${y * 100}%`, left: 0, right: 0, height: 1 }]} />
      ))}
    </View>
  );
}

function SettingRow({
  icon,
  label,
  caption,
  right,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  caption?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.settingRow, pressed && onPress ? { opacity: 0.65 } : null]}
    >
      <Ionicons name={icon} size={16} color={danger ? color.red : color.inkSoft} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.settingLabel, danger && { color: color.red }]}>{label}</Text>
        {caption ? <Text style={styles.settingCaption}>{caption}</Text> : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={15} color={color.muted} /> : null}
    </Pressable>
  );
}

export function ProfileScreen({ onNavigate, onOpenNotifications }: { onNavigate?: (tab: TabKey) => void; onOpenNotifications?: () => void }) {
  const {
    profile,
    appliedIds,
    myJobs,
    resetDemo,
    showToast,
    account,
    guest,
    reports,
    unreadCount,
    signOut,
    exitGuest,
  } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [businessEditOpen, setBusinessEditOpen] = useState(false);
  const [portfolioTrade, setPortfolioTrade] = useState<TradeFilter>('전체');
  const [resetArmed, setResetArmed] = useState(false);
  const [termsDoc, setTermsDoc] = useState<TermsKey | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [logoutArmed, setLogoutArmed] = useState(false);
  const [switchArmed, setSwitchArmed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isContractor = account?.role === 'contractor';
  const initials = (isContractor ? account?.businessName ?? account?.name ?? profile.name : profile.name).slice(0, 1);
  const portfolioTrades = Array.from(new Set(portfolio.map((item) => item.trade)));
  const shownPortfolio =
    portfolioTrade === '전체' ? portfolio : portfolio.filter((item) => item.trade === portfolioTrade);
  const tradeToolGroups = profile.trades.map((trade: TradeKind) => ({
    trade,
    tools: profile.tradeTools[trade] ?? (trade === '타일' ? profile.tools : []),
  }));

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      showToast('한 번 더 누르면 데모 데이터가 초기화됩니다.');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setResetArmed(false), 3500);
      return;
    }
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setResetArmed(false);
    resetDemo();
    showToast('데모 데이터를 초기화했어요.');
  };

  const handleLogout = () => {
    if (!logoutArmed) {
      setLogoutArmed(true);
      showToast('한 번 더 누르면 로그아웃됩니다.');
      setTimeout(() => setLogoutArmed(false), 3500);
      return;
    }
    setLogoutArmed(false);
    signOut();
  };

  /* ─────────── 로그인 없이 둘러보는 중 ─────────── */
  if (guest) {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <Ionicons name="person-add" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.guestTitle}>지금은 둘러보기 중이에요</Text>
            <Text style={styles.guestText}>
              로그인하면 지원·알림·공수 관리가 열리고, 발주처에게 내 프로필이 안전하게 전달됩니다.
            </Text>
            <Pressable onPress={exitGuest} accessibilityRole="button" style={styles.guestCta}>
              <Ionicons name="log-in-outline" size={15} color="#FFFFFF" />
              <Text style={styles.guestCtaText}>로그인 · 회원가입</Text>
            </Pressable>
          </View>

          <View style={styles.settingsCard}>
            <SectionHeader title="둘러보기에서 되는 것" caption="로그인 없이 공고와 프로필 구조를 확인해 보세요" />
            {[
              { icon: 'briefcase-outline' as const, label: '공정별 공고·단가·현장 조건 보기' },
              { icon: 'notifications-outline' as const, label: '알림함 미리보기 (로그인 후 수신)' },
              { icon: 'shield-checkmark-outline' as const, label: '안전센터·신고 절차 확인' },
            ].map((item) => (
              <View key={item.label} style={styles.featureRow}>
                <Ionicons name={item.icon} size={14} color={color.green} />
                <Text style={styles.featureText}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.settingsCard}>
            <SettingRow icon="document-text-outline" label="약관 및 정책 보기" onPress={() => setTermsDoc('terms')} />
            <Divider />
            <SettingRow icon="refresh-outline" label="데모 데이터 초기화" danger onPress={handleReset} />
            <Divider />
            <SettingRow icon="information-circle-outline" label="공정잡 프로토타입" right={<Text style={styles.version}>v1.2.0</Text>} />
          </View>
        </ScrollView>

        <TermsSheet visible={!!termsDoc} initialDoc={termsDoc ?? 'terms'} onClose={() => setTermsDoc(null)} />
      </View>
    );
  }

  /* ─────────── 로그인 완료 ─────────── */
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isContractor ? (
          /* 발주처 프로필 */
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={[styles.avatar, { backgroundColor: color.brand }]}>
                <Ionicons name="business" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {account?.businessName || '업체명 미등록'}
                  </Text>
                  <Badge label="발주처" tone="purple" icon="business" small />
                </View>
                <Text style={styles.handle} numberOfLines={1}>
                  담당 {account?.name ?? profile.name} · 현장소장
                </Text>
                <Text style={styles.profileMeta}>
                  {maskPhone(account?.phone ?? '')} · 사업자 {account?.businessNumber ?? '미등록'}
                </Text>
              </View>
              <Pressable
                onPress={() => setBusinessEditOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="업체 정보 수정"
                style={styles.editBtn}
              >
                <Ionicons name="create-outline" size={15} color={color.ink} />
                <Text style={styles.editText}>수정</Text>
              </Pressable>
            </View>

            <View style={styles.badgeLine}>
              {account?.businessVerified ? (
                <Badge label="사업자 인증 완료" tone="green" icon="shield-checkmark" />
              ) : (
                <Badge label="사업자 인증 필요" tone="amber" icon="alert-circle" />
              )}
              {account?.phoneVerified ? <Badge label="휴대폰 인증" tone="green" icon="phone-portrait" /> : null}
              <Badge label="안심 매칭 발주처" tone="navy" icon="checkmark-circle" />
            </View>

            <View style={styles.contractorStats}>
              {[
                { label: '등록 공고', value: String(myJobs.length), unit: '건' },
                { label: '모집 중', value: String(myJobs.length), unit: '건' },
                { label: '거래 완료', value: '0', unit: '건' },
                { label: '평점', value: '신규', unit: '' },
              ].map((stat, index) => (
                <React.Fragment key={stat.label}>
                  {index > 0 ? <View style={styles.statLine} /> : null}
                  <View style={styles.statCell}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statUnit}>{stat.unit}</Text>
                    </View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        ) : (
          /* 기술자 프로필 */
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{profile.name}</Text>
                  <Badge label={profile.grade} tone="accent" icon="hammer" small />
                </View>
                <Text style={styles.handle} numberOfLines={1}>
                  {profile.handle} · 인테리어 기술자
                </Text>
                <Text style={styles.profileMeta}>
                  경력 {profile.years}년 · {profile.regions.join('·') || '활동 지역 미설정'}
                </Text>
              </View>
              <Pressable
                onPress={() => setEditOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="프로필 수정"
                style={styles.editBtn}
              >
                <Ionicons name="create-outline" size={15} color={color.ink} />
                <Text style={styles.editText}>수정</Text>
              </Pressable>
            </View>

            <View style={styles.badgeLine}>
              {account?.phoneVerified ? (
                <Badge label="휴대폰 인증 완료" tone="green" icon="shield-checkmark" />
              ) : (
                <Badge label="휴대폰 미인증" tone="amber" icon="alert-circle" />
              )}
              <Badge label="안심 이력 인증" tone="navy" icon="checkmark-circle" />
              <Badge label={`${appliedIds.length}건 지원 중`} tone="gray" icon="paper-plane" />
            </View>

            <Text style={styles.bio}>{profile.bio}</Text>

            <View style={styles.tradeBlock}>
              <Text style={styles.tradeBlockLabel}>주력 공정</Text>
              <View style={styles.tradeWrap}>
                {profile.trades.map((trade) => {
                  const config = getTrade(trade);
                  return (
                    <View key={trade} style={styles.tradeChip}>
                      <Ionicons name={config.icon} size={12} color={color.brand} />
                      <View>
                        <Text style={styles.tradeChipName}>{trade}</Text>
                        <Text style={styles.tradeChipCaption} numberOfLines={1}>
                          {config.tagline}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.skillWrap}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Ionicons name="construct" size={11} color={color.brand} />
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 4 }}>
              {tradeToolGroups.map((group) => (
                <View key={group.trade} style={styles.toolRow}>
                  <Ionicons name="construct-outline" size={13} color={color.muted} />
                  <Text style={styles.toolText} numberOfLines={3}>
                    <Text style={{ fontWeight: '800', color: color.inkSoft }}>{group.trade}</Text> ·{' '}
                    {group.tools.join(', ') || '미등록'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {isContractor ? (
          <>
            {/* 등록한 공고 */}
            <View style={styles.settingsCard}>
              <SectionHeader
                title="내가 등록한 공고"
                caption="지원자 확인과 출역 확정은 공고 상세에서 진행해요"
                right={
                  <Pressable onPress={() => onNavigate?.('post')} style={styles.smallLink}>
                    <Text style={styles.smallLinkText}>공고 등록</Text>
                    <Ionicons name="add" size={12} color={color.accentDark} />
                  </Pressable>
                }
              />
              {myJobs.length ? (
                <View style={{ gap: 6, paddingBottom: space.x2 }}>
                  {myJobs.slice(0, 3).map((job) => (
                    <Pressable
                      key={job.id}
                      onPress={() => onNavigate?.('jobs')}
                      style={styles.myJobRow}
                    >
                      <View style={[styles.myJobIcon, { backgroundColor: color.brandSoft }]}>
                        <Ionicons name={getTrade(job.trade).icon} size={14} color={color.brand} />
                      </View>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text style={styles.myJobTitle} numberOfLines={1}>
                          {job.title}
                        </Text>
                        <Text style={styles.myJobMeta}>
                          {job.trade} · {job.region} {job.district} · {job.date}
                        </Text>
                      </View>
                      <Badge label="모집 중" tone="green" small />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyJobs}>
                  <Text style={styles.emptyJobsText}>아직 등록한 공고가 없어요. 첫 공고를 올려 인력을 모아보세요.</Text>
                  <Pressable onPress={() => onNavigate?.('post')} style={styles.emptyJobsBtn}>
                    <Text style={styles.emptyJobsBtnText}>공고 등록하기</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* 안심 이력 */}
            <View style={styles.trustCard}>
              <View style={styles.trustIcon}>
                <Ionicons name="shield-checkmark" size={20} color={color.green} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.trustTitle}>발주처 안심 이력</Text>
                <Text style={styles.trustSub}>최근 24개월 · 기술자 확인 완료</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label="노쇼 0회" tone="green" small />
                <Badge label="임금체불 0건" tone="green" small />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* 안심 이력 */}
            <Pressable
              onPress={() => showToast('최근 24개월 이력 기준입니다. 이력이 생기면 즉시 반영돼요.')}
              style={styles.trustCard}
            >
              <View style={styles.trustIcon}>
                <Ionicons name="shield-checkmark" size={20} color={color.green} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.trustTitle}>안심 이력 인증</Text>
                <Text style={styles.trustSub}>최근 24개월 · 발주처 확인 완료</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label="노쇼 0회" tone="green" small />
                <Badge label="임금체불 0건" tone="green" small />
              </View>
            </Pressable>

            {/* 지표 */}
            <View style={styles.statsCard}>
              {[
                { label: '완료 현장', value: '128', unit: '곳' },
                { label: '평균 평점', value: '4.9', unit: '/5' },
                { label: '재요청률', value: '87', unit: '%' },
                { label: '지원 중', value: String(appliedIds.length), unit: '건' },
              ].map((stat, index) => (
                <React.Fragment key={stat.label}>
                  {index > 0 ? <View style={styles.statLine} /> : null}
                  <View style={styles.statCell}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statUnit}>{stat.unit}</Text>
                    </View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {/* 포트폴리오 */}
            <View>
              <SectionHeader
                title="시공 포트폴리오"
                caption="공정별 현장 사진과 시공 면적을 함께 보여줄 수 있어요"
                right={<Text style={styles.sectionCount}>{shownPortfolio.length}건</Text>}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioFilter}>
                {(['전체', ...portfolioTrades] as TradeFilter[]).map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    active={portfolioTrade === item}
                    onPress={() => setPortfolioTrade(item)}
                  />
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioRow}>
                {shownPortfolio.map((item) => (
                  <View key={item.id} style={styles.portfolioCard}>
                    <View style={[styles.portfolioImage, { backgroundColor: TONE_BG[item.tone] }]}>
                      <TilePattern />
                      <View style={styles.portfolioBadge}>
                        <Text style={styles.portfolioBadgeText}>{item.tileSpec}</Text>
                      </View>
                      <View style={styles.portfolioArea}>
                        <Ionicons name="resize" size={11} color="#FFFFFF" />
                        <Text style={styles.portfolioAreaText}>
                          {item.area}
                          {item.areaUnit ?? '㎡'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.portfolioBody}>
                      <Text style={styles.portfolioTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.portfolioMeta}>
                        {item.date} · {item.contractor}
                      </Text>
                      <View style={styles.portfolioTags}>
                        <Badge label={item.trade} tone={getTrade(item.trade).tone} small />
                        {item.workTypes.map((type: WorkType) => (
                          <Badge key={type} label={type} tone="gray" small />
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 발주처 후기 */}
            <View>
              <SectionHeader
                title="발주처 후기"
                caption="채용 확정 후 발주처가 남긴 평가만 표시됩니다"
                right={
                  <View style={styles.ratingSummary}>
                    <Stars value={4.8} size={11} />
                    <Text style={styles.ratingSummaryText}>4.8</Text>
                  </View>
                }
              />
              <View style={{ gap: space.x2 }}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={styles.reviewNameRow}>
                          <Text style={styles.reviewContractor}>{review.contractor}</Text>
                          <Badge label={review.trade} tone={getTrade(review.trade).tone} small />
                        </View>
                        <Text style={styles.reviewSite} numberOfLines={1}>
                          {review.site}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <Stars value={review.rating} size={11} />
                        <Text style={styles.reviewDate}>{review.date}</Text>
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{review.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 본인인증 · 계정 */}
        <View>
          <SectionHeader title="본인인증" caption="채용 확정과 정산에 사용되는 인증 상태예요" />
          <View style={styles.verifyCard}>
            <View style={styles.verifyRow}>
              <View style={styles.verifyIcon}>
                <Ionicons name="phone-portrait" size={15} color={color.green} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={styles.verifyLabel}>휴대폰 본인인증</Text>
                <Text style={styles.verifyValue}>{maskPhone(account?.phone ?? '')}</Text>
              </View>
              <Badge label="인증 완료" tone="green" icon="shield-checkmark" small />
            </View>
            <Divider />
            <View style={styles.verifyRow}>
              <View style={[styles.verifyIcon, { backgroundColor: isContractor ? color.greenSoft : color.surfaceSunken }]}>
                <Ionicons name="business" size={15} color={isContractor ? color.green : color.muted} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={styles.verifyLabel}>사업자 인증</Text>
                <Text style={styles.verifyValue}>
                  {isContractor
                    ? `${account?.businessName ?? '업체'} · ${account?.businessNumber ?? ''}`
                    : '발주처 회원 전용'}
                </Text>
              </View>
              {isContractor ? (
                <Badge label="인증 완료" tone="green" icon="shield-checkmark" small />
              ) : (
                <Badge label="해당 없음" tone="gray" small />
              )}
            </View>
          </View>
        </View>

        {/* 계정 관리 */}
        <View>
          <SectionHeader title="계정 관리" caption="로그인 수단과 약관·안전센터를 관리해요" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="key-outline"
              label="로그인 정보"
              caption={`${PROVIDER_LABEL[account?.provider ?? 'phone'] ?? '휴대폰 번호'} · ${maskPhone(account?.phone ?? '')}`}
              right={<Badge label="본인인증" tone="green" small />}
            />
            <Divider />
            <SettingRow
              icon="swap-horizontal-outline"
              label={switchArmed ? '한 번 더 누르면 계정 전환' : '역할 · 계정 전환'}
              caption={switchArmed ? '로그인 화면에서 다른 계정으로 시작할 수 있어요' : isContractor ? '발주처 · 현장소장' : '시공 기술자'}
              onPress={() => {
                if (!switchArmed) {
                  setSwitchArmed(true);
                  showToast('한 번 더 누르면 로그아웃하고 로그인 화면으로 이동합니다.');
                  setTimeout(() => setSwitchArmed(false), 3500);
                  return;
                }
                setSwitchArmed(false);
                signOut();
              }}
            />
            <Divider />
            <SettingRow
              icon="notifications-outline"
              label="알림함"
              caption={unreadCount ? `읽지 않은 알림 ${unreadCount}건` : '새 알림 없음'}
              right={unreadCount ? <Badge label={`${unreadCount}`} tone="accent" small /> : null}
              onPress={onOpenNotifications}
            />
            <Divider />
            <SettingRow
              icon="document-text-outline"
              label="약관 및 정책"
              caption="이용약관 · 개인정보 처리방침 · 위치기반 서비스"
              onPress={() => setTermsDoc('terms')}
            />
          </View>
        </View>

        {/* 안전센터 */}
        <View>
          <SectionHeader title="안전센터" caption="노쇼·임금체불·허위공고를 신고하고 처리 내역을 확인해요" />
          <View style={styles.settingsCard}>
            <SettingRow
              icon="shield-outline"
              label="노쇼 · 임금체불 신고"
              caption={isContractor ? '작업자의 노쇼·허위 이력을 신고' : '발주처의 노쇼·임금체불을 신고'}
              onPress={() => setReportOpen(true)}
            />
            <Divider />
            <SettingRow
              icon="time-outline"
              label="내 신고 내역"
              caption={reports.length ? `최근 접수 ${reports[0]?.receiptNo}` : '접수된 신고가 없어요'}
              right={<Badge label={`${reports.length}건`} tone={reports.length ? 'amber' : 'gray'} small />}
              onPress={() =>
                showToast(
                  reports.length
                    ? `최근 신고 ${reports[0]?.receiptNo} · ${reports[0]?.status} 상태예요.`
                    : '접수된 신고가 없어요.',
                )
              }
            />
            <Divider />
            <SettingRow
              icon="call-outline"
              label="긴급 상담 · 고객센터"
              caption="평일 09:00~18:00 · safety@gongjeongjob.kr"
              onPress={() => showToast('안전센터 상담 1600-0000 (평일 09:00~18:00)')}
            />
          </View>
          {reports.length ? (
            <View style={styles.reportList}>
              {reports.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.reportItem}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.reportItemTitle} numberOfLines={1}>
                      {item.reason} · {item.targetName}
                    </Text>
                    <Text style={styles.reportItemMeta}>
                      {item.receiptNo} · {item.createdAt.replace('T', ' ').slice(0, 16)}
                    </Text>
                  </View>
                  <Badge label={item.status} tone="amber" small />
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* 기타 */}
        <View style={styles.settingsCard}>
          <SettingRow
            icon="refresh-outline"
            label={resetArmed ? '한 번 더 누르면 초기화' : '데모 데이터 초기화'}
            caption="등록 공고·지원·공수·신고 기록을 처음 상태로"
            danger
            onPress={handleReset}
          />
          <Divider />
          <SettingRow icon="information-circle-outline" label="공정잡 프로토타입" right={<Text style={styles.version}>v1.2.0 · Expo SDK 58</Text>} />
          <Divider />
          <SettingRow
            icon="log-out-outline"
            label={logoutArmed ? '한 번 더 누르면 로그아웃' : '로그아웃'}
            caption={logoutArmed ? '최근 계정은 남겨 두어 다시 로그인할 수 있어요' : undefined}
            danger
            onPress={handleLogout}
          />
        </View>

        <Text style={styles.footerNote}>
          {profile.name}님의 프로필은 지원한 발주처에만 공개되며, 채용 확정 전까지 연락처는 노출되지 않습니다.
        </Text>
      </ScrollView>

      <ProfileEditSheet visible={editOpen} onClose={() => setEditOpen(false)} />
      <ContractorEditSheet visible={businessEditOpen} onClose={() => setBusinessEditOpen(false)} />
      <TermsSheet visible={!!termsDoc} initialDoc={termsDoc ?? 'terms'} onClose={() => setTermsDoc(null)} />
      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        defaultTarget={isContractor ? 'worker' : 'contractor'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.x4, paddingBottom: 130, gap: space.x3 },

  profileCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x4,
    gap: 10,
    marginTop: space.x1,
    ...shadow.card,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  name: { ...font.h2, color: color.ink, flexShrink: 1 },
  handle: { ...font.tiny, color: color.muted, fontWeight: '600' },
  profileMeta: { ...font.tiny, color: color.inkSoft, fontWeight: '600' },
  badgeLine: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  editText: { fontSize: 11, fontWeight: '700', color: color.ink },
  bio: { ...font.small, color: color.inkSoft, lineHeight: 19, fontWeight: '500' },
  tradeBlock: { gap: 5 },
  tradeBlockLabel: { fontSize: 10.5, fontWeight: '800', color: color.muted, letterSpacing: 0.2 },
  tradeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.brandSoft,
    borderWidth: 1,
    borderColor: '#D5DDEA',
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  tradeChipName: { fontSize: 12, fontWeight: '800', color: color.brand },
  tradeChipCaption: { fontSize: 9.5, fontWeight: '600', color: color.inkSoft, maxWidth: 150 },
  skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.brandSoft,
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skillText: { fontSize: 11, fontWeight: '700', color: color.brand },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  toolText: { flex: 1, fontSize: 11.5, color: color.inkSoft, fontWeight: '600', lineHeight: 17 },

  contractorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: 10,
    marginTop: 2,
  },

  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.greenSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#BFEBDC',
    paddingHorizontal: space.x4,
    paddingVertical: space.x3,
  },
  trustIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: { fontSize: 13.5, fontWeight: '800', color: '#08694A' },
  trustSub: { fontSize: 10.5, fontWeight: '600', color: '#2E8A6B' },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    paddingVertical: space.x3,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2 },
  statLine: { width: 1, height: 26, backgroundColor: color.line },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: color.ink, letterSpacing: -0.4 },
  statUnit: { fontSize: 10.5, fontWeight: '700', color: color.muted },
  statLabel: { fontSize: 10.5, fontWeight: '600', color: color.muted },

  sectionCount: { ...font.tiny, color: color.muted, fontWeight: '700' },
  smallLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  smallLinkText: { fontSize: 11, fontWeight: '800', color: color.accentDark },

  myJobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  myJobIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  myJobTitle: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  myJobMeta: { fontSize: 10, fontWeight: '600', color: color.muted },

  emptyJobs: { gap: 8, paddingBottom: space.x2 },
  emptyJobsText: { ...font.small, color: color.inkSoft, lineHeight: 18, fontWeight: '500' },
  emptyJobsBtn: {
    alignSelf: 'flex-start',
    backgroundColor: color.brand,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyJobsBtnText: { fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' },

  portfolioRow: { gap: space.x2, paddingRight: space.x4 },
  portfolioFilter: { gap: 6, paddingBottom: 10 },
  portfolioCard: {
    width: 216,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    overflow: 'hidden',
  },
  portfolioImage: { height: 104, padding: 8, justifyContent: 'space-between' },
  patternLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.14)' },
  portfolioBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  portfolioBadgeText: { fontSize: 9.5, fontWeight: '700', color: '#FFFFFF' },
  portfolioArea: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  portfolioAreaText: { fontSize: 9.5, fontWeight: '700', color: '#FFFFFF' },
  portfolioBody: { padding: space.x3, gap: 4 },
  portfolioTitle: { fontSize: 13, fontWeight: '800', color: color.ink, lineHeight: 18 },
  portfolioMeta: { fontSize: 10.5, color: color.muted, fontWeight: '600' },
  portfolioTags: { flexDirection: 'row', gap: 4, marginTop: 2, flexWrap: 'wrap' },

  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingSummaryText: { fontSize: 12, fontWeight: '800', color: color.inkSoft },

  reviewCard: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x3,
    gap: 7,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewContractor: { fontSize: 13, fontWeight: '800', color: color.ink },
  reviewSite: { fontSize: 10.5, color: color.muted, fontWeight: '600' },
  reviewDate: { fontSize: 9.5, color: color.muted, fontWeight: '600' },
  reviewText: { fontSize: 12, lineHeight: 18, color: color.inkSoft, fontWeight: '500' },

  verifyCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.x4,
    paddingVertical: 4,
  },
  verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
  verifyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyLabel: { fontSize: 10.5, fontWeight: '700', color: color.muted },
  verifyValue: { fontSize: 12.5, fontWeight: '800', color: color.ink },

  settingsCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.x4,
    paddingTop: space.x3,
    paddingBottom: 2,
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: color.ink },
  settingCaption: { fontSize: 10, fontWeight: '500', color: color.muted, marginTop: 2, lineHeight: 14 },
  version: { fontSize: 10.5, color: color.muted, fontWeight: '600' },

  reportList: { gap: 6, marginTop: 6 },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.amberSoft,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#F8E0B6',
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  reportItemTitle: { fontSize: 12, fontWeight: '800', color: '#8A5A0B' },
  reportItemMeta: { fontSize: 9.5, fontWeight: '600', color: '#A9772A' },

  guestCard: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x5,
    alignItems: 'center',
    gap: 6,
    marginTop: space.x1,
    ...shadow.card,
  },
  guestIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  guestTitle: { ...font.h2, color: color.ink },
  guestText: { ...font.small, color: color.inkSoft, textAlign: 'center', lineHeight: 18, fontWeight: '500' },
  guestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.accent,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    height: 46,
    marginTop: 6,
  },
  guestCtaText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  featureText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: color.inkSoft },

  footerNote: {
    ...font.tiny,
    color: color.muted,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
});
