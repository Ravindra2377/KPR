import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { colors } from "../../theme/colors";
import { getCollaborators } from "../../utils/collaborators";
import { startDirectMessage } from "../../utils/startDM";

const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

type ScreenRoute = RouteProp<RootStackParamList, "CollaboratorsList">;

type Collaborator = {
  _id: string;
  name: string;
  bio?: string;
  avatar?: string;
  skills?: string[];
};

export default function CollaboratorsList() {
  const navigation = useNavigation<any>();
  const route = useRoute<ScreenRoute>();
  const { userId, userName } = route.params;
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await getCollaborators(userId);
      setCollaborators(list);
    } catch (err) {
      console.warn("collaborators list", err);
      setError("Couldn't load collaborators");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }: { item: Collaborator }) => (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardTap} onPress={() => navigation.navigate("UserProfileView", { user: item })}>
        <Image source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR} style={styles.avatar} />
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.bio ? <Text style={styles.cardBio}>{item.bio}</Text> : null}
          {item.skills?.length ? <Text style={styles.cardSkills}>{item.skills.slice(0, 3).join(" • ")}</Text> : null}
        </View>
      </TouchableOpacity>
  <TouchableOpacity style={styles.messageBtn} onPress={() => startDirectMessage(navigation, item._id, item.name, item)}>
        <Text style={styles.messageText}>Message</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collaborators with {userName}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accentSecondary} />
        </View>
      ) : (
        <FlatList
          data={collaborators}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
          contentContainerStyle={collaborators.length ? styles.listContent : styles.emptyState}
          ListEmptyComponent={<Text style={styles.emptyText}>No collaborators yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 16 },
  errorText: { color: "#ff6b6b", marginBottom: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    marginBottom: 12
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  cardBody: { flex: 1 },
  cardName: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  cardBio: { color: colors.textSecondary, marginTop: 2 },
  cardSkills: { color: colors.accentSecondary, marginTop: 4, fontSize: 12 },
  messageBtn: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12
  },
  messageText: { color: colors.textPrimary, fontWeight: "700" },
  emptyState: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textSecondary },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  cardTap: { flexDirection: "row", flex: 1 },
  listContent: { paddingVertical: 6 }
});
