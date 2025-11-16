import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { colors } from "../../theme/colors";
import api from "../../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileSetup({ navigation, route }: any) {
  const { skills = [] } = route.params || {};
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const finish = async () => {
    try {
      const token = await AsyncStorage.getItem("kpr_token");
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      await api.patch(
        "/users/me",
        { name, bio, skills },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await AsyncStorage.setItem("kpr_onboard_done", "1");

      navigation.reset({
        index: 0,
        routes: [{ name: "TempleHall" }]
      });
    } catch (err) {
      console.warn("Profile setup error", err);
      Alert.alert("Error", "Unable to update profile");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Your Profile</Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#777"
        style={styles.input}
      />

      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Bio"
        placeholderTextColor="#777"
        multiline
        style={[styles.input, styles.bioInput]}
      />

      <TouchableOpacity style={styles.btn} onPress={finish}>
        <Text style={styles.btnText}>Enter Sanctuary</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  title: { color: colors.accentPrimary, fontSize: 28, fontWeight: "800", marginBottom: 20 },
  input: {
    backgroundColor: colors.inputBg,
    color: colors.textPrimary,
    padding: 14,
    borderRadius: 14,
    marginBottom: 14
  },
  bioInput: { height: 120, textAlignVertical: "top" },
  btn: {
    backgroundColor: colors.accentSecondary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20
  },
  btnText: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" }
});
