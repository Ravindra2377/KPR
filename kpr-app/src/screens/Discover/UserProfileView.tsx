import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from "react-native";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { colors } from "../../theme/colors";
import RequestCollabButton from "../../components/RequestCollabButton";
import { startDirectMessage } from "../../utils/startDM";
import { getCollaborators } from "../../utils/collaborators";
const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

type ScreenRoute = RouteProp<RootStackParamList, "UserProfileView">;

type Props = {
  route: ScreenRoute;
};

export default function UserProfileView({ route }: Props) {
  const { user } = route.params;
  const navigation = useNavigation<any>();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collabLoading, setCollabLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getCollaborators(user._id);
        if (mounted) setCollaborators(list);
      } catch (err) {
        console.warn("collaborators fetch", err);
      } finally {
        if (mounted) setCollabLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user._id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.heroAvatar} />
        ) : (
          <Image source={DEFAULT_AVATAR} style={styles.heroAvatar} />
        )}
        <Text style={styles.name}>{user.name}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <Text style={styles.sectionHeading}>Skills</Text>
      <View style={styles.skillsWrap}>
        {user.skills?.length ? (
          user.skills.map((skill: string) => (
            <View style={styles.skillChip} key={skill}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No skills shared yet.</Text>
        )}
      </View>

      <Text style={styles.sectionHeading}>Collaborators</Text>
      {collabLoading ? (
        <Text style={styles.empty}>Loading collaborators...</Text>
      ) : collaborators.length ? (
        <FlatList
          horizontal
          data={collaborators.slice(0, 10)}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collabList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.collabAvatarWrap}
              onPress={() => navigation.navigate("UserProfileView", { user: item })}
            >
              <Image
                source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR}
                style={styles.collabAvatar}
              />
              <Text style={styles.collabName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.empty}>No collaborators yet.</Text>
      )}

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.navigate("CollaboratorsList", { userId: user._id, userName: user.name })}
      >
        <Text style={styles.linkText}>See all collaborators</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
  <TouchableOpacity style={styles.messageBtn} onPress={() => startDirectMessage(navigation, user._id, user.name, user)}>
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
      </View>

      <RequestCollabButton toUserId={user._id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  header: { alignItems: "center", marginBottom: 26 },
  heroAvatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 14, alignSelf: "center" },
  name: { color: colors.textPrimary, fontSize: 24, fontWeight: "800", marginTop: 12 },
  bio: { color: colors.textSecondary, textAlign: "center", marginTop: 8 },
  sectionHeading: { color: colors.accentPrimary, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap" },
  skillChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    marginRight: 8,
    marginBottom: 8
  },
  skillText: { color: colors.textPrimary, fontWeight: "600" },
  empty: { color: colors.textSecondary },
  actions: { marginTop: 24 },
  messageBtn: {
    backgroundColor: "#2E2038",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  messageText: { color: colors.accentPrimary, fontWeight: "700" },
  collabList: { paddingVertical: 6 },
  collabAvatarWrap: { alignItems: "center", marginRight: 12 },
  collabAvatar: { width: 64, height: 64, borderRadius: 32 },
  collabName: { color: colors.textPrimary, marginTop: 4, fontSize: 12 },
  linkBtn: { marginTop: 8 },
  linkText: { color: colors.accentSecondary, fontWeight: "600" }
});
