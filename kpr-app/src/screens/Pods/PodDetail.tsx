import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { useRoute, useNavigation } from "@react-navigation/native";
import PodBoostModal from "../../components/PodBoostModal";

export default function PodDetail() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const podId = route.params?.podId || route.params?.id;
  const currentUserId = (globalThis as any).__KPR_USER_ID;
  const [pod, setPod] = useState<any>(null);
  const [boostVisible, setBoostVisible] = useState(false);

  const fetchPod = useCallback(async () => {
    if (!podId) return;
    try {
      const token = (globalThis as any).__KPR_TOKEN;
      const res = await api.get(`/pods/${podId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPod(res.data);
    } catch (err) {
      console.warn(err);
    }
  }, [podId]);

  useEffect(() => {
    if (podId) {
      fetchPod();
    }
  }, [podId, fetchPod]);

  const applyForRole = async (roleName: string) => {
    if (!podId) {
      Alert.alert("Error", "Pod ID missing");
      return;
    }
    try {
      const token = (globalThis as any).__KPR_TOKEN;
      await api.post(`/pods/${podId}/apply`, { role: roleName }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Applied", "Your application was sent");
      fetchPod();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Unable to apply");
    }
  };

  const startHuddle = async () => {
    if (!podId) {
      Alert.alert("Error", "Pod ID missing");
      return;
    }
    if (!pod) {
      Alert.alert("Error", "Pod not loaded yet");
      return;
    }
    try {
      const token = (globalThis as any).__KPR_TOKEN;
      const memberIds = (pod.members || []).map((member: any) => member._id).filter(Boolean);
      const participants = Array.from(new Set([...(pod.owner?._id ? [pod.owner._id] : []), ...memberIds])).filter(
        (id) => id && id !== currentUserId
      );
      if (!participants.length) {
        Alert.alert("No participants", "Invite someone to this pod before starting a huddle.");
        return;
      }
      const res = await api.post(
        `/huddles/create`,
        { roomId: pod._id, participants, type: "pod" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const url = res.data?.url;
      if (!url) throw new Error("Missing huddle URL");
      nav.navigate("HuddleCall", {
        url,
        title: `Huddle • ${pod?.name}`,
        huddleId: res.data?.huddleId,
        roomId: res.data?.roomId || pod._id,
        isHost: true
      });
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Unable to start huddle");
    }
  };

  if (!pod) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Loading pod...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent}>
      <Image
        source={pod.banner ? { uri: pod.banner } : require("../../assets/placeholder-pod.png")}
        style={styles.hero}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{pod.name}</Text>
        <Text style={styles.description}>{pod.description}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roles</Text>
          {pod.roles?.map((r: any) => (
            <View key={r.role} style={styles.roleRow}>
              <View style={styles.roleTextColumn}>
                <Text style={styles.roleName}>{r.role}</Text>
                <Text style={styles.roleDescription}>{r.description}</Text>
              </View>
              <TouchableOpacity style={styles.applyBtn} onPress={() => applyForRole(r.role)}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => applyForRole("General")}>
            <Text style={styles.primaryBtnText}>Request to Join</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boostBtn} onPress={() => setBoostVisible(true)}>
            <Text style={styles.boostBtnText}>Boost</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.huddleBtn} onPress={startHuddle}>
            <Text style={styles.huddleBtnText}>Start Huddle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PodBoostModal visible={boostVisible} onClose={() => setBoostVisible(false)} pod={pod} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 32 },
  hero: { width: "100%", height: 220, backgroundColor: "#0C0B0F" },
  content: { padding: 18 },
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: "900" },
  description: { color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  section: { marginTop: 18 },
  sectionTitle: { color: colors.accentPrimary, fontWeight: "800", marginBottom: 10 },
  roleRow: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  roleTextColumn: { flex: 1, marginRight: 12 },
  roleName: { color: colors.textPrimary, fontWeight: "700" },
  roleDescription: { color: colors.textSecondary, marginTop: 4 },
  applyBtn: { backgroundColor: colors.accentSecondary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  applyBtnText: { color: colors.textPrimary, fontWeight: "800" },
  actionsRow: { flexDirection: "row", marginTop: 20, paddingHorizontal: 4 },
  primaryBtn: { flex: 1, backgroundColor: colors.accentSecondary, borderRadius: 12, padding: 14, marginRight: 10, alignItems: "center" },
  primaryBtnText: { color: colors.textPrimary, fontWeight: "800" },
  boostBtn: { backgroundColor: "#9B59FF", borderRadius: 12, padding: 14, marginRight: 10, alignItems: "center" },
  boostBtnText: { color: colors.textPrimary, fontWeight: "800" },
  huddleBtn: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  huddleBtnText: { color: colors.textPrimary },
  emptyState: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textSecondary }
});
