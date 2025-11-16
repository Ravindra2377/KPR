import React, { useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NotificationContext } from "../../context/NotificationContext";
import { colors } from "../../theme/colors";

export default function NotificationsScreen() {
  const { notifications, markRead, markAllRead } = useContext(NotificationContext);
  const nav = useNavigation<any>();

  const openNotification = async (notif: any) => {
    if (!notif?.read) await markRead(notif._id);
    if (notif.meta?.ideaId) {
      nav.navigate("IdeaDetail", { id: notif.meta.ideaId });
    } else if (notif.meta?.podId) {
      nav.navigate("PodDetail", { id: notif.meta.podId, name: "Pod" });
    } else if (notif.meta?.roomId) {
      nav.navigate("RoomChat", { room: notif.meta.room });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Notifications</Text>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.read ? styles.readCard : styles.unreadCard]}
            onPress={() => openNotification(item)}
          >
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  header: { color: colors.accentPrimary, fontSize: 24, fontWeight: "700" },
  markAll: { color: colors.accentSecondary, fontWeight: "600" },
  card: { backgroundColor: colors.surface, padding: 14, borderRadius: 12, marginTop: 12 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.accentSecondary },
  readCard: { opacity: 0.6 },
  message: { color: colors.textPrimary, fontSize: 15 },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },
  empty: { color: colors.textSecondary, marginTop: 40, textAlign: "center" }
});
