import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface AvatarProps {
  name?: string;
  size?: number;
}

export default function Avatar({ name, size = 70 }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}> 
      <Text style={{ color: colors.textPrimary, fontSize: size * 0.35 }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.accentSecondary,
    justifyContent: "center",
    alignItems: "center"
  }
});
