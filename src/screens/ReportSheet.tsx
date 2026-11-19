import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Sheet } from '../components/Sheet';
import { Badge, Button, FieldLabel } from '../components/ui';
import { useApp } from '../store/AppStore';
import { color, font, radius, space } from '../theme';
import { JobPost, ReportItem, ReportReason, ReportTarget } from '../types';
import { maskPhone } from '../utils/format';

const WORKERS = [
  { key: 'w1', name: '김도현', sub: '기공 · 경력 7년 · 성수동 사무실 목공' },
  { key: 'w2', name: '박정우', sub: '준기공 · 경력 4년 · 하남 미사 바닥 타일' },
  { key: 'w3', name: '이서준', sub: '조공 · 경력 1년 · 철거 현장' },
];

const REASONS: { key: ReportReason; icon: 'person-remove-outline' | 'wallet-outline' | 'alert-circle-outline'; desc: string }[] = [
  { key: '노쇼', icon: 'person-remove-outline', desc: '확정된 출역에 나오지 않았어요' },
  { key: '임금체불', icon: 'wallet-outline', desc: '약속한 임금이 지급되지 않았어요' },
  { key: '허위공고', icon: 'alert-circle-outline', desc: '공고 내용과 실제 현장이 달라요' },
];

export function ReportSheet({
  visible,
  onClose,
  job,
  defaultTarget = 'contractor',
}: {
  visible: boolean;
  onClose: () => void;
  job?: JobPost | null;
  defaultTarget?: ReportTarget;
}) {
  const { jobs, appliedIds, account, submitReport, showToast } = useApp();
  const [target, setTarget] = useState<ReportTarget>(defaultTarget);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [receipt, setReceipt] = useState<ReportItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const contractorOptions = useMemo(() => {
    const source = jobs.filter((item) => appliedIds.includes(item.id));
    const list = (source.length ? source : jobs.slice(0, 6)).slice();
    const options: { key: string; name: string; sub: string; jobId?: string; jobTitle?: string }[] = [];
    const seen = new Set<string>();
    list.forEach((item) => {
      if (seen.has(item.contractor)) return;
      seen.add(item.contractor);
      options.push({ key: item.id, name: item.contractor, sub: item.title, jobId: item.id, jobTitle: item.title });
    });
    if (job && !seen.has(job.contractor)) {
      options.unshift({ key: job.id, name: job.contractor, sub: job.title, jobId: job.id, jobTitle: job.title });
    } else if (job) {
      const index = options.findIndex((option) => option.name === job.contractor);
      if (index > 0) options.unshift(options.splice(index, 1)[0]!);
    }
    return options.slice(0, 4);
  }, [jobs, appliedIds, job]);

  const options = target === 'contractor' ? contractorOptions : WORKERS;

  useEffect(() => {
    if (!visible) return;
    const preferred = job
      ? contractorOptions.find((option) => option.name === job.contractor)?.key ?? contractorOptions[0]?.key
      : undefined;
    const firstKey =
      defaultTarget === 'contractor' ? contractorOptions[0]?.key ?? null : WORKERS[0]!.key;
    setTarget(defaultTarget);
    setPickedKey(preferred ?? firstKey);
    setReason(null);
    setDetail('');
    setReceipt(null);
    setError(null);
  }, [visible, job, defaultTarget, contractorOptions]);

  const picked = options.find((option) => option.key === pickedKey) ?? null;
  const detailReady = detail.trim().length >= 10;
  const canSubmit = !!picked && !!reason && detailReady;

  const close = () => {
    if (receipt) showToast(`신고 접수번호 ${receipt.receiptNo}로 접수됐어요.`);
    onClose();
  };

  const submit = () => {
    if (!picked || !reason) {
      setError('신고 대상과 사유를 선택해 주세요.');
      return;
    }
    if (!detailReady) {
      setError('상세 내용을 10자 이상 적어주세요.');
      return;
    }
    const selectedJob = contractorOptions.find((option) => option.key === pickedKey);
    const item = submitReport({
      target,
      targetName: picked.name,
      reason,
      detail,
      jobId: target === 'contractor' ? selectedJob?.jobId : undefined,
      jobTitle: target === 'contractor' ? selectedJob?.jobTitle : picked.sub,
    });
    setError(null);
    setReceipt(item);
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={receipt ? '신고 접수 완료' : '노쇼 · 임금체불 신고'}
      subtitle={receipt ? '안전센터에서 확인 후 결과를 알려드려요' : '접수된 내용은 안전센터에서 24시간 내 확인합니다'}
      footer={
        receipt ? (
          <Button label="확인" variant="dark" size="lg" onPress={close} />
        ) : (
          <View style={{ gap: 8 }}>
            <Button
              label="신고 접수하기"
              icon="shield-checkmark"
              size="lg"
              variant={canSubmit ? 'primary' : 'outline'}
              disabled={!canSubmit}
              onPress={submit}
            />
            <View style={styles.footerNote}>
              <Ionicons name="information-circle-outline" size={11} color={color.muted} />
              <Text style={styles.footerNoteText}>
                피신고자에게 소명 기회가 주어지며, 사실 확인 후 매칭 제한·경고 등의 조치가 이루어집니다.
              </Text>
            </View>
          </View>
        )
      }
    >
      {receipt ? (
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.doneTitle}>신고가 접수됐어요</Text>
          <Text style={styles.doneSub}>접수번호 {receipt.receiptNo}</Text>

          <View style={styles.doneCard}>
            <View style={styles.doneRow}>
              <Text style={styles.doneLabel}>신고 대상</Text>
              <Text style={styles.doneValue} numberOfLines={2}>
                {receipt.target === 'contractor' ? '발주처 · ' : '작업자 · '}
                {receipt.targetName}
              </Text>
            </View>
            <View style={styles.doneRow}>
              <Text style={styles.doneLabel}>신고 사유</Text>
              <Text style={styles.doneValue}>{receipt.reason}</Text>
            </View>
            <View style={styles.doneRow}>
              <Text style={styles.doneLabel}>접수 일시</Text>
              <Text style={styles.doneValue}>{receipt.createdAt.replace('T', ' ').slice(0, 16)}</Text>
            </View>
            <View style={styles.doneRow}>
              <Text style={styles.doneLabel}>처리 상태</Text>
              <Badge label={receipt.status} tone="amber" icon="time-outline" />
            </View>
          </View>

          <View style={styles.doneGuide}>
            {[
              '안전센터에서 24시간 내에 내용을 확인합니다.',
              '처리 결과는 알림함과 문자로 안내됩니다.',
              '증빙 자료(문자·사진·정산 내역)는 접수 안내 문자로 보내주세요.',
            ].map((line) => (
              <View key={line} style={styles.guideRow}>
                <View style={styles.guideBullet} />
                <Text style={styles.guideText}>{line}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.doneReceipt}>접수 내역은 내 프로필 → 안전센터에서 확인할 수 있어요.</Text>
        </View>
      ) : (
        <>
          <View style={styles.noticeBox}>
            <Ionicons name="shield-checkmark" size={15} color={color.amber} />
            <Text style={styles.noticeText}>
              신고는 안전하게 비공개로 처리됩니다. 허위 신고 시 이용이 제한될 수 있어요.
            </Text>
          </View>

          <View style={{ gap: 7 }}>
            <FieldLabel label="신고 대상" required />
            <View style={styles.segment}>
              {(
                [
                  { key: 'contractor' as ReportTarget, label: '발주처 · 현장' },
                  { key: 'worker' as ReportTarget, label: '작업자' },
                ]
              ).map((item) => {
                const active = target === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setTarget(item.key);
                      setPickedKey(item.key === 'contractor' ? (contractorOptions[0]?.key ?? null) : WORKERS[0]!.key);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.targetGrid}>
              {options.map((option) => {
                const active = pickedKey === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setPickedKey(option.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`신고 대상 ${option.name}`}
                    style={[styles.targetCard, active && styles.targetCardActive]}
                  >
                    <View style={styles.targetTop}>
                      <View style={[styles.radio, active && styles.radioOn]}>
                        {active ? <View style={styles.radioDot} /> : null}
                      </View>
                      {active ? <Ionicons name="checkmark-circle" size={13} color={color.accent} /> : null}
                    </View>
                    <Text style={styles.targetName} numberOfLines={1}>
                      {option.name}
                    </Text>
                    <Text style={styles.targetSub} numberOfLines={1}>
                      {option.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 7 }}>
            <FieldLabel label="신고 사유" required />
            <View style={{ gap: 5 }}>
              {REASONS.map((item) => {
                const active = reason === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setReason(item.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`신고 사유 ${item.key}`}
                    style={[styles.reasonRow, active && styles.reasonRowActive]}
                  >
                    <View style={[styles.reasonIcon, active && { backgroundColor: color.accent }]}>
                      <Ionicons name={item.icon} size={15} color={active ? '#FFFFFF' : color.inkSoft} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reasonName, active && { color: color.accentDark }]}>{item.key}</Text>
                      <Text style={styles.reasonDesc}>{item.desc}</Text>
                    </View>
                    <View style={[styles.checkCircle, active && styles.checkCircleOn]}>
                      {active ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: 7 }}>
            <FieldLabel label="상세 내용" required hint="현장명·날짜·금액을 함께 적어주세요" />
            <TextInput
              value={detail}
              onChangeText={(text) => setDetail(text.slice(0, 500))}
              placeholder="예) 11/18 성수동 목공 현장, 1공수 340,000원을 약속했지만 정산일이 지나도 입금되지 않았습니다."
              placeholderTextColor={color.muted}
              multiline
              textAlignVertical="top"
              style={styles.textarea}
            />
            <Text style={styles.counter}>{detail.length} / 500자</Text>
          </View>

          <View style={styles.evidenceBox}>
            <Ionicons name="attach" size={14} color={color.inkSoft} />
            <Text style={styles.evidenceText}>
              현장 사진·문자·정산 내역은 접수 후 안내되는 번호로 보내주시면 확인에 도움이 됩니다.
            </Text>
          </View>

          <View style={styles.reporterRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.reporterLabel}>신고자</Text>
              <Text style={styles.reporterValue}>
                {account?.name ?? '게스트'} · {account ? maskPhone(account.phone) : '로그인 필요'}
              </Text>
            </View>
            {account?.phoneVerified ? <Badge label="휴대폰 인증" tone="green" icon="shield-checkmark" small /> : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={13} color={color.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: color.amberSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  noticeText: { flex: 1, fontSize: 11, fontWeight: '600', color: '#8A5A0B', lineHeight: 16 },

  segment: {
    flexDirection: 'row',
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.sm,
    padding: 3,
    gap: 3,
  },
  segmentItem: { flex: 1, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: color.surface },
  segmentText: { fontSize: 12, fontWeight: '700', color: color.inkSoft },
  segmentTextActive: { color: color.ink, fontWeight: '800' },

  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  targetCard: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 8,
    gap: 2,
    backgroundColor: color.surface,
  },
  targetCardActive: { borderColor: color.accent, backgroundColor: '#FFFCFA' },
  targetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  targetName: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  targetSub: { fontSize: 9.5, fontWeight: '600', color: color.muted },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: color.accent },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.accent },
  optionName: { fontSize: 12.5, fontWeight: '800', color: color.ink },
  optionSub: { fontSize: 10.5, fontWeight: '600', color: color.muted, marginTop: 1 },

  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  reasonRowActive: { borderColor: color.accent, backgroundColor: '#FFFCFA' },
  reasonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonName: { fontSize: 13, fontWeight: '800', color: color.ink },
  reasonDesc: { fontSize: 10.5, fontWeight: '500', color: color.muted, marginTop: 1 },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: color.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleOn: { backgroundColor: color.accent, borderColor: color.accent },

  textarea: {
    backgroundColor: color.surfaceAlt,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 92,
    fontSize: 12.5,
    fontWeight: '500',
    color: color.ink,
    lineHeight: 19,
  },
  counter: { fontSize: 10, fontWeight: '600', color: color.muted, textAlign: 'right' },

  evidenceBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.sm,
    padding: space.x3,
  },
  evidenceText: { flex: 1, fontSize: 10.5, lineHeight: 15, fontWeight: '500', color: color.inkSoft },

  reporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: color.line,
    paddingTop: 10,
  },
  reporterLabel: { fontSize: 10, fontWeight: '700', color: color.muted },
  reporterValue: { fontSize: 12, fontWeight: '700', color: color.ink },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.redSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: { flex: 1, fontSize: 11, fontWeight: '700', color: color.red },

  footerNote: { flexDirection: 'row', gap: 5, alignItems: 'flex-start', paddingHorizontal: 2 },
  footerNoteText: { flex: 1, fontSize: 10.5, lineHeight: 15, color: color.muted, fontWeight: '500' },

  doneWrap: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  doneIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  doneTitle: { ...font.h2, color: color.ink },
  doneSub: { fontSize: 12, fontWeight: '700', color: color.muted },
  doneCard: {
    alignSelf: 'stretch',
    backgroundColor: color.surfaceAlt,
    borderRadius: radius.md,
    padding: space.x3,
    gap: 7,
    marginTop: 6,
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneLabel: { width: 62, fontSize: 11.5, fontWeight: '600', color: color.muted },
  doneValue: { flex: 1, fontSize: 12.5, fontWeight: '700', color: color.ink },
  doneGuide: { alignSelf: 'stretch', gap: 5, paddingHorizontal: 4, marginTop: 4 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  guideBullet: { width: 3, height: 3, borderRadius: 2, backgroundColor: color.green, marginTop: 7 },
  guideText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500', color: color.inkSoft },
  doneReceipt: { fontSize: 10.5, fontWeight: '600', color: color.muted, textAlign: 'center', marginTop: 2 },
});
