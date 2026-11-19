import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { SitePhoto } from '../components/SitePhoto';
import { Button, Chip, FieldLabel } from '../components/ui';
import { getTrade } from '../data/trades';
import { MAX_WORKER_PHOTOS, PHOTO_SAMPLES, TRADE_TOOLS } from '../data/workerIntros';
import { newId, useApp } from '../store/AppStore';
import { color, radius, space } from '../theme';
import { TradeKind, TradeRole, WorkType, WorkerIntro, WorkerPhoto } from '../types';
import { addDays, monthDay, nowStamp, todayISO, weekdayKo } from '../utils/date';
import { comma, maskName } from '../utils/format';

const ROLE_OPTIONS: TradeRole[] = ['기공', '준기공', '조공'];
const YEARS_OPTIONS = [
  { label: '1~3년', value: 2 },
  { label: '4~6년', value: 5 },
  { label: '7~10년', value: 9 },
  { label: '10년 이상', value: 13 },
];
const REGION_OPTIONS = ['서울', '경기', '인천', '부산', '대전', '대구', '광주', '울산'];
const PERIOD_OPTIONS = [3, 5, 7, 14, 30];
const HEADLINE_MAX = 90;

export function WorkerIntroSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { account, profile, myWorkerIntro, saveWorkerIntro, showToast } = useApp();
  const existing = myWorkerIntro;
  const today = todayISO();

  const [trades, setTrades] = useState<TradeKind[]>(existing?.trades ?? [profile.trades[0] ?? '타일']);
  const [grade, setGrade] = useState<TradeRole>(existing?.grade ?? profile.grade);
  const [years, setYears] = useState(existing?.years ?? profile.years);
  const [regions, setRegions] = useState<string[]>(existing?.regions ?? profile.regions);
  const [availableFrom, setAvailableFrom] = useState(existing?.availableFrom ?? today);
  const [availableDays, setAvailableDays] = useState(existing?.availableDays ?? 7);
  const [headline, setHeadline] = useState(existing?.headline ?? '');
  const [skills, setSkills] = useState<WorkType[]>(existing?.skills ?? profile.skills);
  const [tools, setTools] = useState<string[]>(existing?.tools ?? []);
  const [negotiable, setNegotiable] = useState(existing ? !existing.dayRate : true);
  const [dayRate, setDayRate] = useState(existing?.dayRate ? String(existing.dayRate) : '');
  const [photos, setPhotos] = useState<WorkerPhoto[]>(existing?.photos ?? []);
  const [masked, setMasked] = useState(!!existing?.masked);
  const [urgentToday, setUrgentToday] = useState(!!existing?.urgentToday);
  const [urgentTomorrow, setUrgentTomorrow] = useState(!!existing?.urgentTomorrow);
  const [error, setError] = useState<string | null>(null);

  // 시트를 다시 열 때 저장된 자기소개 값으로 초기화
  const wasVisible = useRef(visible);
  useEffect(() => {
    if (visible && !wasVisible.current) {
      setTrades(existing?.trades ?? [profile.trades[0] ?? '타일']);
      setGrade(existing?.grade ?? profile.grade);
      setYears(existing?.years ?? profile.years);
      setRegions(existing?.regions ?? profile.regions);
      setAvailableFrom(existing?.availableFrom ?? today);
      setAvailableDays(existing?.availableDays ?? 7);
      setHeadline(existing?.headline ?? '');
      setSkills(existing?.skills ?? profile.skills);
      setTools(existing?.tools ?? []);
      setNegotiable(existing ? !existing.dayRate : true);
      setDayRate(existing?.dayRate ? String(existing.dayRate) : '');
      setPhotos(existing?.photos ?? []);
      setMasked(!!existing?.masked);
      setUrgentToday(!!existing?.urgentToday);
      setUrgentTomorrow(!!existing?.urgentTomorrow);
      setError(null);
    }
    wasVisible.current = visible;
  }, [visible, existing, profile, today]);

  const primaryTrade = trades[0] ?? '타일';
  const config = getTrade(primaryTrade);
  const displayName = account?.name || profile.name;
  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);
  const skillOptions = useMemo(
    () => Array.from(new Set(trades.flatMap((trade) => getTrade(trade).workTypes))),
    [trades],
  );
  const toolOptions = useMemo(
    () => Array.from(new Set(trades.flatMap((trade) => TRADE_TOOLS[trade]))),
    [trades],
  );

  const toggleTrade = (trade: TradeKind) => {
    setTrades((prev) => (prev.includes(trade) ? prev.filter((item) => item !== trade) : [...prev, trade]));
    setSkills([]);
    setTools([]);
  };

  const toggleList = <T,>(list: T[], value: T, setter: (next: T[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const addPhoto = () => {
    if (photos.length >= MAX_WORKER_PHOTOS) {
      showToast(`시공 사진은 최대 ${MAX_WORKER_PHOTOS}건까지 올릴 수 있어요.`);
      return;
    }
    const sample = PHOTO_SAMPLES[photos.length % PHOTO_SAMPLES.length]!;
    setPhotos((prev) => [
      ...prev,
      {
        id: newId('wkp'),
        part: skillOptions[0] ?? config.workTypes[0] ?? '시공',
        caption: '',
        tone: sample.tone,
        pattern: sample.pattern,
      },
    ]);
  };

  const patchPhoto = (id: string, patch: Partial<WorkerPhoto>) => {
    setPhotos((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const save = () => {
    if (!trades.length) {
      setError('주력 공정을 1개 이상 골라주세요.');
      return;
    }
    if (!regions.length) {
      setError('출역 가능 지역을 1개 이상 골라주세요.');
      return;
    }
    if (headline.trim().length < 8) {
      setError('한 줄 자기소개를 8자 이상 적어주세요. (예: 타일 9년차 기공, 이번 주 서울·경기 출역 가능)');
      return;
    }
    const rate = Number(dayRate.replace(/[^0-9]/g, ''));
    if (!negotiable && rate <= 0) {
      setError('희망 일당을 입력하거나 ‘협의’를 골라주세요.');
      return;
    }
    setError(null);

    const intro: WorkerIntro = {
      id: existing?.id ?? newId('wk'),
      name: masked ? maskName(displayName) : displayName,
      masked,
      grade,
      years,
      trades,
      regions,
      availableFrom,
      availableDays,
      headline: headline.trim(),
      skills,
      tools,
      dayRate: negotiable ? undefined : rate,
      rating: existing?.rating ?? 5.0,
      deals: existing?.deals ?? 0,
      verified: true,
      photos: photos.map((photo) => ({ ...photo, caption: photo.caption.trim() || `${photo.part} 시공` })),
      urgentToday,
      urgentTomorrow,
      createdAt: existing?.createdAt ?? nowStamp(),
      isMine: true,
    };

    saveWorkerIntro(intro);
    showToast(
      existing
        ? '구직 자기소개를 수정했어요.'
        : '구직 자기소개를 올렸어요. 발주처 섭외 요청을 받을 수 있어요.',
    );
    onSaved?.();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={existing ? '구직 자기소개 수정' : '구직 자기소개 올리기'}
      subtitle="발주처가 내 시공 이력과 가능일을 보고 섭외 요청을 보낼 수 있어요."
      footer={<Button label={existing ? '수정 저장' : '자기소개 올리기'} icon="send" size="lg" onPress={save} />}
    >
      <View style={styles.introCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1)}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{masked ? maskName(displayName) : displayName}</Text>
          <Text style={styles.nameMeta}>
            {account?.phoneVerified ? '휴대폰 인증 완료' : '휴대폰 인증 전'} · {account?.handle ?? profile.handle}
          </Text>
        </View>
        <Pressable
          onPress={() => setMasked((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: masked }}
          accessibilityLabel="이름 마스킹"
          style={styles.maskRow}
        >
          <View style={[styles.checkbox, masked && styles.checkboxOn]}>
            {masked ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.maskLabel}>이름 마스킹</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <FieldLabel label="주력 공정" hint="첫 번째가 대표 공정이에요" required />
        <View style={styles.wrapRow}>
          {(['타일', '목공', '철거', '도배·마루', '필름', '전기·설비'] as TradeKind[]).map((trade) => (
            <Chip
              key={trade}
              label={trade}
              active={trades.includes(trade)}
              onPress={() => toggleTrade(trade)}
              icon={getTrade(trade).icon}
            />
          ))}
        </View>

        <View style={{ height: 10 }} />
        <FieldLabel label="등급" required />
        <View style={styles.wrapRow}>
          {ROLE_OPTIONS.map((item) => (
            <Chip key={item} label={item} active={grade === item} onPress={() => setGrade(item)} />
          ))}
        </View>

        <View style={{ height: 10 }} />
        <FieldLabel label="경력" />
        <View style={styles.wrapRow}>
          {YEARS_OPTIONS.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              active={years === option.value}
              onPress={() => setYears(option.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <FieldLabel label="출역 가능일" hint="첫 출역일" required />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {dates.map((iso) => {
            const active = availableFrom === iso;
            return (
              <Pressable
                key={iso}
                onPress={() => setAvailableFrom(iso)}
                accessibilityRole="button"
                accessibilityLabel={`출역 가능일 ${monthDay(iso)}`}
                style={[styles.dateChip, active && styles.dateChipActive]}
              >
                <Text style={[styles.dateWeek, active && { color: '#C9D4E4' }]}>
                  {iso === today ? '오늘' : weekdayKo(iso)}
                </Text>
                <Text style={[styles.dateDay, active && { color: '#FFFFFF' }]}>{monthDay(iso)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ height: 10 }} />
        <FieldLabel label="가능 기간" />
        <View style={styles.wrapRow}>
          {PERIOD_OPTIONS.map((days) => (
            <Chip key={days} label={`${days}일`} active={availableDays === days} onPress={() => setAvailableDays(days)} />
          ))}
        </View>

        <View style={{ height: 10 }} />
        <FieldLabel label="출역 지역" hint="복수 선택" required />
        <View style={styles.wrapRow}>
          {REGION_OPTIONS.map((region) => (
            <Chip
              key={region}
              label={region}
              active={regions.includes(region)}
              onPress={() => toggleList(regions, region, setRegions)}
            />
          ))}
        </View>

        <View style={{ height: 10 }} />
        <FieldLabel label="긴급 출역 알림" hint="발주처 긴급 펑크 매칭" />
        <View style={styles.wrapRow}>
          <Chip
            label="오늘 긴급 출역"
            icon="flash"
            active={urgentToday}
            onPress={() => setUrgentToday((prev) => !prev)}
          />
          <Chip
            label="내일 긴급 출역"
            icon="flash"
            active={urgentTomorrow}
            onPress={() => setUrgentTomorrow((prev) => !prev)}
          />
        </View>
        <Text style={styles.hint}>
          켜 두면 발주처가 긴급 펑크 자동 매칭을 보낼 때 조건이 맞는 기술자로 먼저 알림을 받습니다.
        </Text>
      </View>

      <View style={styles.section}>
        <FieldLabel label="한 줄 자기소개" hint={`${headline.length}/${HEADLINE_MAX}`} required />
        <TextInput
          value={headline}
          onChangeText={(text) => setHeadline(text.slice(0, HEADLINE_MAX))}
          placeholder="예) 타일 9년차 기공, 600·1200각 포세린·졸리컷 가능 / 이번 주 서울·경기 출역 가능합니다"
          placeholderTextColor={color.muted}
          multiline
          textAlignVertical="top"
          style={styles.headlineInput}
        />
        <Text style={styles.hint}>현장에서 바로 쓸 수 있는 공정·규격·가능일을 한 문장으로 적으면 섭외가 빨라져요.</Text>
      </View>

      <View style={styles.section}>
        <FieldLabel label="가능한 시공" hint="복수 선택" />
        <View style={styles.wrapRow}>
          {skillOptions.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              active={skills.includes(skill)}
              onPress={() => toggleList(skills, skill, setSkills)}
            />
          ))}
        </View>

        <View style={{ height: 10 }} />
        <FieldLabel label="보유 공구" hint="복수 선택" />
        <View style={styles.wrapRow}>
          {toolOptions.map((tool) => (
            <Chip
              key={tool}
              label={tool}
              active={tools.includes(tool)}
              onPress={() => toggleList(tools, tool, setTools)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <FieldLabel label="희망 일당" hint="비우면 협의" />
        <View style={styles.rateRow}>
          <View style={[styles.rateInputWrap, negotiable && { opacity: 0.45 }]}>
            <TextInput
              value={dayRate ? comma(Number(dayRate.replace(/[^0-9]/g, ''))) : ''}
              onChangeText={(text) => {
                setDayRate(text.replace(/[^0-9]/g, ''));
                if (text) setNegotiable(false);
              }}
              editable={!negotiable}
              placeholder="330000"
              placeholderTextColor={color.muted}
              keyboardType="number-pad"
              style={styles.rateInput}
            />
            <Text style={styles.rateUnit}>원 / 일</Text>
          </View>
          <Chip label="협의" active={negotiable} onPress={() => setNegotiable(true)} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.photoHeader}>
          <View style={{ flex: 1 }}>
            <FieldLabel label="시공 사진 · 작업물" hint={`선택 · 최대 ${MAX_WORKER_PHOTOS}건`} />
          </View>
          <Text style={styles.photoCount}>
            {photos.length}/{MAX_WORKER_PHOTOS}
          </Text>
        </View>
        <Text style={styles.hint}>
          사진을 1건이라도 올리면 카드에 <Text style={{ fontWeight: '800', color: color.blue }}>시공사진 보유</Text>{' '}
          배지가 붙고, 발주처가 작업물을 미리 볼 수 있어요. (데모: 현장 샘플 사진에서 선택)
        </Text>

        {photos.map((photo, index) => (
          <View key={photo.id} style={styles.photoEditor}>
            <View style={styles.photoEditorHeader}>
              <Text style={styles.photoEditorTitle}>작업물 {index + 1}</Text>
              <Pressable
                onPress={() => setPhotos((prev) => prev.filter((item) => item.id !== photo.id))}
                accessibilityRole="button"
                accessibilityLabel={`작업물 ${index + 1} 삭제`}
                style={styles.removeBtn}
              >
                <Ionicons name="trash-outline" size={12} color={color.red} />
                <Text style={styles.removeText}>삭제</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {PHOTO_SAMPLES.map((sample) => {
                const active = photo.tone === sample.tone && photo.pattern === sample.pattern;
                return (
                  <Pressable
                    key={`${sample.tone}-${sample.pattern}-${sample.label}`}
                    onPress={() => patchPhoto(photo.id, { tone: sample.tone, pattern: sample.pattern })}
                    accessibilityRole="button"
                    accessibilityLabel={`샘플 사진 ${sample.label}`}
                    style={[styles.sampleWrap, active && styles.sampleWrapActive]}
                  >
                    <SitePhoto
                      tone={sample.tone}
                      pattern={sample.pattern}
                      icon={config.icon}
                      height={44}
                      width={58}
                      rounded={radius.xs}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <FieldLabel label="시공 부위" />
            <View style={styles.wrapRow}>
              {skillOptions.map((skill) => (
                <Chip key={skill} label={skill} active={photo.part === skill} onPress={() => patchPhoto(photo.id, { part: skill })} />
              ))}
            </View>

            <View style={{ height: 8 }} />
            <TextInput
              value={photo.caption}
              onChangeText={(text) => patchPhoto(photo.id, { caption: text.slice(0, 60) })}
              placeholder="예) 600×1200 포세린, 줄눈 2mm 마감"
              placeholderTextColor={color.muted}
              style={styles.captionInput}
            />
          </View>
        ))}

        <Pressable
          onPress={addPhoto}
          accessibilityRole="button"
          accessibilityLabel="시공 사진 추가"
          style={({ pressed }) => [styles.addPhotoBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="camera-outline" size={15} color={color.brand} />
          <Text style={styles.addPhotoText}>
            {photos.length ? '작업물 추가' : '시공 사진 추가 (선택)'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={13} color={color.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  name: { fontSize: 14, fontWeight: '800', color: color.ink },
  nameMeta: { fontSize: 10.5, fontWeight: '600', color: color.muted },
  maskRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  maskLabel: { fontSize: 10.5, fontWeight: '700', color: color.inkSoft },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: color.accent, borderColor: color.accent },
  section: {
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 6,
  },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  dateChip: {
    width: 50,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    gap: 1,
  },
  dateChipActive: { backgroundColor: color.brand, borderColor: color.brand },
  dateWeek: { fontSize: 10, fontWeight: '700', color: color.muted },
  dateDay: { fontSize: 12, fontWeight: '800', color: color.ink },
  headlineInput: {
    minHeight: 66,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: color.ink,
  },
  hint: { fontSize: 10.5, lineHeight: 15, fontWeight: '600', color: color.muted, marginTop: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateInputWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 11,
  },
  rateInput: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 16, fontWeight: '800', color: color.ink },
  rateUnit: { fontSize: 11.5, fontWeight: '700', color: color.muted },
  photoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoCount: { fontSize: 11.5, fontWeight: '800', color: color.muted },
  photoEditor: {
    backgroundColor: color.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
    padding: space.x3,
    gap: 6,
    marginTop: 4,
  },
  photoEditorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoEditorTitle: { fontSize: 11.5, fontWeight: '800', color: color.ink },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  removeText: { fontSize: 10.5, fontWeight: '700', color: color.red },
  sampleWrap: {
    padding: 2,
    borderRadius: radius.xs + 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sampleWrapActive: { borderColor: color.accent },
  captionInput: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    fontWeight: '600',
    color: color.ink,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.lineStrong,
    backgroundColor: color.surface,
    marginTop: 6,
  },
  addPhotoText: { fontSize: 12.5, fontWeight: '800', color: color.brand },
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
});
