import { useAuth } from '@/context/auth';
import { useUserProfile, formatUsername, UserProfile } from '@/hooks/use-user-profile';
import { getClientAuth, storage } from '@/lib/firebase';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { syncUserDoc } from '@/lib/users';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessibleField } from '@/components/ui/accessible-field';
import { IconButton } from '@/components/ui/icon-button';
import { LiveStatus } from '@/components/ui/live-status';
import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';

const { height } = Dimensions.get('window');

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

type EditDraft = Pick<UserProfile, 'displayName' | 'username' | 'bio' | 'location' | 'phone'>;

const emptyDraft: EditDraft = {
  displayName: '',
  username: '',
  bio: '',
  location: '',
  phone: '',
};

const ProfileScreen = () => {
  const { user } = useAuth();
  const { profile, setProfile, loading: profileLoading, refresh } = useUserProfile();
  const router = useRouter();
  const theme = useBrandTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const openEditModal = () => {
    if (!profile) return;
    setDraft({
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
      location: profile.location,
      phone: profile.phone,
    });
    setFormError('');
    setIsEditing(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      handleAvatarUpdate(result.assets[0].uri);
    }
  };

  const handleAvatarUpdate = async (uri: string) => {
    const currentUser = getClientAuth().currentUser;
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateProfile(currentUser, { photoURL: downloadURL });
      await syncUserDoc(currentUser, { photoURL: downloadURL });
      await refresh();
      Alert.alert('Success', 'Profile picture updated.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const validateDraft = (): string | null => {
    if (!draft.displayName.trim()) return 'Display name is required.';
    if (draft.displayName.trim().length > 50) return 'Display name must be 50 characters or less.';
    const username = draft.username.trim().replace(/^@/, '');
    if (username && !USERNAME_REGEX.test(username)) {
      return 'Username must be 3–30 characters (letters, numbers, underscore only).';
    }
    if (draft.bio.length > 160) return 'Bio must be 160 characters or less.';
    if (draft.location.length > 80) return 'Location must be 80 characters or less.';
    if (draft.phone.length > 20) return 'Phone must be 20 characters or less.';
    return null;
  };

  const handleSaveProfile = async () => {
    const currentUser = getClientAuth().currentUser;
    if (!currentUser) return;

    const validationError = validateDraft();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsLoading(true);
    setFormError('');
    try {
      const displayName = draft.displayName.trim();
      const username = draft.username.trim().replace(/^@/, '');
      const bio = draft.bio.trim();
      const location = draft.location.trim();
      const phone = draft.phone.trim();

      await updateProfile(currentUser, { displayName });
      await syncUserDoc(currentUser, {
        displayName,
        username: username || null,
        bio: bio || null,
        location: location || null,
        phone: phone || null,
      });

      setProfile((prev) =>
        prev ? { ...prev, displayName, username, bio, location, phone } : prev
      );
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated.');
    } catch (error) {
      console.error(error);
      setFormError(getFirebaseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const avatarUri =
    profile?.photoURL || user?.photoURL || 'https://ui-avatars.com/api/?name=P&size=150';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Go back" onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </IconButton>
        <Text style={[styles.headerTitle, { color: theme.text }]} accessibilityRole="header">
          Profile
        </Text>
        <View style={{ width: minTouchSize }} />
      </View>

      {profileLoading ? (
        <View style={styles.loadingContainer} accessibilityLabel="Loading profile">
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: avatarUri }}
                style={[styles.avatar, { borderColor: theme.accentMuted }]}
                accessibilityLabel="Profile photo"
                accessibilityIgnoresInvertColors
              />
              <IconButton
                style={[
                  styles.cameraButton,
                  { backgroundColor: theme.action, borderColor: theme.surface },
                ]}
                onPress={pickImage}
                busy={isLoading}
                accessibilityLabel="Change profile photo"
              >
                <MaterialIcons name="photo-camera" size={16} color={theme.actionForeground} />
              </IconButton>
            </View>
            <Text style={[styles.userName, { color: theme.text }]}>
              {profile?.displayName || 'User'}
            </Text>
            <Text style={[styles.userHandle, { color: theme.accent }]}>
              {formatUsername(profile?.username || '')}
            </Text>
            <Text style={[styles.bio, { color: theme.textMuted }]}>
              {profile?.bio || 'No bio yet. Tap Edit Profile to add one.'}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: theme.action }]}
              onPress={openEditModal}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <MaterialIcons
                name="edit"
                size={18}
                color={theme.actionForeground}
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
              <Text style={[styles.btnPrimaryText, { color: theme.actionForeground }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT DETAILS</Text>
            <DetailItem
              icon="alternate-email"
              label="Username"
              value={formatUsername(profile?.username || '')}
            />
            <DetailItem icon="call" label="Phone" value={profile?.phone || 'Not provided'} />
            <DetailItem icon="mail" label="Email" value={profile?.email || 'Not provided'} />
            <DetailItem
              icon="location-on"
              label="Location"
              value={profile?.location || 'Not provided'}
            />
          </View>
        </ScrollView>
      )}

      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
        accessibilityViewIsModal
      >
        <KeyboardAvoidingView
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.editSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.editHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing profile"
                accessibilityState={{ disabled: isLoading }}
                style={styles.editHeaderBtn}
              >
                <Text style={[styles.editCancel, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.editTitle, { color: theme.text }]} accessibilityRole="header">
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Save profile"
                accessibilityState={{ disabled: isLoading, busy: isLoading }}
                style={styles.editHeaderBtn}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Text style={[styles.editSave, { color: theme.accent }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <LiveStatus message={formError} />
              <AccessibleField
                label="Display name"
                value={draft.displayName}
                onChangeText={(displayName) => setDraft((d) => ({ ...d, displayName }))}
                placeholder="Your name"
                maxLength={50}
              />
              <AccessibleField
                label="Username"
                value={draft.username}
                onChangeText={(username) =>
                  setDraft((d) => ({ ...d, username: username.replace(/^@/, '') }))
                }
                placeholder="johndoe"
                autoCapitalize="none"
                maxLength={30}
                hint="Letters, numbers, and underscores only"
              />
              <AccessibleField
                label="Bio"
                value={draft.bio}
                onChangeText={(bio) => setDraft((d) => ({ ...d, bio }))}
                placeholder="Tell people a little about yourself"
                multiline
                maxLength={160}
              />
              <AccessibleField
                label="Location"
                value={draft.location}
                onChangeText={(location) => setDraft((d) => ({ ...d, location }))}
                placeholder="City, Country"
                maxLength={80}
              />
              <AccessibleField
                label="Phone"
                value={draft.phone}
                onChangeText={(phone) => setDraft((d) => ({ ...d, phone }))}
                placeholder="+1 555 000 0000"
                keyboardType="phone-pad"
                maxLength={20}
              />
              <Text style={[styles.emailNote, { color: theme.textMuted }]}>
                Email ({profile?.email}) cannot be changed here.
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
}) => {
  const theme = useBrandTheme();
  return (
    <View
      style={[styles.detailRow, { borderBottomColor: theme.border }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceMuted }]}>
        <MaterialIcons
          name={icon}
          size={20}
          color={theme.icon}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
      </View>
      <View style={styles.detailText}>
        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  heroSection: { alignItems: 'center', padding: 24 },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4 },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 22,
    borderWidth: 3,
  },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  userHandle: { marginBottom: 12 },
  bio: { textAlign: 'center', fontSize: 14, maxWidth: 300, lineHeight: 20 },
  actionRow: { paddingHorizontal: 24, marginBottom: 32 },
  btn: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: minTouchSize,
  },
  btnPrimaryText: { fontWeight: 'bold' },
  section: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailText: { flex: 1, borderBottomWidth: 1, paddingBottom: 16 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  editSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.88,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  editHeaderBtn: {
    minWidth: minTouchSize,
    minHeight: minTouchSize,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  editTitle: { fontSize: 17, fontWeight: '700' },
  editCancel: { fontSize: 16 },
  editSave: { fontSize: 16, fontWeight: '700' },
  editScroll: { paddingHorizontal: 20, paddingTop: 16 },
  emailNote: { fontSize: 13, marginBottom: 24, textAlign: 'center' },
});

export default ProfileScreen;
