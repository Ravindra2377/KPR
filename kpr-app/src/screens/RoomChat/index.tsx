import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { io, Socket } from "socket.io-client";
import api, { BASE_URL } from "../../api/client";
import { colors } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import debounce from "lodash.debounce";

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
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingOpacity = useSharedValue(0);
  const typingStyle = useAnimatedStyle(() => ({
    opacity: withTiming(typingOpacity.value, { duration: 220 })
  }));

  const currentUser = (globalThis as any).__KPR_USER;
  const token = (globalThis as any).__KPR_TOKEN;

  const typingCount = useMemo(() => Object.keys(typingUsers).length, [typingUsers]);
  const typingMessage = useMemo(() => {
    if (typingCount === 0) return "";
    const activeNames = Object.values(typingUsers);
    return typingCount === 1
      ? `${activeNames[0]} is typing...`
      : `${typingCount} creators typing...`;
  }, [typingCount, typingUsers]);

  useEffect(() => {
    typingOpacity.value = typingCount > 0 ? 1 : 0;
  }, [typingCount, typingOpacity]);

  const handleStartHuddle = () => {
    Alert.alert("Voice huddle", "We're prepping lightweight voice rooms. Stay tuned!");
  };

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

    socket.on("userTyping", ({ userId, isTyping, userName }: { userId?: string; isTyping?: boolean; userName?: string }) => {
      if (!userId || userId === currentUser?.id) return;
      if (isTyping) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName || "Someone" }));
      } else {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    });

    return () => {
      socket.removeAllListeners("roomMessage");
      socket.removeAllListeners("userTyping");
      socket.disconnect();
      setTypingUsers({});
      typingOpacity.value = 0;
    };
  }, [room._id, currentUser?.id, typingOpacity]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current;
      const userId = currentUser?.id;
      if (!socket || !userId) return;
      socket.emit("typing", {
        roomId: room._id,
        userId,
        isTyping,
        userName: currentUser?.name || "Creator"
      });
    },
    [currentUser?.id, currentUser?.name, room._id]
  );

  const debouncedStopTyping = useMemo(() => debounce(() => emitTyping(false), 1200), [emitTyping]);

  useEffect(() => () => debouncedStopTyping.cancel(), [debouncedStopTyping]);

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
    emitTyping(false);
    debouncedStopTyping.cancel();
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    emitTyping(true);
    debouncedStopTyping();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine =
      item.authorName === (globalThis as any).__KPR_USER_NAME ||
      (currentUser?.id && item.author === currentUser.id) ||
      item.authorName === "You";

    return (
      <Animated.View
        entering={FadeIn.springify().damping(12)}
        style={[styles.msgRow, isMine ? styles.msgRight : styles.msgLeft]}
      >
        {!isMine && <Text style={styles.msgSender}>{item.authorName || "Anon"}</Text>}

        <View style={[styles.msgBubble, isMine ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.msgTime}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </Text>
        </View>
      </Animated.View>
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
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.back}>{"←"}</Text>
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>{room.name}</Text>
          {room.description ? <Text style={styles.headerSubtitle}>{room.description}</Text> : null}
        </View>
        <TouchableOpacity style={styles.huddleBtn} onPress={handleStartHuddle}>
          <Text style={styles.huddleText}>Voice</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, idx) => item._id || `${idx}`}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hi!</Text>}
      />
      <Animated.View style={[styles.typingWrapper, typingStyle]} pointerEvents="none">
        {typingCount > 0 && <Text style={styles.typingText}>{typingMessage}</Text>}
      </Animated.View>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Send a vibe"
          placeholderTextColor="#777"
          value={input}
          onChangeText={handleInputChange}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#131318",
    alignItems: "center",
    backgroundColor: colors.surface,
    flexDirection: "row"
  },
  back: { color: colors.accentSecondary, fontSize: 24, marginRight: 12 },
  headerTextBlock: { flex: 1 },
  headerTitle: { color: colors.accentPrimary, fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: colors.textSecondary, marginTop: 2 },
  huddleBtn: {
    backgroundColor: "#2E2038",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12
  },
  huddleText: { color: colors.accentSecondary, fontWeight: "700" },
  listContent: { padding: 16, paddingBottom: 120 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 24 },
  composer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#111",
    alignItems: "flex-end",
    backgroundColor: colors.surface
  },
  typingWrapper: {
    minHeight: 20,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 6
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 13
  },
  input: {
    flex: 1,
    backgroundColor: "#17161D",
    color: colors.textPrimary,
    padding: 12,
    borderRadius: 14,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 15
  },
  sendBtn: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  sendText: { color: colors.textPrimary, fontWeight: "700" },
  msgRow: {
    marginBottom: 14,
    maxWidth: "90%"
  },
  msgLeft: {
    alignSelf: "flex-start",
    marginLeft: 6
  },
  msgRight: {
    alignSelf: "flex-end",
    marginRight: 6
  },
  msgBubble: {
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  bubbleOther: {
    backgroundColor: "#241A36",
    borderBottomLeftRadius: 4
  },
  bubbleMe: {
    backgroundColor: colors.accentSecondary,
    borderBottomRightRadius: 4
  },
  msgText: {
    color: colors.textPrimary,
    fontSize: 15
  },
  msgSender: {
    color: "#AAA",
    marginBottom: 4,
    marginLeft: 4,
    fontSize: 12
  },
  msgTime: {
    color: "#C8C3D8",
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end"
  }
});
