import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";

export default function PodList() {
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const nav = useNavigation<any>();

  const tokenHeaders = () => {
    const token = (globalThis as any).__KPR_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const fetchPods = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/pods", { headers: tokenHeaders() });
      setPods(res.data || []);
    } catch (err) {
      console.warn("fetch pods err", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPod = async () => {
    if (!name.trim()) return Alert.alert("Name required");
    try {
      const res = await api.post(
        "/pods",
        { name: name.trim(), description: desc },
        { headers: tokenHeaders() }
      );
      setName("");
      setDesc("");
      fetchPods();
      nav.navigate("PodDetail", { id: res.data._id, name: res.data.name });
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    }
  };

  useEffect(() => {
    fetchPods();
  }, [fetchPods]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Collaboration Pods</Text>
      <Text style={styles.sub}>Create chambers and build with your crew.</Text>

      <View style={styles.formCard}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="New pod name"
          placeholderTextColor="#777"
          style={styles.input}
        />
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Short description (optional)"
          placeholderTextColor="#777"
          style={[styles.input, styles.inputGap]}
        />
        <TouchableOpacity style={styles.createBtn} onPress={createPod}>
          <Text style={styles.createText}>Create Pod</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accentPrimary} style={styles.loader} />
      ) : (
        <FlatList
          data={pods}
          keyExtractor={(p) => p._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate("PodDetail", { id: item._id, name: item.name })}
            >
              <Text style={styles.title}>{item.name}</Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              <Text style={styles.meta}>Members: {item.members?.length || 0}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No pods yet.</Text>}
          contentContainerStyle={pods.length ? undefined : styles.emptyContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { color: colors.accentPrimary, fontSize: 24, fontWeight: "700" },
  sub: { color: colors.textSecondary, marginTop: 4 },
  formCard: { marginTop: 16, backgroundColor: colors.surface, padding: 16, borderRadius: 14 },
  input: {
    backgroundColor: colors.inputBg,
    padding: 12,
    borderRadius: 10,
    color: colors.textPrimary
  },
  inputGap: { marginTop: 10 },
  createBtn: {
    marginTop: 14,
    backgroundColor: colors.accentSecondary,
    padding: 12,
    alignItems: "center",
    borderRadius: 12
  },
  createText: { color: colors.textPrimary, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginTop: 12
  },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  desc: { color: colors.textSecondary, marginTop: 6 },
  meta: { color: colors.textSecondary, marginTop: 10, fontSize: 12 },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 60 },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  loader: { marginTop: 20 }
});
