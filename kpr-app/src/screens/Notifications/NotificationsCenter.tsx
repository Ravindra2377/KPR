import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NotificationContext } from "../../context/NotificationContext";
import { colors } from "../../theme/colors";
import type { Room } from "../RoomList";
import type { DiscoverUser } from "../../types/discover";
import { formatRelativeTime } from "../../utils/time";

export default function NotificationsCenter() {
  const navigation = useNavigation<any>();
  const { notifications, unreadCount, load, markRead, markAllRead } = useContext(NotificationContext);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = useCallback(
    async (notif: any) => {
      if (!notif?.read) {
        try {
          await markRead(notif._id);
        } catch (err) {
          console.warn("markRead notif", err);
        }
      }

      const meta = notif?.meta || {};

      if (meta.ideaId) return navigation.navigate("IdeaDetail", { id: meta.ideaId });
      if (meta.podId) return navigation.navigate("PodDetail", { id: meta.podId, name: meta.podName || "Pod" });
      if (meta.roomId) {
        const fallbackRoom: Room = {
          _id: meta.roomId,
          name: meta.roomName || notif.title || "Creative Room",
          description: meta.roomDescription || "",
          isDM: meta.isDM,
          type: meta.roomType
        };
        return navigation.navigate(meta.isDM ? "DMChat" : "RoomChat", {
          room: meta.room || fallbackRoom,
          partner: meta.partner
        });
      }
      if (meta.dmRoomId) {
        const dmRoom: Room = {
          _id: meta.dmRoomId,
          name: meta.otherName ? `DM • ${meta.otherName}` : "Direct Message",
          description: "Direct message",
          isDM: true
        };
        return navigation.navigate("DMChat", {
          room: meta.room || dmRoom,
          partner: meta.partner || (meta.otherId ? { _id: meta.otherId, name: meta.otherName } : undefined)
        });
      }
      if (meta.collabRequestId) return navigation.navigate("RequestsInbox");
      if (meta.user) return navigation.navigate("UserProfileView", { user: meta.user });
      if (meta.userId) {
        const user: DiscoverUser = {
          _id: meta.userId,
          name: meta.userName || "Creator",
          avatar: meta.userAvatar,
          bio: meta.userBio,
          skills: meta.userSkills
        };
        return navigation.navigate("UserProfileView", { user });
      }

      Alert.alert("Notification", notif?.message || "Activity updated");
    },
    [markRead, navigation]
  );

  const renderItem = ({ item }: { item: any }) => {
    const timeAgo = formatRelativeTime(item.createdAt);
    return (
      <TouchableOpacity
        style={[styles.card, item.read ? styles.read : styles.unread]}
        onPress={() => handlePress(item)}
      >
        <View style={styles.cardContent}>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        {!item.read ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    );
  };

  const onMarkAll = async () => {
    if (marking || !notifications.length) return;
    setMarking(true);
    try {
      await markAllRead();
    } catch (err) {
      console.warn("markAllRead", err);
      Alert.alert("Heads up", "Unable to mark notifications right now.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Notifications</Text>
          <Text style={styles.subheader}>Unread · {unreadCount}</Text>
        </View>
        <TouchableOpacity onPress={onMarkAll} disabled={marking || !notifications.length}>
          {marking ? (
            <ActivityIndicator color={colors.accentSecondary} />
          ) : (
            <Text style={[styles.markAll, (!notifications.length || marking) && styles.disabled]}>Mark all read</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length ? styles.listContent : styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet. Your activity will land here.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  header: { color: colors.accentPrimary, fontSize: 28, fontWeight: "800" },
  subheader: { color: colors.textSecondary, marginTop: 4 },
  markAll: { color: colors.accentSecondary, fontWeight: "700" },
  disabled: { opacity: 0.4 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2C2237",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accentSecondary
  },
  read: { opacity: 0.7 },
  cardContent: { flex: 1 },
  message: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  time: { color: colors.textSecondary, marginTop: 6, fontSize: 12 },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentSecondary,
    marginLeft: 12
  },
  listContent: { paddingBottom: 32 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: colors.textSecondary, textAlign: "center" }
});
