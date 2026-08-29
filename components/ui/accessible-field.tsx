import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';

type AccessibleFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function AccessibleField({
  label,
  hint,
  error,
  editable = true,
  multiline,
  style,
  ...rest
}: AccessibleFieldProps) {
  const theme = useBrandTheme();
  const describedBy = [hint, error].filter(Boolean).join('. ');

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        {...rest}
        editable={editable}
        multiline={multiline}
        accessibilityLabel={label}
        accessibilityHint={describedBy || rest.accessibilityHint}
        accessibilityState={{ disabled: editable === false }}
        placeholderTextColor={theme.textMuted}
        placeholder={rest.placeholder}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.destructive : theme.border,
            color: theme.text,
            minHeight: multiline ? 96 : minTouchSize,
          },
          multiline && styles.multiline,
          style,
        ]}
      />
      {hint ? (
        <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
      {error ? (
        <Text
          style={[styles.error, { color: theme.destructive }]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
  },
  multiline: {
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
});
