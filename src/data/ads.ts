import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { TradeFilter } from '../types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** 피드 중간에 들어가는 1줄 스폰서 배너 예시 (데모) */
export interface SponsorAd {
  id: string;
  /** 배너 제목 — 공정에 맞춰 자동 전환 */
  title: string;
  advertiser: string;
  /** 회원 혜택 한 줄 */
  perk: string;
  icon: IconName;
  /** 실제 제휴 시 연결되는 동작 */
  action: string;
  /** 탭했을 때 보여주는 안내 */
  detail: string;
}

const DEMO_NOTE =
  '실제 제휴가 붙으면 이 배너를 눌렀을 때 광고주 전화 연결 또는 주문 링크로 바로 이동합니다. 지금은 화면 예시(데모)입니다.';

export const SPONSOR_ADS: Record<'demolition' | 'finish' | 'default', SponsorAd> = {
  demolition: {
    id: 'ad-demolition',
    title: '폐기물·스카이 당일 호출',
    advertiser: '청담환경 · 스카이 25톤',
    perk: '오전 8시 전 호출 시 당일 처리 · 공정잡 회원 10%',
    icon: 'trash',
    action: '전화 연결',
    detail: `철거 폐기물 반출·스카이차가 급할 때 바로 전화로 호출하는 제휴 예시예요. ${DEMO_NOTE}`,
  },
  finish: {
    id: 'ad-finish',
    title: '1톤 용달·온라인 건재몰 긴급배송',
    advertiser: '바로건재 · 1톤 용달',
    perk: '오후 4시 전 주문 당일 배송 · 공정잡 회원 5%',
    icon: 'cube',
    action: '주문 링크',
    detail: `타일·목공 자재를 전화 한 통이나 온라인으로 현장까지 받는 제휴 예시예요. ${DEMO_NOTE}`,
  },
  default: {
    id: 'ad-tools',
    title: '현장 전동공구·부자재 특가',
    advertiser: '공구몰 · 건재몰',
    perk: '본드·줄눈제·전동공구 회원 특가 · 당일 출고',
    icon: 'construct',
    action: '주문 링크',
    detail: `현장에서 자주 떨어지는 부자재와 전동공구를 특가로 받는 제휴 예시예요. ${DEMO_NOTE}`,
  },
};

/** 선택된 공정에 맞는 스폰서 배너를 돌려준다 */
export function sponsorAdFor(trade: TradeFilter): SponsorAd {
  if (trade === '철거') return SPONSOR_ADS.demolition;
  if (trade === '타일' || trade === '목공') return SPONSOR_ADS.finish;
  return SPONSOR_ADS.default;
}
