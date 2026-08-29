import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, TouchableOpacity, View, Text, Image } from "react-native";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "@/lib/firebase";
import { useAuth } from "../../context/auth";
import { Brand } from "@/constants/brand";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";
import {
  fetchUserProfiles,
  getOtherParticipantId,
  getUserDisplayLabel,
  getUserInitial,
  UserDoc,
} from "@/lib/users";

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
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserDoc>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const roomsRef = collection(db, "chatRooms");
    const q = query(
      roomsRef,
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
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
        setError("");
      },
      (err) => {
        console.error("Error loading rooms:", err);
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
      .catch((err) => console.error("Error loading participant profiles:", err));
  }, [rooms, user]);

  const renderRoom = ({ item }: { item: ChatRoom }) => {
    const dateStr = item.updatedAt?.toDate
      ? item.updatedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const otherUid = user ? getOtherParticipantId(item.participants, user.uid) : undefined;
    const other = otherUid ? profiles[otherUid] : undefined;
    const title = other ? getUserDisplayLabel(other) : item.name || "Chat";

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        {other?.photoURL ? (
          <Image source={{ uri: other.photoURL }} style={styles.roomAvatarImage} />
        ) : (
          <View style={styles.roomAvatar}>
            <Text style={styles.roomAvatarInitial}>
              {other ? getUserInitial(other) : "?"}
            </Text>
          </View>
        )}
        <View style={styles.roomInfo}>
          <ThemedText style={styles.roomTitle}>{title}</ThemedText>
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || "No messages yet"}
          </ThemedText>
        </View>
        <View style={styles.roomMeta}>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.header} edges={["top"]}>
        <ThemedText type="title">Messages</ThemedText>
      </SafeAreaView>

      {loading ? (
        <ThemedText style={styles.emptyText}>Loading...</ThemedText>
      ) : error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : rooms.length === 0 ? (
        <ThemedText style={styles.emptyText}>
          No messages yet. Go to Contacts to start a chat!
        </ThemedText>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
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
    borderBottomColor: "#ccc",
  },
  listContent: {
    padding: 10,
  },
  roomCard: {
    flexDirection: "row",
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roomAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Brand.ink,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  roomAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  roomAvatarInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  roomMeta: {
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#888",
  },
  errorText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 14,
    color: "#dc2626",
    paddingHorizontal: 24,
  },
});
