import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';

import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';

type IconButtonProps = Omit<TouchableOpacityProps, 'accessibilityRole'> & {
  accessibilityLabel: string;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  accessibilityLabel,
  busy = false,
  disabled,
  children,
  style,
  ...rest
}: IconButtonProps) {
  const theme = useBrandTheme();
  const isDisabled = Boolean(disabled || busy);

  return (
    <TouchableOpacity
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy }}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[styles.hit, style]}
    >
      {busy ? <ActivityIndicator color={theme.accent} /> : children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
