import { Platform, TextStyle, ViewStyle } from 'react-native';

/** 타일 현장 톤: 짙은 네이비 + 안전 오렌지 + 시멘트 그레이 */
export const color = {
  bg: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F8FA',
  surfaceSunken: '#ECEEF2',

  ink: '#101828',
  inkSoft: '#475467',
  muted: '#98A2B3',

  line: '#E4E7EC',
  lineStrong: '#D0D5DD',

  brand: '#16233A',
  brandDeep: '#0D1626',
  brandSoft: '#E8EDF5',

  accent: '#F05A22',
  accentDark: '#C84615',
  accentSoft: '#FFF1EA',

  green: '#0E9F6E',
  greenSoft: '#E6F7F1',

  blue: '#2563EB',
  blueSoft: '#EAF0FF',

  amber: '#B45309',
  amberSoft: '#FFF6E5',

  red: '#D92D20',
  redSoft: '#FEECEB',

  purple: '#7A5AF8',
  purpleSoft: '#F1EDFF',
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const space = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x7: 32,
} as const;

export const font = {
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 } as TextStyle,
  h2: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 } as TextStyle,
  h3: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 } as TextStyle,
  body: { fontSize: 14.5, fontWeight: '500', lineHeight: 21 } as TextStyle,
  small: { fontSize: 12.5, fontWeight: '500', lineHeight: 18 } as TextStyle,
  tiny: { fontSize: 11, fontWeight: '600' } as TextStyle,
  number: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 } as TextStyle,
} as const;

export const shadow = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#101828',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    web: { boxShadow: '0 4px 16px rgba(16,24,40,0.07)' } as ViewStyle,
    default: {},
  }) as ViewStyle,
  sheet: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: -6 },
    },
    android: { elevation: 12 },
    web: { boxShadow: '0 -10px 40px rgba(16,24,40,0.22)' } as ViewStyle,
    default: {},
  }) as ViewStyle,
  tabBar: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#101828',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: -2 },
    },
    android: { elevation: 8 },
    web: { boxShadow: '0 -2px 20px rgba(16,24,40,0.08)' } as ViewStyle,
    default: {},
  }) as ViewStyle,
};

/** 필터/뱃지 색 조합 */
export type Tone = 'accent' | 'green' | 'blue' | 'gray' | 'amber' | 'red' | 'navy' | 'purple';

export const toneStyles: Record<Tone, { bg: string; fg: string; border: string }> = {
  accent: { bg: color.accentSoft, fg: color.accentDark, border: '#FFD9C7' },
  green: { bg: color.greenSoft, fg: color.green, border: '#BFEBDC' },
  blue: { bg: color.blueSoft, fg: color.blue, border: '#CFDCFF' },
  gray: { bg: color.surfaceSunken, fg: color.inkSoft, border: color.line },
  amber: { bg: color.amberSoft, fg: color.amber, border: '#F8E0B6' },
  red: { bg: color.redSoft, fg: color.red, border: '#F7CFCB' },
  navy: { bg: color.brandSoft, fg: color.brand, border: '#D5DDEA' },
  purple: { bg: color.purpleSoft, fg: color.purple, border: '#DED5FF' },
};
