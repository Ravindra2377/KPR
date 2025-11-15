import React, { useContext, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../../context/UserContext";
import api from "../../api/client";
import { colors } from "../../theme/colors";

export default function EditProfile() {
  const nav = useNavigation<any>();
  const ctx = useContext(UserContext);
  const user = ctx?.user;
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skillsText, setSkillsText] = useState(user?.skills?.join(", ") || "");

  const save = async () => {
    try {
      const token = await AsyncStorage.getItem("kpr_token");
      if (!token) throw new Error("No token");

      const res = await api.patch(
        "/users/me",
        {
          name,
          bio,
          skills: skillsText
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      ctx?.setUser(res.data);
      nav.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#777"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Bio"
        placeholderTextColor="#777"
        multiline
        value={bio}
        onChangeText={setBio}
      />

      <TextInput
        style={styles.input}
        placeholder="Skills (comma separated)"
        placeholderTextColor="#777"
        value={skillsText}
        onChangeText={setSkillsText}
      />

      <TouchableOpacity style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { color: colors.accentPrimary, fontSize: 22, marginBottom: 20, fontWeight: "600" },
  input: {
    backgroundColor: colors.inputBg,
    padding: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    borderRadius: 12
  },
  bioInput: { height: 100, textAlignVertical: "top" },
  button: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10
  },
  buttonText: { color: colors.textPrimary, fontWeight: "700" }
});
