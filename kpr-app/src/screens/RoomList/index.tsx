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
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("RoomChat", { room: item })}
          >
            <View style={styles.cardRow}>
              <Text style={styles.title}>{item.name}</Text>
              {item.type && <Text style={styles.type}>{item.type}</Text>}
            </View>
            {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
            <Text style={styles.enter}>Enter room →</Text>
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
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "600" },
  type: { color: colors.textSecondary, textTransform: "uppercase", fontSize: 12 },
  description: { color: colors.textSecondary, marginTop: 8 },
  enter: { color: colors.accentSecondary, marginTop: 10, fontWeight: "600" },
  empty: { color: colors.textSecondary, textAlign: "center", marginTop: 40 }
});
