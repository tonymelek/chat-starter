import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "../../context/auth";
import { getFirebaseErrorMessage } from "@/lib/firebase-errors";

type ChatMessage = {
  _id: string;
  text: string;
  createdAt: Date;
  user: { _id: string; name?: string };
};

// ─── Bubble ─────────────────────────────────────────────────────────────────
function MessageBubble({ message, isMe }: { message: ChatMessage; isMe: boolean }) {
const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
          {message.text}
        </Text>
        <Text style={[styles.timeText, isMe ? styles.timeMe : styles.timeThem]}>
          {time}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [roomName, setRoomName] = useState("Chat");
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    
    // Fetch room metadata (specifically the name)
    const roomRef = doc(db, "chatRooms", id);
    const unsubRoom = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomName(data.name || "Chat");
          setNewRoomName(data.name || "Chat");
        }
        setError("");
      },
      (err) => setError(getFirebaseErrorMessage(err))
    );

    const q = query(
      collection(db, "chatRooms", id, "messages"),
      orderBy("createdAt", "desc")
    );
    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              _id: docSnap.id,
              text: data.text,
              createdAt: data.createdAt?.toDate() || new Date(),
              user: {
                _id: data.senderId,
                name: data.senderId === user?.uid ? "Me" : "Other",
              },
            };
          })
        );
        setError("");
      },
      (err) => setError(getFirebaseErrorMessage(err))
    );

    return () => {
      unsubRoom();
      unsubscribeMessages();
    };
  }, [id, user]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !id || !user) return;
    setInputText("");
    Keyboard.dismiss();
    try {
      await addDoc(collection(db, "chatRooms", id, "messages"), {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "chatRooms", id), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error sending:", e);
      setError(getFirebaseErrorMessage(e));
      setInputText(text);
    }
  }, [inputText, id, user]);

  const handleRename = async () => {
    if (!id || !newRoomName.trim()) return;
    try {
      await updateDoc(doc(db, "chatRooms", id), {
        name: newRoomName.trim(),
      });
      setIsRenameModalVisible(false);
      Keyboard.dismiss();
    } catch (e) {
      console.error("Error renaming:", e);
      setError(getFirebaseErrorMessage(e));
    }
  };

  return (
    <View style={styles.root}>
      {/* Opaque header — backed by headerStatusBarHeight for Android consistency */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: roomName,
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#6C63FF",
          headerTitleStyle: { fontWeight: "700", color: "#1a1a2e" },
          headerShadowVisible: true,
          headerTransparent: false,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => setIsRenameModalVisible(true)}
              style={styles.headerBtn}
            >
              <Text style={styles.headerBtnText}>Rename</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => String(item._id)}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.user._id === user?.uid} />
          )}
          inverted
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        />

        {/* Liquid glass input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.inputGlass}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message…"
              placeholderTextColor="rgba(80,80,120,0.45)"
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              disabled={!inputText.trim()}
              activeOpacity={0.75}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Rename Modal */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setIsRenameModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Rename Chat Room</Text>
            <TextInput
              style={styles.modalInput}
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholder="Enter new name..."
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => setIsRenameModalVisible(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleRename}
                style={[styles.modalBtn, styles.modalBtnSave]}
              >
                <Text style={styles.modalBtnTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const ACCENT = "#6C63FF";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5FA" },
  flex: { flex: 1 },

  errorBanner: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fecaca",
  },
  errorBannerText: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // Bubbles
  bubbleRow: { marginVertical: 3, flexDirection: "row" },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowThem: { justifyContent: "flex-start" },

  bubble: {
    maxWidth: "75%",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  bubbleMe: {
    backgroundColor: ACCENT,
    borderColor: "#5A52D5",
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(108,99,255,0.2)",
    borderBottomLeftRadius: 6,
    // subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: { fontSize: 15.5, lineHeight: 21 },
  bubbleTextMe: { color: "#ffffff" },
  bubbleTextThem: { color: "#1a1a2e" },

  timeText: { fontSize: 10, marginTop: 4, opacity: 0.7 },
  timeMe: { color: "rgba(255,255,255,0.85)", textAlign: "right" },
  timeThem: { color: "#555" },

  // Input bar — fully opaque so messages never bleed through
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#F5F5FA",
    borderTopWidth: 1,
    borderTopColor: "rgba(108,99,255,0.15)",
  },
  inputGlass: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(108,99,255,0.35)",
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  textInput: {
    flex: 1,
    color: "#1a1a2e",
    fontSize: 15.5,
    lineHeight: 20,
    maxHeight: 110,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(108,99,255,0.25)",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(108,99,255,0.1)",
  },
  headerBtnText: {
    color: ACCENT,
    fontWeight: "600",
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#F5F5FA",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1a1a2e",
    borderWidth: 1.5,
    borderColor: "rgba(108,99,255,0.15)",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#F5F5FA",
  },
  modalBtnSave: {
    backgroundColor: ACCENT,
  },
  modalBtnTextCancel: {
    color: "#555",
    fontWeight: "600",
    fontSize: 16,
  },
  modalBtnTextSave: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
