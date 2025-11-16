import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import api from "../../api/client";

const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

type HistoryItem = {
  id: string;
  direction: "incoming" | "outgoing";
  otherUser?: any;
  status: string;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function CollabHistory() {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = (globalThis as any).__KPR_TOKEN;

  const load = useCallback(async () => {
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get("/collab/incoming", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/collab/outgoing", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const incoming: HistoryItem[] = (incomingRes.data || []).map((item: any) => ({
        id: item._id,
        direction: "incoming",
        otherUser: item.from,
        status: item.status,
        message: item.message,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      const outgoing: HistoryItem[] = (outgoingRes.data || []).map((item: any) => ({
        id: item._id,
        direction: "outgoing",
        otherUser: item.to,
        status: item.status,
        message: item.message,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      const merged = [...incoming, ...outgoing].sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setHistory(merged);
    } catch (err) {
      console.warn("collab history load", err);
      setError("Unable to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderStatus = (status: string) => {
    const colorsMap: Record<string, string> = {
      pending: "#FBBF24",
      accepted: "#34D399",
      rejected: "#F87171",
      cancelled: "#A78BFA"
    };
    return (
      <View style={[styles.statusPill, { backgroundColor: colorsMap[status] || "#6B7280" }]}>
        <Text style={styles.statusLabel}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => item.otherUser && navigation.navigate("UserProfileView", { user: item.otherUser })}>
      <Image source={item.otherUser?.avatar ? { uri: item.otherUser.avatar } : DEFAULT_AVATAR} style={styles.avatar} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.otherUser?.name || "Unknown creator"}</Text>
        <Text style={styles.cardSubtitle}>
          {item.direction === "incoming" ? "Sent you a request" : "You reached out"}
        </Text>
        {item.message ? <Text style={styles.cardMessage}>{item.message}</Text> : null}
        <Text style={styles.cardDate}>{formatDate(item.updatedAt || item.createdAt)}</Text>
      </View>
      {renderStatus(item.status)}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={colors.accentSecondary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Collaboration history</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />}
        contentContainerStyle={history.length ? undefined : styles.emptyState}
        ListEmptyComponent={<Text style={styles.emptyText}>No collaboration activity yet.</Text>}
      />
    </View>
  );
}

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "800", marginBottom: 16 },
  errorText: { color: "#fb7185", marginBottom: 8 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, marginTop: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  cardSubtitle: { color: colors.textSecondary, marginTop: 4, fontSize: 13 },
  cardMessage: { color: colors.textPrimary, marginTop: 6 },
  cardDate: { color: "#9CA3AF", marginTop: 8, fontSize: 12 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start"
  },
  statusLabel: { color: "#0F0F0F", fontWeight: "700", textTransform: "capitalize" },
  emptyState: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: colors.textSecondary }
});
