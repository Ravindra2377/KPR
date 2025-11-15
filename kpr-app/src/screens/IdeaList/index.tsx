import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";

type Idea = {
  _id: string;
  title: string;
  description?: string;
  appreciationCount?: number;
  author?: { name: string };
};

export default function IdeaList() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigation<any>();

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ideas");
      setIdeas(res.data);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ideas</Text>
      <FlatList<Idea>
        data={ideas}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => nav.navigate("IdeaDetail", { id: item._id })}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.author?.name || "Unknown"}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No ideas yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { color: colors.accentPrimary, fontSize: 24, fontWeight: "700", marginBottom: 12 },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 10, marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  meta: { color: colors.textSecondary, marginTop: 6 },
  emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: 24 }
});
