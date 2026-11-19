import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Badge, Button, FieldLabel } from '../components/ui';
import { useApp } from '../store/AppStore';
import { color, font, radius } from '../theme';
import { formatBizNumber, maskPhone } from '../utils/format';

export function ContractorEditSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { account, updateAccount, showToast } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!visible || !account) return;
    setBusinessName(account.businessName ?? '');
    setBusinessNumber(account.businessNumber ?? '');
    setContactName(account.name);
    setVerified(!!account.businessVerified);
  }, [visible, account]);

  const save = () => {
    if (businessName.trim().length < 2) {
      showToast('업체명을 2자 이상 입력해 주세요.');
      return;
    }
    if (!verified) {
      showToast('사업자 인증을 먼저 완료해 주세요.');
      return;
    }
    updateAccount({
      businessName: businessName.trim(),
      businessNumber,
      businessVerified: true,
      name: contactName.trim() || account?.name,
    });
    showToast('업체 정보를 저장했어요.');
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="업체 정보 수정"
      subtitle="인증된 사업자 정보는 지원자에게 안심 배지로 표시됩니다"
      footer={<Button label="저장" icon="checkmark" size="lg" onPress={save} />}
    >
      <View style={styles.formCard}>
        <View style={{ gap: 7 }}>
          <FieldLabel label="업체명" required />
          <TextInput
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="예) 정한건설"
            placeholderTextColor={color.muted}
            style={styles.input}
          />
        </View>

        <View style={{ gap: 7 }}>
          <FieldLabel label="사업자등록번호" required hint="10자리" />
          <TextInput
            value={businessNumber}
            onChangeText={(text) => {
              setBusinessNumber(formatBizNumber(text));
              setVerified(false);
            }}
            placeholder="000-00-00000"
            placeholderTextColor={color.muted}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={() => {
            if (businessNumber.replace(/\D/g, '').length !== 10) {
              showToast('사업자등록번호 10자리를 입력해 주세요.');
              return;
            }
            setVerified(true);
            showToast('사업자 인증이 완료됐어요. (데모)');
          }}
          accessibilityRole="button"
          style={[styles.verifyBtn, verified && styles.verifyDone]}
        >
          <Ionicons
            name={verified ? 'shield-checkmark' : 'shield-checkmark-outline'}
            size={15}
            color={verified ? color.green : color.brand}
          />
          <Text style={[styles.verifyText, verified && { color: color.green }]}>
            {verified ? '사업자 인증 완료 (데모)' : '사업자 인증하기'}
          </Text>
        </Pressable>

        <View style={{ gap: 7 }}>
          <FieldLabel label="담당자 이름" />
          <TextInput
            value={contactName}
            onChangeText={setContactName}
            placeholder="현장 담당자 이름"
            placeholderTextColor={color.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.phoneRow}>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={styles.phoneLabel}>담당자 휴대폰</Text>
            <Text style={styles.phoneValue}>{maskPhone(account?.phone ?? '')}</Text>
          </View>
          <Badge label="본인인증 완료" tone="green" icon="shield-checkmark" small />
        </View>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={13} color={color.muted} />
        <Text style={styles.noteText}>
          사업자등록번호를 변경하면 인증을 다시 받아야 하며, 인증 전에는 공고 등록이 제한됩니다. (데모에서는 즉시 인증)
        </Text>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  formCard: { gap: 12 },
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
  verifyBtn: {
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
  verifyDone: { borderColor: '#BFEBDC', backgroundColor: color.greenSoft },
  verifyText: { fontSize: 12.5, fontWeight: '800', color: color.brand },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: 10,
  },
  phoneLabel: { fontSize: 10, fontWeight: '700', color: color.muted },
  phoneValue: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  note: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
  noteText: { flex: 1, ...font.tiny, fontSize: 10.5, lineHeight: 15, color: color.muted, fontWeight: '500' },
});
