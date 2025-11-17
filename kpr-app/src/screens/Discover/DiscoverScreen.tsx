import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import ShimmerPlaceHolder from "react-native-shimmer-placeholder";
import debounce from "lodash.debounce";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import type { DiscoverUser } from "../../types/discover";

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
  "AI/ML",
  "Startups",
  "Gaming"
];

const shimmerRows = Array.from({ length: 4 }, (_, index) => index);
const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

export default function DiscoverScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const token = (globalThis as any).__KPR_TOKEN;

  const [query, setQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [results, setResults] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fade = useSharedValue(0);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(fade.value, { duration: 300 })
  }));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((chip) => chip !== skill) : [...prev, skill]
    );
  };

  const fetchResults = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      fade.value = 0;
      const res = await api.get<DiscoverUser[]>("/discover", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: query,
          skills: selectedSkills.join(",")
        }
      });
      setResults(res.data || []);
    } catch (err) {
      console.warn("discover fetch error", err);
    } finally {
      setLoading(false);
      fade.value = 1;
    }
  }, [query, selectedSkills, token, fade]);

  const debouncedFetch = useMemo(() => debounce(fetchResults, 400), [fetchResults]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const renderUser = ({ item }: { item: DiscoverUser }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate("UserProfileView", { user: item })}
    >
      <View style={styles.cardHeader}>
        <Image
          source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR}
          style={styles.avatar}
        />
        <View style={styles.cardBody}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
          {item.skills?.length ? (
            <Text style={styles.skills}>{item.skills.slice(0, 3).join(" • ")}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Discover Creators</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, bio, or skills"
        placeholderTextColor="#777"
        style={styles.input}
      />

      <View style={styles.skillWrap}>
        {SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill}
            onPress={() => toggleSkill(skill)}
            style={[styles.chip, selectedSkills.includes(skill) && styles.chipSelected]}
            activeOpacity={0.75}
          >
            <Text style={styles.chipText}>{skill}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View>
          {shimmerRows.map((row) => (
            <View style={styles.shimmerCard} key={`shimmer-${row}`}>
              <ShimmerPlaceHolder style={styles.shimmerLine} visible={false} />
              <ShimmerPlaceHolder style={[styles.shimmerLine, styles.shimmerSmall]} visible={false} />
            </View>
          ))}
        </View>
      ) : null}

      {!loading && results.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No creators found. Try different skills.</Text>
        </View>
      ) : null}

      {!loading && results.length > 0 ? (
        <Animated.View style={[styles.resultWrap, fadeStyle]}>
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 24 },
  title: { color: colors.accentPrimary, fontSize: 22, fontWeight: "800", marginBottom: 12 },
  input: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    color: colors.textPrimary,
    marginBottom: 16
  },
  skillWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#2B2233",
    marginRight: 8,
    marginBottom: 8
  },
  chipSelected: { backgroundColor: colors.accentSecondary, borderColor: colors.accentSecondary },
  chipText: { color: colors.textPrimary, fontSize: 13 },
  shimmerCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2C2237"
  },
  shimmerLine: {
    height: 14,
    borderRadius: 10,
    backgroundColor: "#1E1824"
  },
  shimmerSmall: {
    width: "60%",
    marginTop: 10
  },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  emptyText: { color: colors.textSecondary },
  resultWrap: { flex: 1 },
  listContent: { paddingBottom: 60 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2C2237",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  cardBody: { marginLeft: 14, flex: 1 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#231C2C" },
  userName: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  bio: { color: colors.textSecondary, marginTop: 4 },
  skills: { color: colors.accentPrimary, marginTop: 6, fontSize: 12, fontWeight: "600" }
});
