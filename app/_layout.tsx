import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/auth';
import { BrandTokens } from '@/constants/brand';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const tokens = BrandTokens[colorScheme];
  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={{
          ...navigationTheme,
          colors: {
            ...navigationTheme.colors,
            primary: tokens.accent,
            background: tokens.background,
            card: tokens.surface,
            text: tokens.text,
            border: tokens.border,
            notification: tokens.action,
          },
        }}
      >
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
            <Stack.Screen name="profile/index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
        </AuthProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
