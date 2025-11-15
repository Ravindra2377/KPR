import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useRoute, RouteProp } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import api from "../../api/client";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type OracleRoute = RouteProp<RootStackParamList, "Oracle">;

export default function Oracle() {
  const route = useRoute<OracleRoute>();
  const [text, setText] = useState(route.params?.ideaText || "");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  useEffect(() => {
    if (route.params?.ideaText) {
      setText(route.params.ideaText);
    }
  }, [route.params?.ideaText]);

  const askOracle = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      setResponse("");

      const token = (globalThis as any).__KPR_TOKEN;
      if (!token) {
        setResponse("The Oracle whispers: Please sign in first.");
        return;
      }

      const res = await api.post(
        "/oracle/refine",
        { idea: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResponse(res.data.oracle);
    } catch {
      setResponse("The Oracle whispers: Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#5B1A7A", "#1A1027"]} style={styles.glowCircle} />

      <Text style={styles.title}>Oracle</Text>
      <Text style={styles.subtitle}>Ask for creative clarity, refinement, or inspiration.</Text>

      <TextInput
        style={styles.input}
        placeholder="Describe your idea..."
        placeholderTextColor="#777"
        multiline
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity style={styles.button} onPress={askOracle}>
        <Text style={styles.btnText}>Ask Oracle</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={colors.accentPrimary} style={styles.loader} />}

      <ScrollView style={styles.output} contentContainerStyle={styles.outputContent}>
        <Text style={styles.outputText}>{response}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  glowCircle: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.25
  },
  title: {
    color: colors.accentPrimary,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 40
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 20
  },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    padding: 14,
    borderRadius: 14,
    minHeight: 120,
    fontSize: 15,
    marginTop: 20
  },
  button: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 14,
    marginTop: 16
  },
  btnText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 16
  },
  loader: { marginTop: 16 },
  output: { marginTop: 20 },
  outputContent: { paddingBottom: 32 },
  outputText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22
  }
});
