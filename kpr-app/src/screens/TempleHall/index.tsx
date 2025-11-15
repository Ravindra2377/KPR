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

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => nav.navigate("IdeaList")}>
          <Text style={styles.buttonText}>Explore Ideas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("IdeaComposer")}
        >
          <Text style={styles.buttonSecondary}>Create Idea</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("RoomList")}
        >
          <Text style={styles.buttonSecondary}>Creative Rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.panelButton, styles.buttonGap]}
          onPress={() => nav.navigate("Profile")}
        >
          <Text style={styles.buttonSecondary}>Profile & Avatar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  title: { color: colors.accentPrimary, fontSize: 40, fontWeight: "700", marginTop: 40 },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  buttonGroup: { marginTop: 40 },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center"
  },
  buttonGap: { marginTop: 16 },
  primaryButton: { backgroundColor: colors.accentSecondary },
  panelButton: { backgroundColor: colors.panel },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  buttonSecondary: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500"
  }
});
