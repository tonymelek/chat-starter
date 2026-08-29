import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';

export function AuthBootstrap() {
  return (
    <View
      style={styles.overlay}
      pointerEvents="auto"
      accessibilityRole="progressbar"
      accessibilityLabel="Checking sign-in status"
      accessibilityViewIsModal
    >
      <Image
        source={require('@/assets/images/meltek-mark.png')}
        style={styles.mark}
        accessibilityLabel="Meltek"
      />
      <Text style={styles.credit}>{Brand.credit}</Text>
      <ActivityIndicator color={Brand.mist} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 14,
  },
  credit: {
    color: Brand.mist,
    fontSize: 14,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 20,
  },
});
