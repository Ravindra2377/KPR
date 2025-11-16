import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";

const SKILLS = [
  "Tech",
  "Business",
  "Design",
  "Art",
  "Music",
  "Film",
  "Writing",
  "Finance",
  "Marketing",
  "Product",
  "Gaming",
  "AI/ML",
  "Startups"
];

export default function SkillSelect({ navigation }: any) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (skill: string) => {
    setSelected((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What’s your world?</Text>
      <Text style={styles.subtitle}>Choose your creative or professional domains.</Text>

      <ScrollView style={styles.scroll}>
        <View style={styles.skillGrid}>
          {SKILLS.map((skill) => (
            <TouchableOpacity
              key={skill}
              style={[styles.chip, selected.includes(skill) && styles.chipSelected]}
              onPress={() => toggle(skill)}
            >
              <Text style={styles.chipText}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => navigation.navigate("ProfileSetup", { skills: selected })}
        >
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { color: colors.accentPrimary, fontSize: 26, fontWeight: "800" },
  subtitle: { color: colors.textSecondary, marginTop: 6 },
  scroll: { marginTop: 20 },
  skillGrid: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    margin: 6,
    borderRadius: 16
  },
  chipSelected: {
    backgroundColor: colors.accentSecondary
  },
  chipText: { color: colors.textPrimary },
  nextBtn: {
    backgroundColor: colors.accentSecondary,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20
  },
  nextText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  }
});
