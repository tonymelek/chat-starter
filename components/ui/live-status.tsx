import { StyleSheet, Text, View } from 'react-native';

import { useBrandTheme } from '@/hooks/use-brand-theme';

type Tone = 'error' | 'success';

export function LiveStatus({
  message,
  tone = 'error',
}: {
  message: string;
  tone?: Tone;
}) {
  const theme = useBrandTheme();
  const color = tone === 'error' ? theme.destructive : theme.success;

  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={message}
    >
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
});
