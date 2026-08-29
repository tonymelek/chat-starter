import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, FlatList, TouchableOpacity, View } from 'react-native';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from "@/lib/firebase";
import { useAuth } from '../../context/auth';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { getUserDisplayLabel, getUserInitial, UserDoc } from '@/lib/users';

interface UserData extends UserDoc {
  id: string;
}

export default function ExploreScreen() {
  const { user } = useAuth();
  const router = useRouter();
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
      <TouchableOpacity onPress={() => startChat(item)} style={styles.userCard}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{getUserInitial(item)}</ThemedText>
          </View>
        )}
        <View style={styles.userInfo}>
          <ThemedText style={styles.nameText}>{label}</ThemedText>
          {showEmail ? (
            <ThemedText style={styles.emailText}>{item.email}</ThemedText>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <ThemedText type="title">Contacts</ThemedText>
      </SafeAreaView>

      {loading ? (
        <ThemedText style={styles.statusText}>Loading users...</ThemedText>
      ) : error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : users.length === 0 ? (
        <ThemedText style={styles.statusText}>No other users found.</ThemedText>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
    borderBottomColor: '#ccc',
  },
  listContent: {
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.ink,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emailText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 14,
    color: '#dc2626',
    paddingHorizontal: 24,
  },
});
