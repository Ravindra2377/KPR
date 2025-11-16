import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useNavigation } from "@react-navigation/native";
import { NotificationContext } from "../../context/NotificationContext";

export default function TempleHall() {
  const nav = useNavigation<any>();
  const { unreadCount } = useContext(NotificationContext);
  const discoverScale = useSharedValue(1);
  const messagesScale = useSharedValue(1);
  const notificationsScale = useSharedValue(1);
  const podsScale = useSharedValue(1);

  const discoverAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: discoverScale.value }]
  }));

  const messagesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messagesScale.value }]
  }));

  const notificationsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationsScale.value }]
  }));
  const podsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: podsScale.value }]
  }));

  const handleDiscoverPressIn = () => {
    discoverScale.value = withTiming(0.97, { duration: 80 });
  };

  const handleDiscoverPressOut = () => {
    discoverScale.value = withTiming(1, { duration: 80 });
  };

  const handleMessagesPressIn = () => {
    messagesScale.value = withTiming(0.97, { duration: 80 });
  };

  const handleMessagesPressOut = () => {
    messagesScale.value = withTiming(1, { duration: 80 });
  };

  const handleNotificationsPressIn = () => {
    notificationsScale.value = withTiming(0.97, { duration: 80 });
  };

  const handleNotificationsPressOut = () => {
    notificationsScale.value = withTiming(1, { duration: 80 });
  };

  const handlePodsPressIn = () => {
    podsScale.value = withTiming(0.97, { duration: 80 });
  };

  const handlePodsPressOut = () => {
    podsScale.value = withTiming(1, { duration: 80 });
  };

  return (
    <LinearGradient colors={[colors.background, "#050507"]} style={styles.container}>
      <TouchableOpacity style={styles.notifBtn} onPress={() => nav.navigate("NotificationsCenter")}>
        <Text style={styles.notifIcon}>🔔</Text>
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
  <Text style={styles.title}>KPR</Text>
  <Text style={styles.subtitle}>The Creative Network for Visionaries</Text>

      <TouchableWithoutFeedback
        onPressIn={handleDiscoverPressIn}
        onPressOut={handleDiscoverPressOut}
        onPress={() => nav.navigate("Discover")}
      >
        <Animated.View style={[styles.card, discoverAnimatedStyle]}>
          <Text style={styles.cardTitle}>Discover Creators</Text>
          <Text style={styles.cardSubtitle}>
            Find talented people by shared skills, interests, and the mediums they craft in.
          </Text>
        </Animated.View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback
        onPressIn={handlePodsPressIn}
        onPressOut={handlePodsPressOut}
        onPress={() => nav.navigate("PodsDiscover")}
      >
        <Animated.View style={[styles.card, styles.podsCard, podsAnimatedStyle]}>
          <Text style={styles.cardTitle}>Pods Marketplace</Text>
          <Text style={styles.cardSubtitle}>Join creative pods forming right now—filter by skill, tags, and open roles.</Text>
        </Animated.View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback
        onPressIn={handleMessagesPressIn}
        onPressOut={handleMessagesPressOut}
        onPress={() => nav.navigate("DMInbox")}
      >
        <Animated.View style={[styles.card, styles.messagesCard, messagesAnimatedStyle]}>
          <Text style={styles.cardTitle}>Messages</Text>
          <Text style={styles.cardSubtitle}>Direct chats, pods, and quick syncs with your collaborators.</Text>
        </Animated.View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback
        onPressIn={handleNotificationsPressIn}
        onPressOut={handleNotificationsPressOut}
        onPress={() => nav.navigate("NotificationsCenter")}
      >
        <Animated.View style={[styles.card, styles.notificationsCard, notificationsAnimatedStyle]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={styles.inlineBadge}>
                <Text style={styles.inlineBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardSubtitle}>Collabs, approvals, and requests roll in here live.</Text>
        </Animated.View>
      </TouchableWithoutFeedback>

      <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => nav.navigate("IdeaList")} activeOpacity={0.9}>
          <LinearGradient colors={[colors.accentPrimary, colors.accentSecondary]} style={[styles.button, styles.primaryButton]}>
            <Text style={styles.buttonText}>Explore Ideas</Text>
          </LinearGradient>
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
          onPress={() => nav.navigate("PodsDiscover")}
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

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("RequestsInbox")}
        >
          <Text style={styles.buttonSecondary}>Collab Requests</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
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
  title: { color: colors.accentPrimary, fontSize: 42, marginTop: 40, ...typography.title },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 12, ...typography.body },
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 20,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4
  },
  podsCard: {
    borderColor: "#4c2bff",
    backgroundColor: "rgba(59,0,122,0.95)"
  },
  messagesCard: {
    marginTop: 0,
    marginBottom: 32
  },
  notificationsCard: {
    marginTop: -12,
    marginBottom: 32
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  inlineBadge: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  inlineBadgeText: { color: colors.textPrimary, fontSize: 12, fontWeight: "700" },
  cardTitle: {
    color: colors.accentPrimary,
    fontSize: 18,
    ...typography.heading
  },
  cardSubtitle: {
    color: colors.textSecondary,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    ...typography.body
  },
  buttonGroup: { marginTop: 40 },
  button: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center"
  },
  buttonGap: { marginTop: 16 },
  primaryButton: {
    shadowColor: colors.accentPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 4
  },
  panelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    ...typography.heading
  },
  buttonSecondary: {
    color: colors.textSecondary,
    fontSize: 15,
    ...typography.body
  }
});
