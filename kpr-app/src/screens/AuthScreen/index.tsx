import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { colors } from "../../theme/colors";
import api from "../../api/client";
import { useNavigation } from "@react-navigation/native";

export default function AuthScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const nav = useNavigation<any>();

  const register = async () => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      if (res.data?.token) {
        (globalThis as any).__KPR_TOKEN = res.data.token;
        nav.navigate("TempleHall");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    }
  };

  const login = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data?.token) {
        (globalThis as any).__KPR_TOKEN = res.data.token;
        nav.navigate("TempleHall");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KPR</Text>
      <Text style={styles.subtitle}>The Creative Sanctuary</Text>

      {!isLogin && (
        <TextInput
          placeholder="Name"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      )}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#777"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#777"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={isLogin ? login : register}>
        <Text style={styles.buttonText}>{isLogin ? "Login" : "Create Account"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleLink}>
        <Text style={styles.toggleText}>
          {isLogin ? "Create an account" : "Have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center" },
  title: { color: colors.accentPrimary, fontSize: 40, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginBottom: 24 },
  input: { backgroundColor: colors.inputBg, color: colors.textPrimary, marginBottom: 12, padding: 12, borderRadius: 8 },
  button: { backgroundColor: colors.accentSecondary, padding: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  buttonText: { color: colors.textPrimary, fontWeight: "600" },
  toggleLink: { marginTop: 12 },
  toggleText: { color: colors.textSecondary }
});
