import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Linking,
  Animated,
  Modal,
  Pressable,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { UserContext } from "../../context/UserContext";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { getCollaborators } from "../../utils/collaborators";
import { BASE_URL } from "../../api/client";
import { PortfolioItem, ProfileUser, SocialLinks } from "../../types/profile";
import { fetchMyPods } from "../../api/pods";
import type { Pod } from "../../types/pods";
import { formatRelativeTime } from "../../utils/time";
import ProfileBannerParallax, { BANNER_HEIGHT } from "../../components/ProfileBannerParallax";
import PortfolioCarousel from "../../components/PortfolioCarousel";

const DEFAULT_AVATAR = require("../../assets/default-avatar.png");

const SOCIAL_BUTTONS = [
  { key: "instagram", label: "IG", icon: "📸", color: "#E1306C" },
  { key: "linkedin", label: "IN", icon: "💼", color: "#0A66C2" },
  { key: "twitter", label: "X", icon: "✦", color: "#000" },
  { key: "github", label: "GH", icon: "🐙", color: "#24292E" },
  { key: "website", label: "Site", icon: "🌐", color: "#7F5AF0" },
  { key: "youtube", label: "YT", icon: "▶", color: "#FF0000" },
  { key: "dribbble", label: "DB", icon: "🏀", color: "#EA4C89" },
  { key: "behance", label: "BE", icon: "🎨", color: "#0054FF" }
];

