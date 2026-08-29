import { useAuth } from '@/context/auth';
import { getClientAuth } from '@/lib/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/ui/icon-button';
import { Brand } from '@/constants/brand';
import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';

const SettingsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useBrandTheme();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(getClientAuth());
          } catch {
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  const profileName = user?.displayName || 'User';
  const profileEmail = user?.email || 'Available';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text
            style={[styles.headerTitle, { color: theme.text }]}
            accessibilityRole="header"
          >
            Settings
          </Text>
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel={`Profile, ${profileName}, ${profileEmail}`}
            accessibilityHint="Opens your profile"
          >
            <Image
              source={{
                uri: user?.photoURL || 'https://ui-avatars.com/api/?name=P&size=150',
              }}
              style={styles.avatar}
              accessibilityIgnoresInvertColors
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.name, { color: theme.text }]}>{profileName}</Text>
              <Text style={[styles.status, { color: theme.textMuted }]}>{profileEmail}</Text>
              {user?.phoneNumber ? (
                <Text style={[styles.phone, { color: theme.textMuted }]}>{user.phoneNumber}</Text>
              ) : null}
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.icon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list}>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>ACCOUNT</Text>
          <TouchableOpacity
            style={[styles.item, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.accentMuted }]}>
              <MaterialIcons
                name="person"
                size={24}
                color={theme.accent}
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
            </View>
            <Text style={[styles.itemText, { color: theme.text }]}>Profile</Text>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={theme.icon}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={[styles.studio, { backgroundColor: theme.surface }]}
          onPress={() => Linking.openURL(Brand.url)}
          accessibilityRole="link"
          accessibilityLabel={`${Brand.name}, ${Brand.tagline}`}
        >
          <Image
            source={require('@/assets/images/meltek-mark.png')}
            style={styles.studioMark}
            accessibilityLabel="Meltek"
          />
          <View>
            <Text style={[styles.studioTitle, { color: theme.text }]}>
              Founded by {Brand.name}
            </Text>
            <Text style={[styles.studioCaption, { color: theme.textMuted }]}>
              {Brand.tagline}
            </Text>
          </View>
        </TouchableOpacity>

        <IconButton
          accessibilityLabel="Log out"
          onPress={handleLogout}
          style={[styles.logoutButton, { backgroundColor: theme.destructiveMuted }]}
        >
          <MaterialIcons
            name="logout"
            size={20}
            color={theme.destructive}
            importantForAccessibility="no"
            accessibilityElementsHidden
          />
          <Text style={[styles.logoutText, { color: theme.destructive }]}>Log out</Text>
        </IconButton>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  profileSection: { paddingHorizontal: 24, paddingBottom: 8 },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: minTouchSize,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold' },
  status: { marginTop: 2 },
  phone: { fontSize: 12, marginTop: 4 },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    minHeight: minTouchSize,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemText: { flex: 1, fontWeight: '500' },
  list: { flex: 1 },
  studio: {
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: minTouchSize,
  },
  studioMark: { width: 40, height: 40, borderRadius: 10 },
  studioTitle: { fontWeight: '600' },
  studioCaption: { fontSize: 12, marginTop: 2 },
  logoutButton: {
    margin: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: { fontWeight: 'bold' },
});

export default SettingsScreen;
