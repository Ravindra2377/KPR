import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../../context/UserContext";
import Avatar from "../../components/Avatar";
import { colors } from "../../theme/colors";

export default function Profile() {
  const nav = useNavigation<any>();
  const ctx = useContext(UserContext);
  const user = ctx?.user;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading profile...</Text>
      </View>
    );
  }

  const logout = async () => {
    await AsyncStorage.removeItem("kpr_token");
    await AsyncStorage.removeItem("kpr_user_id");
    globalThis.__KPR_TOKEN = undefined;
  globalThis.__KPR_USER = undefined;
    globalThis.__KPR_USER_ID = undefined;
    globalThis.__KPR_USER_NAME = undefined;
    ctx?.setUser(null);
    nav.reset({ index: 0, routes: [{ name: "Auth" }] });
  };

  return (
    <View style={styles.container}>
      <Avatar name={user.name} size={100} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      {user.skills?.length ? (
        <View style={styles.skillsWrap}>
          {user.skills.map((skill: string) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={() => nav.navigate("EditProfile")}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  loading: { color: colors.textPrimary },
  name: { color: colors.textPrimary, fontSize: 24, marginTop: 12, fontWeight: "600" },
  email: { color: colors.textSecondary, marginTop: 6 },
  bio: { color: colors.textSecondary, marginTop: 20, textAlign: "center", fontSize: 14, paddingHorizontal: 30 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 16, justifyContent: "center" },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.surface,
    margin: 4
  },
  skillText: { color: colors.textSecondary, fontSize: 12 },
  button: {
    marginTop: 30,
    backgroundColor: colors.accentSecondary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14
  },
  buttonText: { color: colors.textPrimary, fontWeight: "600" },
  logoutBtn: { marginTop: 20 },
  logoutText: { color: "#ff6b6b" }
});
