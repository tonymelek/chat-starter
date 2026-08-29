import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, FlatList, TouchableOpacity, View } from 'react-native';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';
import { db } from '@/lib/firebase';
import { useAuth } from '../../context/auth';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { getUserDisplayLabel, getUserInitial, UserDoc } from '@/lib/users';

interface UserData extends UserDoc {
  id: string;
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useBrandTheme();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList: UserData[] = [];
        querySnapshot.forEach((userDoc) => {
          if (userDoc.id !== user.uid) {
            usersList.push({ id: userDoc.id, ...userDoc.data() } as UserData);
          }
        });
        usersList.sort((a, b) =>
          getUserDisplayLabel(a).localeCompare(getUserDisplayLabel(b))
        );
        setUsers(usersList);
        setError('');
      } catch (err) {
        console.error('Error fetching users: ', err);
        setError(getFirebaseErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const startChat = async (selectedUser: UserData) => {
    if (!user) return;

    try {
      const chatRoomsRef = collection(db, 'chatRooms');
      const q = query(chatRoomsRef, where('participants', 'array-contains', user.uid));

      const querySnapshot = await getDocs(q);
      let existingRoomId: string | null = null;

      querySnapshot.forEach((roomDoc) => {
        const data = roomDoc.data();
        if (data.participants?.includes(selectedUser.id)) {
          existingRoomId = roomDoc.id;
        }
      });

      if (existingRoomId) {
        router.push(`/chat/${existingRoomId}`);
      } else {
        const displayName = getUserDisplayLabel(selectedUser);
        const newRoom = await addDoc(chatRoomsRef, {
          participants: [user.uid, selectedUser.id],
          name: displayName,
          updatedAt: serverTimestamp(),
          lastMessage: '',
        });
        router.push(`/chat/${newRoom.id}`);
      }
    } catch (err) {
      console.error('Error creating or fetching chat room:', err);
      setError(getFirebaseErrorMessage(err));
    }
  };

  const renderItem = ({ item }: { item: UserData }) => {
    const label = getUserDisplayLabel(item);
    const showEmail = item.displayName?.trim() && item.email;

    return (
      <TouchableOpacity
        onPress={() => startChat(item)}
        style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel={`Start chat with ${label}`}
      >
        {item.photoURL ? (
          <Image
            source={{ uri: item.photoURL }}
            style={styles.avatarImage}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
            <ThemedText style={[styles.avatarText, { color: theme.textOnAccent }]}>
              {getUserInitial(item)}
            </ThemedText>
          </View>
        )}
        <View style={styles.userInfo}>
          <ThemedText style={styles.nameText}>{label}</ThemedText>
          {showEmail ? (
            <ThemedText style={[styles.emailText, { color: theme.textMuted }]}>
              {item.email}
            </ThemedText>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.header, { borderBottomColor: theme.border }]} edges={['top']}>
        <ThemedText type="title" accessibilityRole="header">
          Contacts
        </ThemedText>
      </SafeAreaView>

      {loading ? (
        <ThemedText style={[styles.statusText, { color: theme.textMuted }]}>
          Loading contacts
        </ThemedText>
      ) : error ? (
        <ThemedText
          style={[styles.errorText, { color: theme.destructive }]}
          accessibilityRole="alert"
        >
          {error}
        </ThemedText>
      ) : users.length === 0 ? (
        <ThemedText style={[styles.statusText, { color: theme.textMuted }]}>
          No other users found. Create a second account to start a chat.
        </ThemedText>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          accessibilityRole="list"
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: minTouchSize,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emailText: {
    fontSize: 13,
    marginTop: 2,
  },
  statusText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 14,
    paddingHorizontal: 24,
  },
});