export default function Profile() {
  const nav = useNavigation<any>();
  const { user, loadUser, setUser } = useContext(UserContext) ?? {};
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collabLoading, setCollabLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [podStats, setPodStats] = useState({ memberOf: 0, ownerOf: 0 });
  const [podPreviews, setPodPreviews] = useState<Pod[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  const profile: ProfileUser | null = user;

  useFocusEffect(
    React.useCallback(() => {
      loadUser?.();
    }, [loadUser])
  );

  useEffect(() => {
    if (!profile?._id) return;
    let mounted = true;
    setCollabLoading(true);
    getCollaborators(profile._id)
      .then((list) => {
        if (mounted) setCollaborators(list);
      })
      .catch((err) => console.warn("profile collaborators", err))
      .finally(() => mounted && setCollabLoading(false));
    return () => {
      mounted = false;
    };
  }, [profile?._id]);

  useEffect(() => {
    if (!profile?._id) return;
    let mounted = true;
    fetchMyPods()
      .then((res) => {
        if (!mounted) return;
        const pods = res.data || [];
        setPodPreviews(pods.slice(0, 4));
        setPodStats({
          memberOf: pods.length,
          ownerOf: pods.filter((item) => item.owner?._id === profile._id).length
        });
      })
      .catch((err) => console.warn("profile pods", err));
    return () => {
      mounted = false;
    };
  }, [profile?._id]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["kpr_token", "kpr_user_id"]);
    globalThis.__KPR_TOKEN = undefined;
    globalThis.__KPR_USER = undefined;
    globalThis.__KPR_USER_ID = undefined;
    globalThis.__KPR_USER_NAME = undefined;
    setUser?.(null);
    nav.reset({ index: 0, routes: [{ name: "Auth" }] });
  };

  const openPortfolioItem = (id: string) => {
    const match = profile?.portfolio?.find((entry) => entry._id === id) ?? null;
    setSelectedItem(match);
  };

  const bannerUrl = profile?.banner?.url ? resolveMedia(profile.banner.url) : undefined;
  const portfolioItems = useMemo(
    () =>
      (profile?.portfolio || []).map((item) => ({
        id: item._id,
        url: resolveMedia(item.url),
        title: item.title,
        description: item.description
      })),
    [profile?.portfolio]
  );

  const sections = useMemo(
    () => [
      { title: "About me", value: profile?.about || profile?.bio },
      { title: "What I'm building", value: profile?.building },
      { title: "What I'm looking for", value: profile?.lookingFor },
      { title: "Manifesto", value: profile?.quote }
    ].filter((s) => !!s.value),
    [profile]
  );

  if (!profile) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Summoning your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <View style={styles.bannerContainer}>
          <ProfileBannerParallax bannerUrl={bannerUrl} scrollY={scrollY}>
            <View style={styles.headerRow}>
              <Image
                source={profile.avatar ? { uri: resolveMedia(profile.avatar) } : DEFAULT_AVATAR}
                style={styles.avatar}
              />
              <View style={styles.headerTextWrap}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.headline}>{profile.about || profile.bio || profile.email}</Text>
              </View>
            </View>
          </ProfileBannerParallax>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.email}>{profile.email}</Text>

          {profile.roles?.length ? (
            <View style={styles.rolesWrap}>
              {profile.roles.map((role) => (
                <LinearGradient
                  key={role}
                  colors={["#ff8df4", "#8cf6ff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.roleChip}
                >
                  <Text style={styles.roleText}>{role}</Text>
                </LinearGradient>
              ))}
            </View>
          ) : null}

          {profile.skills?.length ? (
            <View style={styles.skillsWrap}>
              {profile.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => nav.navigate("EditProfile")}> 
              <Text style={styles.primaryBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => nav.navigate("DMInbox")}> 
              <Text style={styles.secondaryBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.podsSection}>
          <View style={styles.podsHeaderRow}>
            <Text style={styles.sectionTitle}>Pods</Text>
            <TouchableOpacity onPress={() => nav.navigate("PodsDiscover")}> 
              <Text style={styles.sectionAction}>Explore</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.podStatsRow}>
            <View>
              <Text style={styles.podStatLabel}>Member of</Text>
              <Text style={styles.podStatValue}>{podStats.memberOf}</Text>
            </View>
            <View>
              <Text style={styles.podStatLabel}>Owner of</Text>
              <Text style={styles.podStatValue}>{podStats.ownerOf}</Text>
            </View>
          </View>
          {podPreviews.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.podScroll}>
              {podPreviews.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.podCard}
                  onPress={() => nav.navigate("PodDetail", { id: item._id, name: item.name })}
                >
                  {item.coverImage ? (
                    <Image source={{ uri: resolveMedia(item.coverImage) }} style={styles.podCardImage} />
                  ) : (
                    <View style={[styles.podCardImage, styles.podCardPlaceholder]}>
                      <Text style={styles.podCardTitle}>{item.name?.charAt(0) ?? "P"}</Text>
                    </View>
                  )}
                  <Text style={styles.podCardName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>You haven’t joined any pods yet.</Text>
          )}
        </View>

        {sections.map((section) => (
          <SectionCard key={section.title} title={section.title} value={section.value ?? ""} />
        ))}

        {portfolioItems.length ? (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Featured works</Text>
              <TouchableOpacity onPress={() => nav.navigate("EditProfile")}> 
                <Text style={styles.sectionAction}>Manage</Text>
              </TouchableOpacity>
            </View>
            <PortfolioCarousel items={portfolioItems} onOpen={(item) => openPortfolioItem(item.id)} />
          </View>
        ) : (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Featured works</Text>
              <TouchableOpacity onPress={() => nav.navigate("EditProfile")}>
                <Text style={styles.sectionAction}>Add</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.emptyText}>Showcase your best drops. Add a project, reel, or article.</Text>
          </View>
        )}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Social links</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.socialRow}>
            {SOCIAL_BUTTONS.map((social) => {
              const socialLinks: SocialLinks | undefined = profile.social;
              const url = socialLinks?.[social.key as keyof SocialLinks];
              if (!url) return null;
              return (
                <TouchableOpacity key={social.key} style={[styles.socialBtn, { backgroundColor: social.color }]} onPress={() => openLink(url)}>
                  <Text style={styles.socialIcon}>{social.icon}</Text>
                  <Text style={styles.socialText}>{social.label}</Text>
                </TouchableOpacity>
              );
            })}
            {!profile.social || Object.values(profile.social).every((val) => !val) ? (
              <Text style={styles.emptyText}>Link your ecosystem so people can study your work.</Text>
            ) : null}
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Collaborators</Text>
            <TouchableOpacity onPress={() => nav.navigate("CollaboratorsList", { userId: profile._id, userName: profile.name })}>
              <Text style={styles.sectionAction}>View all</Text>
            </TouchableOpacity>
          </View>
          {collabLoading ? (
            <Text style={styles.emptyText}>Loading collaborators...</Text>
          ) : collaborators.length ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={collaborators.slice(0, 12)}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.collabListContent}
              ItemSeparatorComponent={CollaboratorSeparator}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.collabCard} onPress={() => nav.navigate("UserProfileView", { user: item })}>
                  <Image source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR} style={styles.collabAvatar} />
                  <Text style={styles.collabName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>No collaborators yet. Accept a request or send your first collab.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </Animated.ScrollView>

      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </View>
  );
}

function resolveMedia(value?: string) {
  if (!value) return "";
  if (/^https?:/i.test(value)) return value;
  return `${BASE_URL}${value}`;
}

