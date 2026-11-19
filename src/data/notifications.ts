import { AppNotification, NotificationKind, UserRole } from '../types';
import { addDays, todayISO } from '../utils/date';

/** 알림 종류별 아이콘·색 */
export const NOTIFICATION_META: Record<
  NotificationKind,
  { icon: 'checkmark-circle' | 'call' | 'location' | 'wallet' | 'shield' | 'megaphone'; label: string; tone: 'green' | 'blue' | 'accent' | 'amber' | 'red' | 'navy' }
> = {
  match: { icon: 'checkmark-circle', label: '매칭 확정', tone: 'green' },
  contact: { icon: 'call', label: '연락처 공개', tone: 'blue' },
  nearby: { icon: 'location', label: '내 주변 공고', tone: 'accent' },
  settlement: { icon: 'wallet', label: '공수 정산', tone: 'amber' },
  report: { icon: 'shield', label: '안전센터', tone: 'red' },
  notice: { icon: 'megaphone', label: '공지', tone: 'navy' },
};

const at = (dayOffset: number, hhmm: string) => `${addDays(todayISO(), dayOffset)}T${hhmm}:00`;

/** 데모용 알림함 — 로그인한 역할에 맞춰 다른 내용이 들어간다 */
export function buildSeedNotifications(role: UserRole): AppNotification[] {
  if (role === 'contractor') {
    return [
      {
        id: 'ntf-c1',
        kind: 'match',
        title: '지원자가 도착했어요',
        body: '김도현(기공 · 경력 7년)님이 성수동 사무실 목공 공고에 지원했습니다. 프로필과 포트폴리오를 확인해 보세요.',
        at: at(0, '06:40'),
        read: false,
        jobId: 'job-9',
      },
      {
        id: 'ntf-c2',
        kind: 'contact',
        title: '확정 요청을 보냈어요',
        body: '박정우(준기공)님에게 11/21(토) 출역 확정 요청을 보냈습니다. 수락하면 연락처가 공개됩니다.',
        at: at(0, '05:55'),
        read: false,
        jobId: 'job-10',
      },
      {
        id: 'ntf-c3',
        kind: 'nearby',
        title: '마감 임박 공고가 있어요',
        body: '내일 08:00 집합 · 철거 3명 모집 공고가 아직 인원이 부족합니다. 모집을 마감할까요?',
        at: at(-1, '18:20'),
        read: false,
        jobId: 'job-14',
      },
      {
        id: 'ntf-c4',
        kind: 'settlement',
        title: '정산 예정 안내',
        body: '이번 달 확정된 현장 4건 · 정산 예정 금액 4,120,000원입니다. 현장별 정산 내역을 확인하세요.',
        at: at(-1, '09:05'),
        read: true,
      },
      {
        id: 'ntf-c5',
        kind: 'report',
        title: '신고 접수 완료',
        body: '접수하신 노쇼 신고(R-20261112-0330)가 확인 중입니다. 처리 결과는 이 알림으로 안내드립니다.',
        at: at(-2, '16:40'),
        read: true,
      },
    ];
  }

  return [
    {
      id: 'ntf-t1',
      kind: 'match',
      title: '지원이 확정됐어요',
      body: '정한건설 · 송파 헬리오시티 화장실 2실 · 11/21(토) 08:00 출역이 확정됐습니다. 발주처 연락처가 공개됐어요.',
      at: at(0, '06:20'),
      read: false,
      jobId: 'job-1',
    },
    {
      id: 'ntf-t2',
      kind: 'contact',
      title: '발주처가 연락처를 열람했어요',
      body: '태성타일 담당자가 지원한 프로필을 확인하고 연락처 공개를 요청했습니다. 채용 확정 시 문자로 안내드려요.',
      at: at(0, '05:50'),
      read: false,
      jobId: 'job-2',
    },
    {
      id: 'ntf-t3',
      kind: 'nearby',
      title: '내 주변 신규 공고 3건',
      body: '성동구·광진구에 타일 현장이 새로 올라왔어요. 09:00 집합 · 일당 340,000원 · 기공 2명 모집.',
      at: at(-1, '18:30'),
      read: false,
    },
    {
      id: 'ntf-t4',
      kind: 'settlement',
      title: '공수 정산 리마인더',
      body: '지난달 미수령 공수 2건 · 660,000원이 남아 있어요. 발주처에 정산을 요청하거나 공수달력에서 확인하세요.',
      at: at(-1, '09:10'),
      read: true,
    },
    {
      id: 'ntf-t5',
      kind: 'report',
      title: '신고 접수 완료',
      body: '접수하신 허위공고 신고(R-20261111-0421)가 확인 중입니다. 처리 결과는 이 알림으로 안내드립니다.',
      at: at(-2, '16:40'),
      read: true,
    },
  ];
}
