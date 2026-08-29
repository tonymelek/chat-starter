/** Meltek studio brand — https://meltek.com.au */
export const Brand = {
  name: 'Meltek',
  url: 'https://meltek.com.au',
  tagline: 'Software engineering studio · Melbourne',
  credit: 'A Meltek studio project',
  /** Primitive palette — change these four to rebrand a fork. */
  ink: '#0A2540',
  sea: '#0E7C86',
  coral: '#FF6B4A',
  mist: '#F5F7FA',
} as const;

export type ColorSchemeName = 'light' | 'dark';

/**
 * Semantic colors for UI roles. Screens should read these via `useBrandTheme()`,
 * not the primitive hex values, so light/dark stay in lockstep.
 */
export type SemanticColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textOnAccent: string;
  accent: string;
  accentMuted: string;
  action: string;
  actionForeground: string;
  bubbleMe: string;
  bubbleMeText: string;
  bubbleThem: string;
  bubbleThemText: string;
  destructive: string;
  destructiveMuted: string;
  success: string;
  border: string;
  overlay: string;
  icon: string;
  tabBar: string;
};

export const BrandTokens: Record<ColorSchemeName, SemanticColors> = {
  light: {
    background: Brand.mist,
    surface: '#FFFFFF',
    surfaceMuted: '#E8EEF2',
    text: Brand.ink,
    textMuted: '#3E5366',
    textOnAccent: '#FFFFFF',
    accent: Brand.sea,
    accentMuted: '#D7F0F2',
    action: Brand.coral,
    actionForeground: '#FFFFFF',
    bubbleMe: Brand.sea,
    bubbleMeText: '#FFFFFF',
    bubbleThem: '#FFFFFF',
    bubbleThemText: Brand.ink,
    destructive: '#B42318',
    destructiveMuted: '#FDECEC',
    success: '#15803D',
    border: '#C9D4DE',
    overlay: 'rgba(10, 37, 64, 0.5)',
    icon: '#4A6278',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#071525',
    surface: '#0F2C40',
    surfaceMuted: '#16364A',
    text: Brand.mist,
    textMuted: '#B7C6D4',
    textOnAccent: '#FFFFFF',
    accent: '#3DBFC8',
    accentMuted: '#123A42',
    action: '#FF7A5C',
    actionForeground: '#1A0C08',
    bubbleMe: Brand.sea,
    bubbleMeText: '#FFFFFF',
    bubbleThem: '#16364A',
    bubbleThemText: Brand.mist,
    destructive: '#F87171',
    destructiveMuted: '#3A1618',
    success: '#4ADE80',
    border: '#2A4A5E',
    overlay: 'rgba(4, 12, 20, 0.64)',
    icon: '#9BB0C2',
    tabBar: '#0C2234',
  },
};
