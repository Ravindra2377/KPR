import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { RouteProp, useRoute } from "@react-navigation/native";

type RouteProps = RouteProp<{ params: { id: string } }, "params">;

export default function IdeaDetail() {
  const route = useRoute<RouteProps>();
  const { id } = route.params;
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchIdea = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/ideas/${id}`);
      setIdea(res.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const appreciate = async () => {
    try {
      const token = (globalThis as any).__KPR_TOKEN;
      if (!token) {
        Alert.alert("Login required");
        return;
      }
      await api.post(`/ideas/${id}/appreciate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchIdea();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    }
  };

  useEffect(() => {
    fetchIdea();
  }, [fetchIdea]);

  if (loading || !idea) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{idea.title}</Text>
      <Text style={styles.desc}>{idea.description}</Text>
      <Text style={styles.meta}>By: {idea.author?.name}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.button} onPress={appreciate}>
          <Text style={styles.buttonText}>Appreciate ❤️</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <View style={styles.countBox}>
          <Text style={styles.countText}>{idea.appreciationCount || 0}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  title: { color: colors.accentPrimary, fontSize: 22, fontWeight: "700" },
  desc: { color: colors.textSecondary, marginTop: 12 },
  meta: { color: colors.textSecondary, marginTop: 10, fontStyle: "italic" },
  button: { backgroundColor: colors.accentSecondary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },
  buttonText: { color: colors.textPrimary, fontWeight: "600" },
  countBox: { backgroundColor: colors.surface, padding: 12, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  countText: { color: colors.textPrimary, fontWeight: "600" },
  actionsRow: { flexDirection: "row", marginTop: 20, alignItems: "center" },
  spacer: { width: 12 }
});
