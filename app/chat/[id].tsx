import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { IconButton } from '@/components/ui/icon-button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LiveStatus } from '@/components/ui/live-status';
import { minTouchSize } from '@/constants/a11y';
import { useBrandTheme } from '@/hooks/use-brand-theme';
import { db } from '@/lib/firebase';
import { useAuth } from '../../context/auth';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';

type ChatMessage = {
  _id: string;
  text: string;
  createdAt: Date;
  user: { _id: string; name?: string };
};

function MessageBubble({ message, isMe }: { message: ChatMessage; isMe: boolean }) {
  const theme = useBrandTheme();
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const who = isMe ? 'You' : message.user.name || 'Other';

  return (
    <View
      style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}
      accessible
      accessibilityLabel={`${who}, ${message.text}, ${time}`}
    >
      <View
        style={[
          styles.bubble,
          isMe
            ? { backgroundColor: theme.bubbleMe, borderColor: theme.accent }
            : { backgroundColor: theme.bubbleThem, borderColor: theme.border },
          isMe ? styles.bubbleMe : styles.bubbleThem,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isMe ? theme.bubbleMeText : theme.bubbleThemText },
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.timeText,
            { color: isMe ? theme.bubbleMeText : theme.textMuted, textAlign: isMe ? 'right' : 'left' },
          ]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useBrandTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [roomName, setRoomName] = useState('Chat');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const roomRef = doc(db, 'chatRooms', id);
    const unsubRoom = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRoomName(data.name || 'Chat');
          setNewRoomName(data.name || 'Chat');
        }
        setError('');
      },
      (err) => setError(getFirebaseErrorMessage(err))
    );

    const q = query(
      collection(db, 'chatRooms', id, 'messages'),
      orderBy('createdAt', 'desc')
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
                name: data.senderId === user?.uid ? 'Me' : 'Other',
              },
            };
          })
        );
        setError('');
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
    setInputText('');
    Keyboard.dismiss();
    try {
      await addDoc(collection(db, 'chatRooms', id, 'messages'), {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'chatRooms', id), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('Error sending:', e);
      setError(getFirebaseErrorMessage(e));
      setInputText(text);
    }
  }, [inputText, id, user]);

  const handleRename = async () => {
    if (!id || !newRoomName.trim()) return;
    try {
      await updateDoc(doc(db, 'chatRooms', id), {
        name: newRoomName.trim(),
      });
      setIsRenameModalVisible(false);
      Keyboard.dismiss();
    } catch (e) {
      console.error('Error renaming:', e);
      setError(getFirebaseErrorMessage(e));
    }
  };

  const canSend = Boolean(inputText.trim());

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: roomName,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.accent,
          headerTitleStyle: { fontWeight: '700', color: theme.text },
          headerShadowVisible: true,
          headerTransparent: false,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsRenameModalVisible(true)}
              style={[styles.headerBtn, { backgroundColor: theme.accentMuted }]}
              accessibilityRole="button"
              accessibilityLabel="Rename conversation"
            >
              <Text style={[styles.headerBtnText, { color: theme.accent }]}>Rename</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.destructiveMuted }]}>
            <LiveStatus message={error} />
          </View>
        ) : null}

        {messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No messages yet. Say hello.
            </Text>
          </View>
        ) : (
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
        )}

        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputGlass,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message"
              placeholderTextColor={theme.textMuted}
              accessibilityLabel="Message"
              accessibilityHint="Up to 1000 characters"
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <IconButton
              onPress={sendMessage}
              disabled={!canSend}
              accessibilityLabel="Send message"
              style={[
                styles.sendBtn,
                { backgroundColor: canSend ? theme.action : theme.surfaceMuted },
              ]}
            >
              <IconSymbol
                name="paperplane.fill"
                size={18}
                color={canSend ? theme.actionForeground : theme.textMuted}
              />
            </IconButton>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalVisible(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}
          onPress={() => setIsRenameModalVisible(false)}
          accessibilityLabel="Dismiss rename dialog"
          accessibilityRole="button"
        >
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
            onStartShouldSetResponder={() => true}
            accessibilityRole="none"
          >
            <Text
              style={[styles.modalTitle, { color: theme.text }]}
              accessibilityRole="header"
            >
              Rename Chat Room
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.surfaceMuted,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholder="Enter new name"
              placeholderTextColor={theme.textMuted}
              accessibilityLabel="Conversation name"
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setIsRenameModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: theme.surfaceMuted }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.modalBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
                style={[styles.modalBtn, { backgroundColor: theme.action }]}
                accessibilityRole="button"
                accessibilityLabel="Save conversation name"
              >
                <Text style={[styles.modalBtnText, { color: theme.actionForeground }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  errorBanner: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },

  bubbleRow: { marginVertical: 3, flexDirection: 'row' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '75%',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
  },
  bubbleMe: {
    borderBottomRightRadius: 6,
  },
  bubbleThem: {
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },
  timeText: { fontSize: 11, marginTop: 4, opacity: 0.85 },

  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputGlass: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 28,
    borderWidth: 1,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 110,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    borderRadius: 22,
    marginLeft: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    minHeight: minTouchSize,
    borderRadius: 16,
    justifyContent: 'center',
  },
  headerBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 24,
    minHeight: minTouchSize,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    minHeight: minTouchSize,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
