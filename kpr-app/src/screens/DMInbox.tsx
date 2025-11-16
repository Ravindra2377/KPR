import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { typography } from "../theme/typography";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import { colors } from "../theme/colors";
import api, { BASE_URL } from "../api/client";
import { io, Socket } from "socket.io-client";
import type { Room } from "./RoomList";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { formatRelativeTime } from "../utils/time";

const DEFAULT_AVATAR = require("../assets/default-avatar.png");
const Skeleton = ShimmerPlaceHolder as any;

type InboxUser = {
  _id: string;
  name: string;
  avatar?: string;
  skills?: string[];
  bio?: string;
};

type InboxMessage = {
  _id: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: string;
};

type InboxEntry = {
  roomId: string;
  room: Room;
  other?: InboxUser | null;
  lastMessage?: InboxMessage | null;
  lastAt?: string;
  unreadCount?: number;
  online?: boolean;
};

export default function DMInbox() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InboxEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const currentUserId = (globalThis as any).__KPR_USER_ID;

  const fetchInbox = useCallback(async () => {
    const token = (globalThis as any).__KPR_TOKEN;
    if (!token) {
      setError("Please sign in again to view messages.");
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const response = await api.get<InboxEntry[]>("/rooms/dm/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data || [];
      setItems(list);
    } catch (err) {
      console.warn("dm inbox fetch", err);
      setError("Unable to load messages right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInbox();
    }, [fetchInbox])
  );

  useEffect(() => {
    const socket = io(BASE_URL, { transports: ["websocket"], forceNew: true });
    socketRef.current = socket;

    const userId = (globalThis as any).__KPR_USER_ID;
    if (userId) socket.emit("identify", { userId });

    socket.on("dmListUpdated", () => {
      fetchInbox();
    });

    socket.on("presence", ({ userId: presenceId, online }: { userId?: string; online?: boolean }) => {
      if (!presenceId) return;
      setItems((prev) =>
        prev.map((entry) =>
          entry.other?._id === presenceId
            ? {
                ...entry,
                online: Boolean(online)
              }
            : entry
        )
      );
    });

    socket.on("dmReadReceipt", ({ roomId, readerId }: { roomId?: string; readerId?: string }) => {
      if (!roomId || !readerId || readerId !== currentUserId) return;
      setItems((prev) => prev.map((entry) => (entry.roomId === roomId ? { ...entry, unreadCount: 0 } : entry)));
    });

    return () => {
      socket.removeAllListeners("dmListUpdated");
      socket.removeAllListeners("presence");
      socket.removeAllListeners("dmReadReceipt");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fetchInbox, currentUserId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInbox();
  }, [fetchInbox]);

  const handlePress = useCallback(
    (entry: InboxEntry) => {
      const partner = entry.other || undefined;
      navigation.navigate("DMChat", {
        room: {
          ...entry.room,
          name: entry.room?.name || (partner?.name ? `DM • ${partner.name}` : "Direct message"),
          description: entry.room?.description || "Direct message",
          isDM: true
        },
        partner
      });
    },
    [navigation]
  );

  const renderRow = useCallback(({ item }: { item: InboxEntry }) => {
    const lastPreview = item.lastMessage?.content ? truncate(item.lastMessage.content, 90) : "No messages yet";
    const timeAgo = formatRelativeTime(item.lastMessage?.createdAt || item.lastAt);

    return (
      <TouchableOpacity style={styles.row} onPress={() => handlePress(item)}>
        <View style={styles.avatarWrap}>
          <Image source={item.other?.avatar ? { uri: item.other.avatar } : DEFAULT_AVATAR} style={styles.avatar} />
          <View style={[styles.presenceDot, item.online ? styles.presenceOnline : styles.presenceOffline]} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Text style={styles.rowTitle}>{item.other?.name || "Unknown creator"}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {lastPreview}
          </Text>
        </View>
        {item.unreadCount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }, [handlePress]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.shimmerContainer}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.shimmerRow}>
              <Skeleton style={styles.shimmerAvatar} autoRun visible={false} />
              <View style={styles.shimmerTextBlock}>
                <Skeleton style={styles.shimmerLine} autoRun visible={false} />
                <Skeleton style={[styles.shimmerLine, styles.shimmerLineShort]} autoRun visible={false} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchInbox} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!items.length) {
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No conversations yet.</Text>
          <Text style={styles.emptySub}>Kick things off by messaging a creator or accepting a collab.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.roomId}
        renderItem={renderRow}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
        contentContainerStyle={styles.listContent}
      />
    );
  }, [loading, error, items, refreshing, fetchInbox, onRefresh, renderRow]);

  return (
    <LinearGradient colors={[colors.background, "#050306"]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Pick up exactly where the conversation left off.</Text>
        {content}
      </View>
    </LinearGradient>
  );
}

function truncate(value: string, max: number) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, padding: 20 },
  title: { color: colors.accentPrimary, fontSize: 26, marginBottom: 6, ...typography.title },
  subtitle: { color: colors.textSecondary, marginBottom: 18, ...typography.body },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.card,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3
  },
  avatarWrap: { position: "relative" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#1F1A27" },
  presenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: "absolute",
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: colors.surface
  },
  presenceOnline: { backgroundColor: "#2CEB7B" },
  presenceOffline: { backgroundColor: "#3C314B" },
  rowBody: { flex: 1, marginLeft: 12 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { color: colors.textPrimary, fontSize: 16, flex: 1, marginRight: 12, ...typography.heading },
  time: { color: colors.textSecondary, fontSize: 12, ...typography.body },
  preview: { color: colors.textSecondary, marginTop: 6, ...typography.body },
  badge: {
    backgroundColor: colors.accentSecondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center"
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  shimmerContainer: { marginTop: 12 },
  shimmerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  shimmerAvatar: { width: 56, height: 56, borderRadius: 28 },
  shimmerTextBlock: { marginLeft: 12, flex: 1 },
  shimmerLine: { height: 14, borderRadius: 8, marginBottom: 10 },
  shimmerLineShort: { width: "70%" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  errorText: { color: "#ff6b6b", textAlign: "center", marginBottom: 12, ...typography.body },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.accentSecondary },
  retryText: { color: colors.textPrimary, fontWeight: "700" },
  emptyText: { color: colors.textPrimary, fontSize: 16, marginBottom: 6, textAlign: "center", ...typography.heading },
  emptySub: { color: colors.textSecondary, textAlign: "center", ...typography.body },
  listContent: { paddingBottom: 32 }
});
