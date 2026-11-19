import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Button, Chip, FieldLabel } from '../components/ui';
import { useApp } from '../store/AppStore';
import { color, radius, space } from '../theme';
import { todayISO } from '../utils/date';
import { formatPhone } from '../utils/format';

/** 광고 · 제휴를 원하는 업종 (폐기물·용달·자재몰·세무/보험 등) */
const AD_CATEGORIES = ['폐기물·스카이', '1톤 용달', '온라인 건재몰', '전동공구·부자재', '세무·보험', '차량 리스', '기타'];

const AD_PRODUCTS = [
  { icon: 'megaphone' as const, label: '일자리 피드 1줄 스폰서 배너', note: '공정별 자동 노출' },
  { icon: 'grid' as const, label: '공정 탭 상단 노출', note: '철거·타일·목공 등' },
  { icon: 'people' as const, label: '기술자 소개 피드', note: '공구·자재몰 제휴' },
];

export function AdInquirySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { account, profile, showToast } = useApp();

  const [company, setCompany] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [receiptNo, setReceiptNo] = useState<string | null>(null);

  const wasVisible = useRef(visible);
  useEffect(() => {
    if (visible && !wasVisible.current) {
      setCompany(account?.businessName ?? '');
      setManager(account?.name ?? profile.name ?? '');
      setPhone(formatPhone(account?.phone ?? ''));
      setCategories([]);
      setMessage('');
      setError(null);
      setReceiptNo(null);
    }
    wasVisible.current = visible;
  }, [visible, account, profile]);

  const toggleCategory = (value: string) => {
    setCategories((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const submit = () => {
    if (company.trim().length < 2) {
      setError('업체명을 2자 이상 입력해 주세요.');
      return;
    }
    if (manager.trim().length < 2) {
      setError('담당자 이름을 입력해 주세요.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setError('연락 가능한 전화번호를 입력해 주세요.');
      return;
    }
    if (!categories.length) {
      setError('광고를 희망하는 업종을 1개 이상 골라주세요.');
      return;
    }
    setError(null);
    const dateKey = todayISO().replace(/-/g, '');
    setReceiptNo(`AD-${dateKey}-${Math.floor(1000 + Math.random() * 9000)}`);
    showToast('광고 · 제휴 문의가 접수됐어요. (데모)');
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="광고 · 제휴 문의"
      subtitle="자재몰·용달·폐기물·세무/보험 업체가 공정잡에 광고를 넣고 싶을 때 남기는 창구입니다."
      footer={
        receiptNo ? (
          <Button label="확인" size="lg" onPress={onClose} />
        ) : (
          <Button label="문의 접수하기" icon="send" size="lg" onPress={submit} />
        )
      }
    >
      <View testID="ad-inquiry-sheet" style={{ gap: space.x3 }}>
      {receiptNo ? (
        <>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>광고 · 제휴 문의가 접수됐어요</Text>
            <Text style={styles.successSub}>
              담당자가 확인 후 영업일 1~2일 안에 연락드립니다. (데모 접수 — 실제로는 발송되지 않습니다)
            </Text>
            <View style={styles.receiptBox}>
              <Text style={styles.receiptLabel}>접수번호</Text>
              <Text style={styles.receiptValue}>{receiptNo}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>접수 내용</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>업체</Text>
              <Text style={styles.summaryValue}>{company.trim()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>담당자</Text>
              <Text style={styles.summaryValue}>
                {manager.trim()} · {formatPhone(phone)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>희망 업종</Text>
              <Text style={styles.summaryValue}>{categories.join(' · ')}</Text>
            </View>
            {message.trim() ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>문의</Text>
                <Text style={styles.summaryValue}>{message.trim()}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.productsCard}>
            <Text style={styles.productsTitle}>광고 상품 예시</Text>
            {AD_PRODUCTS.map((item) => (
              <View key={item.label} style={styles.productRow}>
                <View style={styles.productIcon}>
                  <Ionicons name={item.icon} size={12} color={color.brand} />
                </View>
                <Text style={styles.productLabel}>{item.label}</Text>
                <Text style={styles.productNote}>{item.note}</Text>
              </View>
            ))}
            <Text style={styles.productsNote}>
              노출 위치·기간에 따라 월 30~50만 원 선에서 협의합니다. (데모 기준)
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <FieldLabel label="업체명" required />
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="예) 청담환경"
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </View>

          <View style={{ gap: 6 }}>
            <FieldLabel label="담당자" required />
            <TextInput
              value={manager}
              onChangeText={setManager}
              placeholder="예) 김민수 실장"
              placeholderTextColor={color.muted}
              style={styles.input}
            />
          </View>

          <View style={{ gap: 6 }}>
            <FieldLabel label="연락처" required hint="전화·문자 받을 번호" />
            <TextInput
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              placeholder="010-0000-0000"
              placeholderTextColor={color.muted}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={{ gap: 6 }}>
            <FieldLabel label="광고 희망 업종" required hint="복수 선택" />
            <View style={styles.chipRow}>
              {AD_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={categories.includes(item)}
                  onPress={() => toggleCategory(item)}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <FieldLabel label="문의 내용" hint="선택" />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="예) 철거 탭에 폐기물·스카이 배너를 넣고 싶습니다. 월 단가 알려주세요."
              placeholderTextColor={color.muted}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.memo]}
            />
          </View>

          <View style={styles.productsCard}>
            <Text style={styles.productsTitle}>이런 자리에 광고가 들어갑니다</Text>
            {AD_PRODUCTS.map((item) => (
              <View key={item.label} style={styles.productRow}>
                <View style={styles.productIcon}>
                  <Ionicons name={item.icon} size={12} color={color.brand} />
                </View>
                <Text style={styles.productLabel}>{item.label}</Text>
                <Text style={styles.productNote}>{item.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.demoNotice}>
            <Ionicons name="information-circle" size={13} color={color.amber} />
            <Text style={styles.demoNoticeText}>
              데모 폼입니다. 접수하면 접수번호가 발급되고, 실제 서비스에서는 담당자에게 알림이 갑니다.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={13} color={color.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </>
      )}
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
  memo: { minHeight: 76, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  productsCard: {
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 7,
  },
  productsTitle: { fontSize: 11.5, fontWeight: '800', color: color.inkSoft },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  productIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productLabel: { flex: 1, fontSize: 11.5, fontWeight: '700', color: color.ink },
  productNote: { fontSize: 10, fontWeight: '600', color: color.muted },
  productsNote: { fontSize: 10, lineHeight: 15, fontWeight: '600', color: color.muted, marginTop: 2 },

  demoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: color.amberSoft,
    borderRadius: radius.sm,
    padding: space.x3,
  },
  demoNoticeText: { flex: 1, fontSize: 10.5, lineHeight: 16, fontWeight: '600', color: '#8A5A0B' },

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

  successCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4FCF8',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#BFEBDC',
    padding: space.x4,
  },
  successIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: color.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontSize: 15.5, fontWeight: '800', color: color.ink },
  successSub: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: color.inkSoft,
    textAlign: 'center',
  },
  receiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  receiptLabel: { fontSize: 10.5, fontWeight: '700', color: color.muted },
  receiptValue: { fontSize: 13, fontWeight: '800', color: color.ink, letterSpacing: 0.2 },

  summaryCard: {
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 6,
  },
  summaryTitle: { fontSize: 11.5, fontWeight: '800', color: color.inkSoft },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  summaryLabel: { width: 52, fontSize: 10.5, fontWeight: '700', color: color.muted },
  summaryValue: { flex: 1, fontSize: 11.5, fontWeight: '700', color: color.ink, lineHeight: 17 },
});