function openLink(url: string) {
  const normalized = url.startsWith("http") ? url : `https://${url}`;
  Linking.openURL(normalized).catch(() => {});
}

function SectionCard({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionCardTitle}>{title}</Text>
      <Text style={styles.sectionCardBody}>{value}</Text>
    </View>
  );
}

function CollaboratorSeparator() {
  return <View style={styles.collabSeparator} />;
}

function PortfolioModal({ item, onClose }: { item: PortfolioItem | null; onClose: () => void }) {
  if (!item) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Image source={{ uri: resolveMedia(item.url) }} style={styles.modalImage} />
          <View style={styles.modalBodyWrap}>
            <Text style={styles.modalTitle}>{item.title || "Untitled"}</Text>
            {item.createdAt ? (
              <Text style={styles.modalMeta}>{formatRelativeTime(item.createdAt)}</Text>
            ) : null}
            {item.description ? <Text style={styles.modalBody}>{item.description}</Text> : null}
            {item.link ? (
              <TouchableOpacity style={styles.visitBtn} onPress={() => openLink(item.link!)}>
                <Text style={styles.visitText}>Visit link</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary },
  bannerContainer: { height: BANNER_HEIGHT },
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 24 },
  headerTextWrap: { marginLeft: 12 },
  headline: { color: colors.textSecondary, ...typography.body },
  profileCard: {
    marginTop: -60,
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: colors.background,
    marginTop: -110
  },
  name: { color: colors.textPrimary, fontSize: 26, marginTop: 16, ...typography.heading },
  email: { color: colors.textSecondary, marginTop: 4, ...typography.body },
  rolesWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8
  },
  roleText: { color: "#1a0235", fontWeight: "800", fontSize: 12 },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  skillChip: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  skillText: { color: colors.textSecondary, fontSize: 12, ...typography.body },
  actionRow: { flexDirection: "row", marginTop: 20 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.accentSecondary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginRight: 12
  },
  primaryBtnText: { color: colors.textPrimary, ...typography.heading },
  secondaryBtn: {
    width: 70,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center"
  },
  secondaryBtnText: { color: colors.textPrimary, ...typography.heading },
  sectionCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionCardTitle: { color: colors.accentPrimary, fontSize: 16, marginBottom: 8, ...typography.heading },
  sectionCardBody: { color: colors.textSecondary, lineHeight: 20, ...typography.body },
  sectionBlock: { marginTop: 24 },
  podsSection: {
    marginTop: 24,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  podsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  podStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  podStatLabel: { color: colors.textSecondary, fontSize: 12 },
  podStatValue: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  podScroll: { paddingBottom: 4 },
  podCard: { width: 140, marginRight: 12 },
  podCardImage: { width: 140, height: 100, borderRadius: 14, marginBottom: 6 },
  podCardPlaceholder: { justifyContent: "center", backgroundColor: colors.border },
  podCardTitle: { color: colors.textSecondary, fontSize: 32, fontWeight: "700", textAlign: "center" },
  podCardName: { color: colors.textPrimary, fontWeight: "600" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12
  },
  sectionTitle: { color: colors.accentPrimary, fontSize: 18, ...typography.heading },
  sectionAction: { color: colors.accentSecondary, ...typography.accent },
  emptyText: { color: colors.textSecondary, paddingHorizontal: 20, ...typography.body },
  socialRow: { paddingHorizontal: 20, paddingBottom: 6 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 12
  },
  socialIcon: { color: "#fff", marginRight: 8 },
  socialText: { color: "#fff", ...typography.heading },
  collabCard: {
    width: 90,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border
  },
  collabAvatar: { width: 56, height: 56, borderRadius: 28 },
  collabName: {
    color: colors.textPrimary,
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
    ...typography.body
  },
  collabListContent: { paddingHorizontal: 20 },
  collabSeparator: { width: 12 },
  logoutBtn: {
    marginTop: 40,
    alignSelf: "center",
    marginBottom: 60
  },
  logoutText: { color: "#ff6b6b", fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalImage: { width: "100%", height: 260 },
  modalTitle: { color: colors.textPrimary, fontSize: 20, ...typography.heading },
  modalMeta: { color: colors.textSecondary, marginTop: 4, ...typography.body },
  modalBody: { color: colors.textSecondary, marginTop: 12, ...typography.body },
  modalBodyWrap: { padding: 18 },
  visitBtn: {
    marginTop: 16,
    backgroundColor: colors.accentSecondary,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center"
  },
  visitText: { color: colors.textPrimary, ...typography.heading }
});
