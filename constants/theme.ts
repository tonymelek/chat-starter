/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

import { BrandTokens } from '@/constants/brand';

export const Colors = {
  light: {
    text: BrandTokens.light.text,
    background: BrandTokens.light.background,
    tint: BrandTokens.light.accent,
    icon: BrandTokens.light.icon,
    tabIconDefault: BrandTokens.light.icon,
    tabIconSelected: BrandTokens.light.accent,
  },
  dark: {
    text: BrandTokens.dark.text,
    background: BrandTokens.dark.background,
    tint: BrandTokens.dark.accent,
    icon: BrandTokens.dark.icon,
    tabIconDefault: BrandTokens.dark.icon,
    tabIconSelected: BrandTokens.dark.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
