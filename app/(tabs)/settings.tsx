import { useAuth } from '@/context/auth';
import { getClientAuth } from '@/lib/firebase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Brand } from '@/constants/brand';

const SettingsScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(getClientAuth());
                        } catch {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                },
            ]
        );
    };

    const SettingItem = ({ icon, label, onPress }: { icon: string, label: string, onPress?: () => void }) => (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View style={styles.iconContainer}>
                <MaterialIcons name={icon as any} size={24} color={Brand.sea} />
            </View>
            <Text style={styles.itemText}>{label}</Text>
            <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                {/* Profile */}
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 }}
                        onPress={() => router.push('/profile')}
                    >
                        <View>
                            <Image
                                source={{ uri: user?.photoURL || 'https://ui-avatars.com/api/?name=P&size=150' }}
                                style={styles.avatar}
                            />
                            <View style={styles.onlineBadge} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{user?.displayName || 'User'}</Text>
                            <Text style={styles.status}>{user?.email || 'Available'}</Text>
                            {user?.phoneNumber && <Text style={styles.phone}>{user.phoneNumber}</Text>}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* List */}
                <ScrollView style={styles.list}>
                    <Text style={styles.sectionHeader}>ACCOUNT</Text>
                    <SettingItem
                        icon="person"
                        label="Profile"
                        onPress={() => router.push('/profile')}
                    />
                </ScrollView>

                {/* Studio + logout */}
                <TouchableOpacity
                    style={styles.studio}
                    onPress={() => Linking.openURL(Brand.url)}
                    accessibilityRole="link"
                >
                    <Image
                        source={require('@/assets/images/meltek-mark.png')}
                        style={styles.studioMark}
                    />
                    <View>
                        <Text style={styles.studioTitle}>Founded by {Brand.name}</Text>
                        <Text style={styles.studioCaption}>{Brand.tagline}</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color="#dc2626" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7f8' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    profileSection: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
    avatar: { width: 80, height: 80, borderRadius: 40 },
    onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, backgroundColor: '#22c55e', borderRadius: 10, borderWidth: 3, borderColor: 'white' },
    profileInfo: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold' },
    status: { color: '#64748b' },
    phone: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
    sectionHeader: { paddingHorizontal: 24, paddingVertical: 10, fontSize: 12, fontWeight: 'bold', color: '#94a3b8' },
    item: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 24, backgroundColor: 'white' },
    iconContainer: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#e6f4f4', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    itemText: { flex: 1, fontWeight: '500' },
    list: { flex: 1 },
    studio: { marginHorizontal: 24, marginBottom: 8, padding: 14, borderRadius: 12, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 12 },
    studioMark: { width: 40, height: 40, borderRadius: 10 },
    studioTitle: { fontWeight: '600', color: Brand.ink },
    studioCaption: { fontSize: 12, color: '#64748b', marginTop: 2 },
    logoutButton: { margin: 24, padding: 16, borderRadius: 12, backgroundColor: '#fef2f2', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    logoutText: { color: '#dc2626', fontWeight: 'bold' }
});

export default SettingsScreen;