import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");
const ITEM_W = Math.round(width * 0.72);
const ITEM_H = Math.round(ITEM_W * 0.62);

export default function PortfolioCarousel({
  items,
  onOpen
}: {
  items: Array<{ id: string; url: string; title?: string; description?: string }>;
  onOpen?: (item: any) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onOpen?.(item)}>
            <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
            <View style={styles.meta}>
              <Text numberOfLines={1} style={styles.title}>
                {item.title || "Untitled project"}
              </Text>
              <Text numberOfLines={2} style={styles.desc}>
                {item.description || ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 12
  },
  card: {
    width: ITEM_W,
    height: ITEM_H + 70,
    marginRight: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#241726",
    elevation: 2
  },
  image: {
    width: "100%",
    height: ITEM_H
  },
  meta: {
    padding: 10
  },
  title: { color: colors.textPrimary, fontWeight: "700" },
  desc: { color: colors.textSecondary, marginTop: 6, fontSize: 13 }
});
