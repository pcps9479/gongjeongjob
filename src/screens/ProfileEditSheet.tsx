import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip, FieldLabel, Stepper } from '../components/ui';
import { getTrade, TRADES } from '../data/trades';
import { color, radius } from '../theme';
import { Region, TradeKind, TradeRole, WorkType } from '../types';
import { useApp } from '../store/AppStore';

const ROLES: TradeRole[] = ['기공', '준기공', '조공'];
const REGIONS: Region[] = ['서울', '경기', '인천', '부산', '대전', '대구', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

export function ProfileEditSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { profile, updateProfile, showToast } = useApp();
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState<TradeRole>(profile.grade);
  const [years, setYears] = useState(profile.years);
  const [regions, setRegions] = useState<string[]>(profile.regions);
  const [trades, setTrades] = useState<TradeKind[]>(profile.trades);
  const [skills, setSkills] = useState<WorkType[]>(profile.skills);
  const [toolDrafts, setToolDrafts] = useState<Record<string, string>>({});
  const [bio, setBio] = useState(profile.bio);

  useEffect(() => {
    if (!visible) return;
    setName(profile.name);
    setGrade(profile.grade);
    setYears(profile.years);
    setRegions(profile.regions);
    setTrades(profile.trades);
    setSkills(profile.skills);
    const drafts: Record<string, string> = {};
    profile.trades.forEach((trade) => {
      const tools = profile.tradeTools[trade] ?? (trade === '타일' ? profile.tools : []);
      drafts[trade] = tools.join(', ');
    });
    setToolDrafts(drafts);
    setBio(profile.bio);
  }, [visible, profile]);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const toggleTrade = (trade: TradeKind) => {
    const next = toggle(trades, trade);
    setTrades(next);
    const allowed = next.flatMap((key) => getTrade(key).workTypes);
    setSkills((prev) => prev.filter((skill) => allowed.includes(skill)));
    setToolDrafts((prev) => ({ ...prev, [trade]: prev[trade] ?? '' }));
  };

  const save = () => {
    const tradeTools: Partial<Record<TradeKind, string[]>> = {};
    trades.forEach((trade) => {
      tradeTools[trade] = (toolDrafts[trade] ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    });
    updateProfile({
      name: name.trim() || profile.name,
      grade,
      years,
      regions,
      trades: trades.length ? trades : ['타일'],
      tradeTools,
      skills,
      tools: tradeTools['타일'] ?? profile.tools,
      bio: bio.trim(),
    });
    showToast('프로필을 저장했어요.');
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="프로필 수정"
      subtitle="발주처가 지원자 목록에서 보게 되는 정보입니다"
      footer={<Button label="저장하기" icon="checkmark" size="lg" onPress={save} />}
    >
      <View style={{ gap: 6 }}>
        <FieldLabel label="이름" required />
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="이름" placeholderTextColor={color.muted} />
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="등급" />
        <View style={styles.chipRow}>
          {ROLES.map((role) => (
            <Chip key={role} label={role} active={grade === role} onPress={() => setGrade(role)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="경력" />
        <View style={{ flexDirection: 'row' }}>
          <Stepper value={years} onChange={setYears} min={0} max={40} format={(v) => `${v}년`} />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="활동 지역" hint="복수 선택" />
        <View style={styles.chipRow}>
          {REGIONS.map((region) => (
            <Chip
              key={region}
              label={region}
              active={regions.includes(region)}
              onPress={() => setRegions((prev) => toggle(prev, region))}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="주력 공정" hint="복수 선택" />
        <View style={styles.chipRow}>
          {TRADES.map((trade) => (
            <Chip
              key={trade.key}
              label={trade.key}
              icon={trade.icon}
              active={trades.includes(trade.key)}
              onPress={() => toggleTrade(trade.key)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel label="공정별 보유 공구" hint="쉼표로 구분" />
        {trades.map((trade) => (
          <View key={trade} style={styles.toolBlock}>
            <View style={styles.toolLabelRow}>
              <Ionicons name={getTrade(trade).icon} size={12} color={color.inkSoft} />
              <Text style={styles.toolLabel}>{trade}</Text>
            </View>
            <TextInput
              value={toolDrafts[trade] ?? ''}
              onChangeText={(text) => setToolDrafts((prev) => ({ ...prev, [trade]: text }))}
              style={[styles.input, styles.toolInput]}
              placeholder={
                trade === '타일' ? '타일커터 1200, 습식 절단기' : `${trade} 공구를 적어주세요`
              }
              placeholderTextColor={color.muted}
              multiline
              textAlignVertical="top"
            />
          </View>
        ))}
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="시공 스킬" hint="주력 공정의 세부 시공" />
        {trades.map((trade) => (
          <View key={trade} style={{ gap: 5 }}>
            <Text style={styles.skillGroupLabel}>{trade}</Text>
            <View style={styles.chipRow}>
              {getTrade(trade).workTypes.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  active={skills.includes(skill)}
                  onPress={() => setSkills((prev) => toggle(prev, skill))}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="한 줄 소개" />
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[styles.input, styles.memo]}
          multiline
          textAlignVertical="top"
          placeholder="주력 공정과 강점을 적어주세요"
          placeholderTextColor={color.muted}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '600',
    color: color.ink,
  },
  memo: { minHeight: 68, lineHeight: 20 },
  toolInput: { minHeight: 58, lineHeight: 20, paddingTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toolBlock: { gap: 5 },
  toolLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolLabel: { fontSize: 11.5, fontWeight: '800', color: color.inkSoft },
  skillGroupLabel: { fontSize: 10.5, fontWeight: '800', color: color.muted },
});
