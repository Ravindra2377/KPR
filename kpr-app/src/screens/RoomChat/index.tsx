import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { io, Socket } from "socket.io-client";
import api, { BASE_URL } from "../../api/client";
import { colors } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type RoomChatRoute = RouteProp<RootStackParamList, "RoomChat">;

type Message = {
  _id: string;
  roomId: string;
  content: string;
  authorName: string;
  author: string;
  createdAt: string;
};

export default function RoomChat() {
  const route = useRoute<RoomChatRoute>();
  const nav = useNavigation<any>();
  const { room } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUser = (globalThis as any).__KPR_USER;
  const token = (globalThis as any).__KPR_TOKEN;

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  };

  const fetchMessages = useCallback(async () => {
    if (!token) {
      Alert.alert("Login required", "Please login again to chat.");
      nav.navigate("Auth");
      return;
    }
    try {
      const res = await api.get(`/rooms/${room._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data || []);
      setTimeout(scrollToEnd, 50);
    } catch (err) {
      console.warn("fetchMessages error", err);
    } finally {
      setLoading(false);
    }
  }, [nav, room._id, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const socket = io(BASE_URL, { transports: ["websocket"], forceNew: true });
    socketRef.current = socket;
  socket.emit("joinRoom", { roomId: room._id, userId: currentUser?.id || "guest" });

    socket.on("roomMessage", (payload: Message) => {
      if (payload.roomId !== room._id) return;
      setMessages((prev) => [...prev, payload]);
      scrollToEnd();
    });

    return () => {
      socket.removeAllListeners("roomMessage");
      socket.disconnect();
    };
  }, [room._id, currentUser?.id]);

  const sendMessage = () => {
    if (!socketRef.current) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!token || !currentUser?.id) {
      Alert.alert("Login required", "Please login again to chat.");
      return;
    }
    socketRef.current.emit("roomMessage", {
      roomId: room._id,
      content: trimmed,
      userId: currentUser?.id,
      authorName: currentUser?.name || "Anonymous"
    });
    setInput("");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = currentUser?.id && item.author === currentUser.id;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && <Text style={styles.author}>{item.authorName}</Text>}
          <Text style={styles.content}>{item.content}</Text>
          <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.back}>{"←"}</Text>
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>{room.name}</Text>
          {room.description ? <Text style={styles.headerSubtitle}>{room.description}</Text> : null}
        </View>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
      />
      <View style={styles.composerRow}>
        <TextInput
          style={styles.input}
          placeholder="Send a vibe"
          placeholderTextColor="#777"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.panel },
  back: { color: colors.accentSecondary, fontSize: 24, marginRight: 12 },
  headerTextBlock: { flex: 1 },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "600" },
  headerSubtitle: { color: colors.textSecondary, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 100 },
  bubbleRow: { flexDirection: "row", marginBottom: 12 },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleMine: { backgroundColor: colors.accentSecondary, borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: colors.surface, borderBottomLeftRadius: 2 },
  author: { color: colors.textSecondary, fontSize: 12, marginBottom: 4 },
  content: { color: colors.textPrimary, fontSize: 16 },
  timestamp: { color: colors.textSecondary, fontSize: 11, marginTop: 6, textAlign: "right" },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 24 },
  composerRow: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.panel, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.background, color: colors.textPrimary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 10 },
  sendButton: { backgroundColor: colors.accentPrimary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  sendText: { color: colors.textPrimary, fontWeight: "600" }
});
