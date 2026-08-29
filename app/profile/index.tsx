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
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<EditDraft>(emptyDraft);
    const [isLoading, setIsLoading] = useState(false);

    const openEditModal = () => {
        if (!profile) return;
        setDraft({
            displayName: profile.displayName,
            username: profile.username,
            bio: profile.bio,
            location: profile.location,
            phone: profile.phone,
        });
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
            Alert.alert('Invalid profile', validationError);
            return;
        }

        setIsLoading(true);
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
                prev
                    ? { ...prev, displayName, username, bio, location, phone }
                    : prev
            );
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', getFirebaseErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const avatarUri =
        profile?.photoURL || user?.photoURL || 'https://ui-avatars.com/api/?name=P&size=150';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            {profileLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#258cf4" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.heroSection}>
                        <View style={styles.avatarContainer}>
                            <Image source={{ uri: avatarUri }} style={styles.avatar} />
                            <TouchableOpacity
                                style={styles.cameraButton}
                                onPress={pickImage}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <MaterialIcons name="photo-camera" size={16} color="white" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{profile?.displayName || 'User'}</Text>
                        <Text style={styles.userHandle}>
                            {formatUsername(profile?.username || '')}
                        </Text>
                        <Text style={styles.bio}>
                            {profile?.bio || 'No bio yet. Tap Edit Profile to add one.'}
                        </Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.btn, styles.btnPrimary]}
                            onPress={openEditModal}
                        >
                            <MaterialIcons name="edit" size={18} color="white" />
                            <Text style={styles.btnPrimaryText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
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
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={styles.editSheet}>
                        <View style={styles.editHeader}>
                            <TouchableOpacity onPress={() => setIsEditing(false)} disabled={isLoading}>
                                <Text style={styles.editCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <Text style={styles.editTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={handleSaveProfile} disabled={isLoading}>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#258cf4" />
                                ) : (
                                    <Text style={styles.editSave}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.editScroll}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <EditField
                                label="Display name"
                                value={draft.displayName}
                                onChangeText={(displayName) => setDraft((d) => ({ ...d, displayName }))}
                                placeholder="Your name"
                                maxLength={50}
                            />
                            <EditField
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
                            <EditField
                                label="Bio"
                                value={draft.bio}
                                onChangeText={(bio) => setDraft((d) => ({ ...d, bio }))}
                                placeholder="Tell people a little about yourself"
                                multiline
                                maxLength={160}
                            />
                            <EditField
                                label="Location"
                                value={draft.location}
                                onChangeText={(location) => setDraft((d) => ({ ...d, location }))}
                                placeholder="City, Country"
                                maxLength={80}
                            />
                            <EditField
                                label="Phone"
                                value={draft.phone}
                                onChangeText={(phone) => setDraft((d) => ({ ...d, phone }))}
                                placeholder="+1 555 000 0000"
                                keyboardType="phone-pad"
                                maxLength={20}
                            />
                            <Text style={styles.emailNote}>
                                Email ({profile?.email}) cannot be changed here.
                            </Text>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

function EditField({
    label,
    hint,
    ...props
}: {
    label: string;
    hint?: string;
} & React.ComponentProps<typeof TextInput>) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
                style={[styles.fieldInput, props.multiline && styles.fieldInputMultiline]}
                placeholderTextColor="#94a3b8"
                {...props}
            />
            {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
        </View>
    );
}

const DetailItem = ({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }) => (
    <View style={styles.detailRow}>
        <View style={styles.iconBox}>
            <MaterialIcons name={icon} size={20} color="#64748b" />
        </View>
        <View style={styles.detailText}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f7f8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 100 },
    heroSection: { alignItems: 'center', padding: 24 },
    avatarContainer: { marginBottom: 16 },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#eff6ff' },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#258cf4',
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: 'white',
        minWidth: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    userHandle: { color: '#258cf4', marginBottom: 12 },
    bio: { textAlign: 'center', color: '#64748b', fontSize: 14, maxWidth: 300, lineHeight: 20 },
    actionRow: { paddingHorizontal: 24, marginBottom: 32 },
    btn: { flexDirection: 'row', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnPrimary: { backgroundColor: '#258cf4' },
    btnPrimaryText: { color: 'white', fontWeight: 'bold' },
    section: { paddingHorizontal: 24 },
    sectionTitle: { color: '#94a3b8', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    detailText: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 16 },
    detailLabel: { fontSize: 12, color: '#64748b' },
    detailValue: { fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    editSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.88,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    },
    editHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    editTitle: { fontSize: 17, fontWeight: '700' },
    editCancel: { color: '#64748b', fontSize: 16 },
    editSave: { color: '#258cf4', fontSize: 16, fontWeight: '700' },
    editScroll: { paddingHorizontal: 20, paddingTop: 16 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
    fieldInput: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0f172a',
    },
    fieldInputMultiline: { minHeight: 96, textAlignVertical: 'top' },
    fieldHint: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
    emailNote: { fontSize: 13, color: '#94a3b8', marginBottom: 24, textAlign: 'center' },
});

export default ProfileScreen;
