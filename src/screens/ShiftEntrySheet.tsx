import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip, FieldLabel, Stepper } from '../components/ui';
import { getTrade, TRADES } from '../data/trades';
import { newId } from '../store/AppStore';
import { color, font, radius } from '../theme';
import { ShiftEntry, ShiftStatus, TradeKind } from '../types';
import { fullDateKo } from '../utils/date';
import { comma } from '../utils/format';

const STATUSES: ShiftStatus[] = ['예정', '확정', '완료'];

export function ShiftEntrySheet({
  visible,
  date,
  entry,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  date: string;
  entry: ShiftEntry | null;
  onClose: () => void;
  onSave: (entry: ShiftEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [siteName, setSiteName] = useState('');
  const [trade, setTrade] = useState<TradeKind>('타일');
  const [shift, setShift] = useState(1);
  const [dayRate, setDayRate] = useState('330000');
  const [status, setStatus] = useState<ShiftStatus>('예정');
  const [paid, setPaid] = useState(false);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (entry) {
      setSiteName(entry.siteName);
      setTrade(entry.trade);
      setShift(entry.shift);
      setDayRate(String(entry.dayRate));
      setStatus(entry.status);
      setPaid(entry.paid);
      setMemo(entry.memo ?? '');
    } else {
      setSiteName('');
      setTrade('타일');
      setShift(1);
      setDayRate('330000');
      setStatus('예정');
      setPaid(false);
      setMemo('');
    }
  }, [visible, entry]);

  const rate = Number(dayRate.replace(/[^0-9]/g, '') || '0');
  const amount = Math.round(shift * rate);

  const save = () => {
    if (siteName.trim().length < 1) {
      setError('현장명을 입력해 주세요.');
      return;
    }
    if (rate <= 0) {
      setError('일당을 입력해 주세요.');
      return;
    }
    onSave({
      id: entry?.id ?? newId('shift'),
      date,
      siteName: siteName.trim(),
      trade,
      shift,
      dayRate: rate,
      status,
      paid,
      memo: memo.trim() || undefined,
    });
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={entry ? '공수 수정' : '공수 추가'}
      subtitle={`${fullDateKo(date)} · ${trade} ${shift}공수 = ${comma(amount)}원`}
      footer={
        <View style={{ gap: 8 }}>
          <Button label={entry ? '수정 저장' : '공수 추가'} icon="checkmark" size="lg" onPress={save} />
          {entry ? (
            <Button
              label="이 공수 삭제"
              variant="danger"
              size="sm"
              icon="trash-outline"
              onPress={() => {
                onDelete(entry.id);
                onClose();
              }}
            />
          ) : null}
        </View>
      }
    >
      <View style={{ gap: 6 }}>
        <FieldLabel label="공정" hint="출역한 공정 태그" />
        <View style={styles.chipRow}>
          {TRADES.map((item) => (
            <Chip
              key={item.key}
              label={item.key}
              icon={item.icon}
              active={trade === item.key}
              onPress={() => {
                setTrade(item.key);
                if (!entry) setDayRate(String(getTrade(item.key).defaultDayRate));
              }}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="현장명" required />
        <TextInput
          value={siteName}
          onChangeText={(text) => {
            setSiteName(text);
            setError('');
          }}
          placeholder="예) 송파 헬리오시티 화장실"
          placeholderTextColor={color.muted}
          style={[styles.input, error ? styles.inputError : null]}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, gap: 6 }}>
          <FieldLabel label="공수" hint="반차는 0.5" />
          <Stepper
            value={shift}
            onChange={setShift}
            min={0.5}
            max={3}
            step={0.5}
            format={(v) => `${Number.isInteger(v) ? v : v.toFixed(1)}`}
          />
        </View>
        <View style={{ flex: 1.3, gap: 6 }}>
          <FieldLabel label="일당" required />
          <View style={styles.inputRow}>
            <TextInput
              value={dayRate ? comma(Number(dayRate)) : ''}
              onChangeText={(text) => setDayRate(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.rateInput}
            />
            <Text style={styles.unit}>원</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel label="상태" />
        <View style={styles.chipRow}>
          {STATUSES.map((item) => (
            <Chip key={item} label={item} active={status === item} onPress={() => setStatus(item)} />
          ))}
        </View>
      </View>

      <Pressable onPress={() => setPaid((v) => !v)} style={styles.paidRow}>
        <View style={[styles.checkBox, paid && styles.checkBoxOn]}>
          {paid ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.paidLabel}>임금 수령 완료</Text>
          <Text style={styles.paidHint}>{comma(amount)}원 입금 확인</Text>
        </View>
        <Ionicons name="wallet-outline" size={16} color={paid ? color.green : color.muted} />
      </Pressable>

      <View style={{ gap: 6 }}>
        <FieldLabel label="메모" />
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="예) 08:00 집합, 흡착기 지참"
          placeholderTextColor={color.muted}
          style={[styles.input, styles.memoInput]}
          multiline
          textAlignVertical="top"
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
    fontSize: 14.5,
    fontWeight: '600',
    color: color.ink,
  },
  inputError: { borderColor: color.red },
  error: { fontSize: 11, color: color.red, fontWeight: '600' },
  memoInput: { minHeight: 74, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  rateInput: { flex: 1, paddingVertical: 10, fontSize: 15, fontWeight: '800', color: color.ink },
  unit: { fontSize: 12, fontWeight: '700', color: color.muted },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
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
  checkBoxOn: { backgroundColor: color.green, borderColor: color.green },
  paidLabel: { fontSize: 13, fontWeight: '700', color: color.ink },
  paidHint: { ...font.tiny, color: color.muted, fontWeight: '600', marginTop: 1 },
});
