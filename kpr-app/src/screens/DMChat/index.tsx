import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { io, Socket } from "socket.io-client";
import debounce from "lodash.debounce";
import api, { BASE_URL } from "../../api/client";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import type { RootStackParamList } from "../../navigation/AppNavigator";

const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

type DMChatRoute = RouteProp<RootStackParamList, "DMChat">;

type Message = {
  _id: string;
  roomId: string;
  content: string;
  authorName: string;
  author: string;
  createdAt: string;
  readBy?: string[];
};

export default function DMChat() {
  const route = useRoute<DMChatRoute>();
  const navigation = useNavigation<any>();
  const { room, partner } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [startingHuddle, setStartingHuddle] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingOpacity = useSharedValue(0);
  const typingStyle = useAnimatedStyle(() => ({
    opacity: withTiming(typingOpacity.value, { duration: 220 })
  }));

  const currentUser = (globalThis as any).__KPR_USER;
  const token = (globalThis as any).__KPR_TOKEN;
  const currentUserId = currentUser?._id || currentUser?.id;

  const typingCount = useMemo(() => Object.keys(typingUsers).length, [typingUsers]);
  const typingMessage = useMemo(() => {
    if (typingCount === 0) return "";
    const activeNames = Object.values(typingUsers);
    return typingCount === 1 ? `${activeNames[0]} is typing...` : `${typingCount} creators typing...`;
  }, [typingCount, typingUsers]);

  const headerName = useMemo(() => partner?.name || room.name?.replace?.("DM • ", "") || "Direct message", [partner?.name, room.name]);
  const normalizedMembers = useMemo(() => (room.members || []).map((member) => String(member)).filter(Boolean), [room.members]);

  useEffect(() => {
    typingOpacity.value = typingCount > 0 ? 1 : 0;
  }, [typingCount, typingOpacity]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
  };

  const markMessagesRead = useCallback(async () => {
    if (!token) return;
    try {
      await api.post(
        "/messages/mark-read",
        { roomId: room._id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (err) {
      console.warn("dm mark read", err);
    }
  }, [room._id, token]);

  const markReadDebounced = useMemo(() => debounce(() => markMessagesRead(), 600), [markMessagesRead]);

  useEffect(() => () => markReadDebounced.cancel(), [markReadDebounced]);

  useFocusEffect(
    useCallback(() => {
      markMessagesRead();
    }, [markMessagesRead])
  );

  const fetchMessages = useCallback(async () => {
    if (!token) {
      Alert.alert("Login required", "Please login again to chat.");
      navigation.navigate("Auth");
      return;
    }
    try {
      const res = await api.get(`/rooms/${room._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data || []);
      setTimeout(scrollToEnd, 60);
      await markMessagesRead();
    } catch (err) {
      console.warn("dm chat fetch", err);
    } finally {
      setLoading(false);
    }
  }, [navigation, room._id, token, markMessagesRead]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const socket = io(BASE_URL, { transports: ["websocket"], forceNew: true });
    socketRef.current = socket;
    if (currentUserId) {
      socket.emit("identify", { userId: currentUserId });
    }
    socket.emit("joinRoom", { roomId: room._id, userId: currentUserId || "guest" });

    socket.on("roomMessage", (payload: Message) => {
      if (payload.roomId !== room._id) return;
      setMessages((prev) => [...prev, payload]);
      scrollToEnd();
      if (payload.author !== currentUserId) {
        markReadDebounced();
      }
    });

    socket.on("userTyping", ({ userId, isTyping, userName }: { userId?: string; isTyping?: boolean; userName?: string }) => {
      if (!userId || userId === currentUserId) return;
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
  }, [room._id, currentUserId, typingOpacity, markReadDebounced]);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current;
      const userId = currentUserId;
      if (!socket || !userId) return;
      socket.emit("typing", {
        roomId: room._id,
        userId,
        isTyping,
        userName: currentUser?.name || "Creator"
      });
    },
    [currentUserId, currentUser?.name, room._id]
  );

  const debouncedStopTyping = useMemo(() => debounce(() => emitTyping(false), 1200), [emitTyping]);

  useEffect(() => () => debouncedStopTyping.cancel(), [debouncedStopTyping]);

  const sendMessage = () => {
    if (!socketRef.current) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!token || !currentUserId) {
      Alert.alert("Login required", "Please login again to chat.");
      return;
    }
    socketRef.current.emit("roomMessage", {
      roomId: room._id,
      content: trimmed,
      userId: currentUserId,
      authorName: currentUser?.name || "You"
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

  const openPartnerProfile = () => {
    if (!partner) return;
    navigation.navigate("UserProfileView", { user: partner });
  };

  const handleVoiceHuddle = useCallback(async () => {
    if (!token || !currentUserId) {
      Alert.alert("Login required", "Please login again to start a huddle.");
      return;
    }
    try {
      setStartingHuddle(true);
  const participantIds = normalizedMembers.filter((id) => id && id !== currentUserId);
      if (!participantIds.length && partner?._id) {
        participantIds.push(partner._id);
      }
      if (!participantIds.length) {
        Alert.alert("No participants", "Invite someone to this DM before starting a huddle.");
        return;
      }
      const response = await api.post(
        "/huddles/create",
        { roomId: room._id, participants: participantIds, type: room.isDM ? "dm" : room.type || "room" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const url = response.data?.url;
      if (!url) throw new Error("Missing huddle URL");
      navigation.navigate("HuddleCall", { url, title: `Huddle • ${headerName}` });
    } catch (err: any) {
      console.warn("start huddle", err);
      Alert.alert("Unable to start huddle", err?.response?.data?.message || err?.message || "Please try again.");
    } finally {
      setStartingHuddle(false);
    }
  }, [token, currentUserId, room._id, room.isDM, room.type, normalizedMembers, partner?._id, navigation, headerName]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine =
      item.authorName === (globalThis as any).__KPR_USER_NAME ||
      (currentUser?.id && item.author === currentUser.id) ||
      item.authorName === "You";

    return (
      <Animated.View entering={FadeIn.springify().damping(12)} style={[styles.msgRow, isMine ? styles.msgRight : styles.msgLeft]}>
        {!isMine && <Text style={styles.msgSender}>{item.authorName || "Anon"}</Text>}
        <View style={[styles.msgBubble, isMine ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={styles.msgText}>{item.content}</Text>
          <Text style={styles.msgTime}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.partnerBlock} onPress={openPartnerProfile}>
          <Image source={partner?.avatar ? { uri: partner.avatar } : DEFAULT_AVATAR} style={styles.partnerAvatar} />
          <View>
            <Text style={styles.headerTitle}>{headerName}</Text>
            <Text style={styles.headerSubtitle}>Direct message</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.huddleBtn, startingHuddle && styles.huddleBtnDisabled]} onPress={handleVoiceHuddle} disabled={startingHuddle}>
            <Text style={styles.huddleText}>{startingHuddle ? "Starting..." : "Huddle"}</Text>
          </TouchableOpacity>
        </View>
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
          placeholder={`Message ${headerName}`}
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
    borderBottomColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.card,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4
  },
  back: { color: colors.accentSecondary, fontSize: 24, marginRight: 12 },
  partnerBlock: { flexDirection: "row", alignItems: "center", flex: 1 },
  partnerAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  headerTitle: { color: colors.accentPrimary, fontSize: 18, ...typography.heading },
  headerSubtitle: { color: colors.textSecondary, fontSize: 12, ...typography.body },
  headerActions: { flexDirection: "row" },
  huddleBtn: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 3
  },
  huddleBtnDisabled: { opacity: 0.6 },
  huddleText: { color: colors.textPrimary, ...typography.heading },
  listContent: { padding: 16, paddingBottom: 120 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 24 },
  typingWrapper: {
    minHeight: 20,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 6
  },
  typingText: { color: colors.textSecondary, fontSize: 13 },
  composer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "flex-end",
    backgroundColor: colors.card
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    padding: 14,
    borderRadius: 16,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body
  },
  sendBtn: {
    backgroundColor: colors.accentPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14
  },
  sendText: { color: colors.textPrimary, ...typography.heading },
  msgRow: { marginBottom: 14, maxWidth: "90%" },
  msgLeft: { alignSelf: "flex-start", marginLeft: 6 },
  msgRight: { alignSelf: "flex-end", marginRight: 6 },
  msgBubble: {
    padding: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)"
  },
  bubbleOther: { backgroundColor: colors.card, borderBottomLeftRadius: 6 },
  bubbleMe: { backgroundColor: colors.accentSecondary, borderBottomRightRadius: 6 },
  msgText: { color: colors.textPrimary, fontSize: 15, ...typography.body },
  msgSender: { color: colors.textSecondary, marginBottom: 4, marginLeft: 4, fontSize: 12, ...typography.body },
  msgTime: { color: "#C8C3D8", fontSize: 10, marginTop: 6, alignSelf: "flex-end" }
});
