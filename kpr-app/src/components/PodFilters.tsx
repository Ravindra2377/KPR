import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function PodFilters({ onChange }: any) {
  const [q, setQ] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private" | "all">("all");
  const tRef = useRef<any>(null);

  useEffect(() => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      onChange({ q, tags, roles, visibility: visibility === "all" ? undefined : visibility });
    }, 350);
    return () => clearTimeout(tRef.current);
  }, [q, tags, roles, visibility, onChange]);

  const toggle = (arr: string[], set: any, v: string) => {
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    set(next);
  };

  return (
    <View style={s.container}>
      <TextInput placeholder="Search pods, topics, people" placeholderTextColor="#777" value={q} onChangeText={setQ} style={s.input} />
      <View style={s.tagRow}>
        {["Design", "Film", "AI", "Product", "Music", "Brand"].map((t) => (
          <TouchableOpacity key={t} onPress={() => toggle(tags, setTags, t)} style={[s.tag, tags.includes(t) && s.tagSel]}>
            <Text style={s.tagText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.roleRow}>
        {['Designer', 'Developer', 'PM', 'Creator'].map((r) => (
          <TouchableOpacity key={r} onPress={() => toggle(roles, setRoles, r)} style={[s.role, roles.includes(r) && s.roleSel]}>
            <Text style={s.roleText}>{r}</Text>
          </TouchableOpacity>
        ))}
        <View style={s.spacer} />
        <TouchableOpacity
          onPress={() => setVisibility((v) => (v === "all" ? "public" : v === "public" ? "private" : "all"))}
          style={s.visibility}
        >
          <Text style={s.roleText}>{visibility === "all" ? "All" : visibility}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 12 },
  input: { backgroundColor: colors.surface, padding: 12, borderRadius: 12, color: colors.textPrimary },
  tagRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  tag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.background, marginRight: 8, marginTop: 8 },
  tagSel: { borderColor: colors.accentSecondary, borderWidth: 1 },
  tagText: { color: colors.textPrimary },
  roleRow: { flexDirection: "row", marginTop: 10, alignItems: "center" },
  role: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.background, marginRight: 8 },
  roleSel: { borderColor: colors.accentSecondary, borderWidth: 1 },
  roleText: { color: colors.textPrimary },
  spacer: { flex: 1 },
  visibility: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }
});
