import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import { useNavigation } from "@react-navigation/native";

export default function TempleHall() {
  const nav = useNavigation<any>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KPR</Text>
      <Text style={styles.subtitle}>Your Creative Sanctuary</Text>

      <TouchableOpacity style={styles.button} onPress={() => nav.navigate("IdeaList")}>
        <Text style={styles.buttonText}>Explore Ideas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => {}}>
        <Text style={styles.secondaryButtonText}>Create New Idea (coming soon)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  title: { color: colors.accentPrimary, fontSize: 40, fontWeight: "700", marginTop: 40 },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  button: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.accentSecondary,
    alignSelf: "flex-start"
  },
  buttonText: { color: colors.textPrimary, fontWeight: "600" },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.panel,
    alignSelf: "flex-start"
  },
  secondaryButtonText: { color: colors.textSecondary }
});
