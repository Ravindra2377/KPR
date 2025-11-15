import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { colors } from "../../theme/colors";
import api from "../../api/client";
import { useNavigation } from "@react-navigation/native";

/**
 * Simple composer:
 * - title (required)
 * - description (optional)
 * - tags (comma separated)
 *
 * On success: navigate to IdeaDetail with the returned id
 */

export default function IdeaComposer() {
  const nav = useNavigation<any>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title || title.trim().length < 3) {
      Alert.alert("Title required", "Give your idea a short, meaningful title (min 3 chars).");
      return;
    }

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    const token = (globalThis as any).__KPR_TOKEN;
    if (!token) {
      Alert.alert("Login required", "Please login before creating an idea.");
      return;
    }

    try {
      setSaving(true);
      const res = await api.post(
        "/ideas",
        { title: title.trim(), description: description.trim(), tags },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 201 || res.status === 200) {
        const idea = res.data;
        // Navigate to IdeaDetail screen with new id
        nav.navigate("IdeaDetail", { id: idea._id ?? idea.id });
      } else {
        Alert.alert("Unable to create", "Server returned an unexpected response.");
      }
    } catch (err: any) {
      console.warn("Create idea error:", err);
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Seed a new idea</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Tiny title that explains the idea"
          placeholderTextColor="#777"
          style={styles.input}
          maxLength={120}
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Short description, the problem you're solving, or a mood"
          placeholderTextColor="#777"
          style={[styles.input, styles.textArea]}
          multiline
        />

        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          value={tagsText}
          onChangeText={setTagsText}
          placeholder="design, ai, music"
          placeholderTextColor="#777"
          style={styles.input}
        />

        <Text style={styles.hint}>Tip: Use tags to help collaborators find your idea.</Text>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={submit}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? "Creating..." : "Create Idea"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} onPress={() => nav.goBack()}>
          <Text style={{ color: colors.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  scrollContent: { paddingBottom: 40 },
  header: { color: colors.accentPrimary, fontSize: 22, fontWeight: "700", marginBottom: 18 },
  label: { color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    padding: 12,
    borderRadius: 10,
    fontSize: 16
  },
  textArea: { minHeight: 120, textAlignVertical: "top" },
  hint: { color: colors.textSecondary, marginTop: 8, fontSize: 13 },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accentSecondary,
    alignItems: "center"
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.textPrimary, fontWeight: "700" },
  cancel: { marginTop: 14, alignItems: "center" }
});
