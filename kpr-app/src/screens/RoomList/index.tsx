import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";

export type Room = {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  isDM?: boolean;
  members?: string[];
};

export default function RoomList() {
  const nav = useNavigation<any>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get("/rooms");
      setRooms(res.data || []);
    } catch (err) {
      console.warn("Fetch rooms error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Creative Rooms</Text>
      <Text style={styles.subheader}>Drop into a live chamber and start vibing.</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => nav.navigate("RoomChat", { room: item })}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description ? (
                <Text numberOfLines={1} style={styles.cardDesc}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            <View style={styles.cardArrow}>
              <Text style={{ color: colors.accentPrimary }}>→</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No rooms yet. Create one from the backend to test.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  header: { color: colors.accentPrimary, fontSize: 24, fontWeight: "700" },
  subheader: { color: colors.textSecondary, marginTop: 6, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2
  },
  cardLeft: { flexDirection: "column", flex: 1 },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "600"
  },
  cardDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4
  },
  cardArrow: {
    paddingHorizontal: 8
  },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 40 }
});
