import React, { useCallback, useContext, useEffect, useRef } from "react";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Alert, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import JitsiMeet, { JitsiMeetView } from "react-native-jitsi-meet";
import { colors } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import api from "../../api/client";
import { NotificationContext } from "../../context/NotificationContext";

type HuddleRoute = RouteProp<RootStackParamList, "HuddleCall">;

export default function HuddleCall() {
  const route = useRoute<HuddleRoute>();
  const navigation = useNavigation<any>();
  const { socket } = useContext(NotificationContext);
  const { url, title, huddleId, isHost } = route.params;
  const currentUserId = (globalThis as any).__KPR_USER_ID;
  const hasEndedRef = useRef(false);

  useEffect(() => {
    const userInfo = {
      displayName: (globalThis as any).__KPR_USER_NAME || "Creator",
      email: (globalThis as any).__KPR_USER?.email,
      avatar: (globalThis as any).__KPR_USER?.avatar
    };
    const timer = setTimeout(() => {
      try {
        JitsiMeet.call(url, userInfo);
      } catch (err) {
        console.warn("jitsi call error", err);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      JitsiMeet.endCall();
    };
  }, [url]);

  const endHuddle = useCallback(async () => {
    if (!isHost || !huddleId || hasEndedRef.current) return;
    hasEndedRef.current = true;
    try {
      const token = (globalThis as any).__KPR_TOKEN;
      if (!token) return;
      await api.post(`/huddles/${huddleId}/end`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.warn("end huddle error", err);
    }
  }, [huddleId, isHost]);

  useEffect(() => {
    return () => {
      endHuddle();
    };
  }, [endHuddle]);

  useEffect(() => {
    if (!socket || !huddleId) return;
    const handler = (payload: { huddleId?: string; endedBy?: string; roomId?: string }) => {
      if (payload.huddleId !== huddleId) return;
      if (payload.endedBy === currentUserId) return;
      if (hasEndedRef.current) return;
      hasEndedRef.current = true;
      JitsiMeet.endCall();
      navigation.goBack();
      Alert.alert("Huddle ended", "The huddle was closed.");
    };
    socket.on("huddleEnded", handler);
    return () => {
      socket.off("huddleEnded", handler);
    };
  }, [socket, huddleId, currentUserId, navigation]);

  const handleLeave = useCallback(async () => {
    JitsiMeet.endCall();
    await endHuddle();
    navigation.goBack();
  }, [endHuddle, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.overlayHeader}>
        <Text style={styles.overlayTitle}>{title || "Huddle"}</Text>
        <TouchableOpacity style={styles.hangupBtn} onPress={handleLeave}>
          <Text style={styles.hangupText}>Leave</Text>
        </TouchableOpacity>
      </View>
      <JitsiMeetView style={styles.meet} onConferenceTerminated={handleLeave} onConferenceJoined={() => {}} onConferenceWillJoin={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  meet: { flex: 1, height: "100%", width: "100%" },
  overlayHeader: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14
  },
  overlayTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
  hangupBtn: {
    backgroundColor: "#ff4d4d",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999
  },
  hangupText: { color: "#fff", fontWeight: "700" }
});
