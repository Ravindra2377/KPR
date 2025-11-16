import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { NotificationContext } from "../../context/NotificationContext";

export default function TempleHall() {
  const nav = useNavigation<any>();
  const { unreadCount } = useContext(NotificationContext);
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.notifBtn} onPress={() => nav.navigate("Notifications")}>
        <Text style={styles.notifIcon}>🔔</Text>
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      <Text style={styles.title}>KPR</Text>
      <Text style={styles.subtitle}>Your Creative Sanctuary</Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => nav.navigate("IdeaList")}>
          <Text style={styles.buttonText}>Explore Ideas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("IdeaComposer")}
        >
          <Text style={styles.buttonSecondary}>Create Idea</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("RoomList")}
        >
          <Text style={styles.buttonSecondary}>Creative Rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("PodList")}
        >
          <Text style={styles.buttonSecondary}>Collaboration Pods</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("Oracle")}
        >
          <Text style={styles.buttonSecondary}>Ask the Oracle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("Profile")}
        >
          <Text style={styles.buttonSecondary}>Profile & Avatar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  notifBtn: { position: "absolute", right: 24, top: 24 },
  notifIcon: { fontSize: 24 },
  badge: {
    backgroundColor: colors.accentSecondary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: -8,
    top: -6,
    paddingHorizontal: 4
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  title: { color: colors.accentPrimary, fontSize: 40, fontWeight: "700", marginTop: 40 },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  buttonGroup: { marginTop: 40 },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center"
  },
  buttonGap: { marginTop: 16 },
  primaryButton: { backgroundColor: colors.accentSecondary },
  panelButton: { backgroundColor: colors.panel },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  buttonSecondary: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500"
  }
});
