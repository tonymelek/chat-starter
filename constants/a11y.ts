import { Platform } from 'react-native';

/** iOS 44pt / Android 48dp. Web uses 44 as a comfortable floor. */
export const minTouchSize = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
