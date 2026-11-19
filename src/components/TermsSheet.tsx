import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Sheet } from './Sheet';
import { color, font, radius, space } from '../theme';

export type TermsKey = 'terms' | 'privacy' | 'location';

export const TERMS_DOCS: { key: TermsKey; title: string; short: string; required: string; paragraphs: string[] }[] = [
  {
    key: 'terms',
    title: '이용약관',
    short: '서비스 이용 조건·매칭·책임 범위',
    required: '필수',
    paragraphs: [
      '제1조 (목적) 본 약관은 공정잡(이하 "서비스")이 인테리어 기술자와 발주처를 연결하는 구인·구직 정보 서비스를 제공함에 있어 회원과 서비스의 권리·의무를 정합니다.',
      '제2조 (서비스의 내용) 서비스는 공정별 현장 구인 공고, 지원 및 매칭, 공수(출역) 기록과 정산 관리, 시공 포트폴리오 제공 기능을 제공합니다. 회사는 통신판매의 당사자가 아니며, 현장 근로계약은 회원과 발주처 사이에 성립합니다.',
      '제3조 (회원가입) 만 19세 이상의 기술자 및 사업자등록을 마친 발주처가 가입할 수 있습니다. 휴대폰 본인인증과 필수 정보를 입력해야 하며, 타인의 명의를 사용한 가입은 제한될 수 있습니다.',
      '제4조 (매칭과 연락처 공개) 채용이 확정되기 전까지 회원과 발주처의 연락처는 서로에게 공개되지 않습니다. 발주처가 지원자의 프로필을 확인하고 출역을 확정하면 양측에 연락처와 상세 주소가 공개됩니다.',
      '제5조 (노쇼·임금체불) 확정된 출역을 통보 없이 이행하지 않거나(노쇼), 약속한 임금을 지급하지 않은 사실이 확인되면 안전센터 검토를 거쳐 매칭 제한 등의 조치가 이루어질 수 있습니다. 허위 신고 역시 이용 제한 사유가 됩니다.',
      '제6조 (게시물 관리) 허위 공고, 과장된 단가, 차별적 내용이 포함된 게시물은 사전 통지 없이 숨김 또는 삭제될 수 있습니다.',
      '제7조 (책임의 범위) 서비스는 정보 연결을 위한 플랫폼으로, 현장에서 발생한 안전사고·임금 분쟁 등 거래의 실질적 내용에 대해 당사자가 아닙니다. 다만 신고 접수와 분쟁 조정 지원을 위해 노력합니다.',
      '부칙: 본 약관은 2026년 11월 1일부터 적용됩니다. 문의 safety@gongjeongjob.kr',
    ],
  },
  {
    key: 'privacy',
    title: '개인정보 처리방침',
    short: '수집 항목·이용 목적·보유 기간',
    required: '필수',
    paragraphs: [
      '1. 수집하는 개인정보 — 필수: 이름(닉네임), 휴대폰 번호, 본인인증 결과, 주력 공정·경력·활동 지역(기술자), 업체명·사업자등록번호(발주처). 선택: 프로필 사진, 시공 포트폴리오 사진, 보유 공구, 자기소개.',
      '2. 이용 목적 — 회원 식별 및 본인확인, 공고·지원·매칭 서비스 제공, 출역 확정 및 연락처 공개, 공수 정산 관리, 노쇼·임금체불 신고 처리, 고객 문의 응대.',
      '3. 보유 및 이용 기간 — 회원 탈퇴 시까지 보관하며, 탈퇴 후에는 관련 법령에 따라 거래·신고 기록을 최대 3년간 분리 보관한 뒤 파기합니다. 데모 버전에서는 기기(브라우저) 저장소에만 보관되며 서버로 전송되지 않습니다.',
      '4. 제3자 제공 — 원칙적으로 제공하지 않습니다. 다만 채용 확정 시 발주처와 기술자에게 상호 연락처·현장 주소를 제공하며, 신고 처리 과정에서 수사기관 요청이 있는 경우 법령에 따라 제공할 수 있습니다.',
      '5. 처리 위탁 — 휴대폰 본인인증(인증기관), 알림 발송(메시징 사업자) 업무를 외부에 위탁하며, 위탁 계약 시 개인정보 보호 조항을 포함합니다.',
      '6. 이용자의 권리 — 언제든지 내 프로필에서 정보를 조회·수정할 수 있고, 계정 삭제를 요청할 수 있습니다. 위치정보 수집은 기기 설정에서 거부할 수 있으며, 거부 시 내 주변 공고 기능이 제한됩니다.',
      '7. 보호 조치 — 연락처는 채용 확정 전까지 마스킹 처리되고, 접근 권한은 업무별로 최소화합니다. 문의: privacy@gongjeongjob.kr',
    ],
  },
  {
    key: 'location',
    title: '위치기반 서비스 이용약관',
    short: '내 주변 공고·위치정보 보관',
    required: '필수',
    paragraphs: [
      '1. 위치정보 수집 — 기기의 위치 권한을 허용한 경우 현재 위치(시·구 단위)를 확인하여 내 주변 공고를 정렬·알림합니다. 정확한 좌표는 저장하지 않습니다.',
      '2. 이용 목적 — 가까운 현장 추천, 신규 공고 알림, 출역 현장까지의 예상 이동 시간 안내.',
      '3. 보관 및 파기 — 위치정보는 서비스 제공 목적 달성 후 지체 없이 파기하며, 별도로 저장·활용하지 않습니다.',
      '4. 이용자의 권리 — 위치 권한은 언제든지 기기 설정에서 끌 수 있고, 이 경우에도 지역을 직접 선택해 공고를 볼 수 있습니다.',
      '5. 위치정보 관리책임자 — 공정잡 안전센터(safety@gongjeongjob.kr). 본 약관은 2026년 11월 1일부터 적용됩니다.',
    ],
  },
];

export function TermsSheet({
  visible,
  onClose,
  initialDoc = 'terms',
}: {
  visible: boolean;
  onClose: () => void;
  initialDoc?: TermsKey;
}) {
  const [doc, setDoc] = useState<TermsKey>(initialDoc);

  useEffect(() => {
    if (visible) setDoc(initialDoc);
  }, [visible, initialDoc]);

  const current = TERMS_DOCS.find((item) => item.key === doc) ?? TERMS_DOCS[0]!;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={current.title}
      subtitle={`공정잡 · 시행일 2026.11.01 · ${current.required} 동의 항목`}
      footer={
        <Pressable onPress={onClose} style={styles.confirmBtn}>
          <Text style={styles.confirmText}>확인했어요</Text>
        </Pressable>
      }
    >
      <View style={styles.tabRow}>
        {TERMS_DOCS.map((item) => {
          const active = item.key === doc;
          return (
            <Pressable
              key={item.key}
              onPress={() => setDoc(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.title}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.docCard}>
        {current.paragraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 5 },
  tab: {
    flex: 1,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: color.brand, borderColor: color.brand },
  tabText: { fontSize: 11, fontWeight: '700', color: color.inkSoft },
  tabTextActive: { color: '#FFFFFF' },

  docCard: { backgroundColor: color.surfaceAlt, borderRadius: radius.md, padding: space.x4, gap: 10 },
  paragraph: { ...font.small, color: color.inkSoft, lineHeight: 19, fontWeight: '500' },

  confirmBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
