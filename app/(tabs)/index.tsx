import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Image } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '@/lib/firebase';
import { useAuth } from '../../context/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import {
  fetchUserProfiles,
  getOtherParticipantId,
  getUserDisplayLabel,
  getUserInitial,
  UserDoc,
} from '@/lib/users';

interface ChatRoom {
  id: string;
  name?: string;
  participants: string[];
  lastMessage: string;
  updatedAt: { toDate: () => Date } | null;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useBrandTheme();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const roomsRef = collection(db, 'chatRooms');
    const q = query(
      roomsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const roomList: ChatRoom[] = [];
        snapshot.forEach((docSnap) => {
          roomList.push({ id: docSnap.id, ...docSnap.data() } as ChatRoom);
        });
        setRooms(roomList);
        setLoading(false);
        setError('');
      },
      (err) => {
        console.error('Error loading rooms:', err);
        setError(getFirebaseErrorMessage(err));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user || rooms.length === 0) {
      setProfiles({});
      return;
    }

    const otherUids = rooms
      .map((room) => getOtherParticipantId(room.participants, user.uid))
      .filter((uid): uid is string => Boolean(uid));

    fetchUserProfiles(otherUids)
      .then(setProfiles)
      .catch((err) => console.error('Error loading participant profiles:', err));
  }, [rooms, user]);

  const renderRoom = ({ item }: { item: ChatRoom }) => {
    const dateStr = item.updatedAt?.toDate
      ? item.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const otherUid = user ? getOtherParticipantId(item.participants, user.uid) : undefined;
    const other = otherUid ? profiles[otherUid] : undefined;
    const title = other ? getUserDisplayLabel(other) : item.name || 'Chat';
    const preview = item.lastMessage || 'No messages yet';

    return (
      <TouchableOpacity
        style={[styles.roomCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => router.push(`/chat/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${preview}${dateStr ? `, ${dateStr}` : ''}`}
      >
        {other?.photoURL ? (
          <Image
            source={{ uri: other.photoURL }}
            style={styles.roomAvatarImage}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.roomAvatar, { backgroundColor: theme.accent }]}>
            <Text style={[styles.roomAvatarInitial, { color: theme.textOnAccent }]}>
              {other ? getUserInitial(other) : '?'}
            </Text>
          </View>
        )}
        <View style={styles.roomInfo}>
          <ThemedText style={styles.roomTitle}>{title}</ThemedText>
          <ThemedText style={[styles.lastMessage, { color: theme.textMuted }]} numberOfLines={1}>
            {preview}
          </ThemedText>
        </View>
        <View style={styles.roomMeta}>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        style={[styles.header, { borderBottomColor: theme.border }]}
        edges={['top']}
      >
        <ThemedText type="title" accessibilityRole="header">
          Messages
        </ThemedText>
      </SafeAreaView>

      {loading ? (
        <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
          Loading conversations
        </ThemedText>
      ) : error ? (
        <ThemedText
          style={[styles.errorText, { color: theme.destructive }]}
          accessibilityRole="alert"
        >
          {error}
        </ThemedText>
      ) : rooms.length === 0 ? (
        <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
          No messages yet. Open Contacts to start a chat.
        </ThemedText>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
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
  roomCard: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    minHeight: minTouchSize,
  },
  roomAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roomAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  roomAvatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  roomMeta: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
  },
  emptyText: {
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
