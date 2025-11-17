import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { launchImageLibrary } from "react-native-image-picker";
import { UserContext } from "../../context/UserContext";
import api, { BASE_URL } from "../../api/client";
import { colors } from "../../theme/colors";
import { PortfolioItem, SocialLinks } from "../../types/profile";

const ROLE_CHOICES = ["Founder", "Designer", "Engineer", "Product", "Artist", "Investor", "Creator", "Strategist"];

export default function EditProfile() {
  const nav = useNavigation<any>();
  const { user, setUser, loadUser } = useContext(UserContext) ?? {};
  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || user?.bio || "");
  const [building, setBuilding] = useState(user?.building || "");
  const [lookingFor, setLookingFor] = useState(user?.lookingFor || "");
  const [quote, setQuote] = useState(user?.quote || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [skillDraft, setSkillDraft] = useState("");
  const [roles, setRoles] = useState<string[]>(user?.roles || []);
  const [social, setSocial] = useState<SocialLinks>(user?.social || {});
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [portfolioModal, setPortfolioModal] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDesc, setPortfolioDesc] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(user?.portfolio || []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setAbout(user.about || user.bio || "");
    setBuilding(user.building || "");
    setLookingFor(user.lookingFor || "");
    setQuote(user.quote || "");
    setBio(user.bio || "");
    setSkills(user.skills || []);
    setRoles(user.roles || []);
    setSocial(user.social || {});
    setPortfolio(user.portfolio || []);
  }, [user]);

  const authHeaders = async () => {
    const token = globalThis.__KPR_TOKEN || (await AsyncStorage.getItem("kpr_token"));
    if (!token) throw new Error("Not authenticated");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const addSkill = () => {
    const value = skillDraft.trim();
    if (!value) return;
    setSkills((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setSkillDraft("");
  };

  const removeSkill = (value: string) => {
    setSkills((prev) => prev.filter((s) => s !== value));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const headers = await authHeaders();
    const profilePayload = { name, about, building, lookingFor, quote, bio, skills, roles };
    const socialPayload = social;
    await api.patch("/users/me/profile", profilePayload, headers);
    const socialRes = await api.patch("/users/me/social", socialPayload, headers);
    setUser?.(socialRes.data);
    globalThis.__KPR_USER = socialRes.data;
    globalThis.__KPR_USER_NAME = socialRes.data?.name;
    globalThis.__KPR_USER_ID = socialRes.data?._id;
      loadUser?.();
      Alert.alert("Profile updated", "Your profile is live with the new energy.");
      nav.goBack();
    } catch (err: any) {
      console.warn("profile save", err);
      Alert.alert("Error", err?.response?.data?.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const pickBanner = async () => {
    try {
      setUploadingBanner(true);
      const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8, selectionLimit: 1 });
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const form = new FormData();
      form.append("file", {
        // @ts-ignore
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || `banner-${Date.now()}.jpg`
      });
      const headers = await authHeaders();
      await api.post("/profile/banner", form, {
        ...headers,
        headers: { ...headers.headers, "Content-Type": "multipart/form-data" }
      });
      await loadUser?.();
      Alert.alert("Banner updated");
    } catch (err) {
      console.warn("banner upload", err);
      Alert.alert("Upload failed", "We couldn't update your banner. Try again.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const submitPortfolio = async () => {
    try {
      setPortfolioUploading(true);
      const result = await launchImageLibrary({ mediaType: "photo", quality: 0.8, selectionLimit: 1 });
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const form = new FormData();
      form.append("file", {
        // @ts-ignore
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || `portfolio-${Date.now()}.jpg`
      });
      form.append("title", portfolioTitle.trim());
      form.append("description", portfolioDesc.trim());
      form.append("link", portfolioLink.trim());
      const headers = await authHeaders();
      const { data } = await api.post("/profile/portfolio", form, {
        ...headers,
        headers: { ...headers.headers, "Content-Type": "multipart/form-data" }
      });
      const newEntry: PortfolioItem = {
        _id: data.id,
        title: data.title,
        description: data.description,
        mediaUrl: data.url,
        link: data.link,
        createdAt: data.createdAt
      };
      setPortfolio((prev) => [newEntry, ...prev]);
      loadUser?.();
      setPortfolioModal(false);
      setPortfolioTitle("");
      setPortfolioDesc("");
      setPortfolioLink("");
    } catch (err) {
      console.warn("portfolio upload", err);
      Alert.alert("Upload failed", "Couldn't add portfolio item.");
    } finally {
      setPortfolioUploading(false);
    }
  };

  const removePortfolio = async (id: string) => {
    try {
      const headers = await authHeaders();
      await api.delete(`/profile/portfolio/${id}`, headers);
      setPortfolio((prev) => prev.filter((item) => item._id !== id));
      loadUser?.();
    } catch {
      Alert.alert("Unable to delete right now");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile Studio</Text>
        <Text style={styles.subtitle}>Refine your presence, drop banners, and spotlight your craft.</Text>

        <TouchableOpacity style={styles.bannerUpload} onPress={pickBanner}>
          <Text style={styles.bannerUploadText}>{uploadingBanner ? "Uploading banner..." : "Change banner"}</Text>
        </TouchableOpacity>

        <Section label="Identity">
          <Input placeholder="Display name" value={name} onChangeText={setName} />
          <Input placeholder="Bio" value={bio} onChangeText={setBio} multiline rows={5} />
        </Section>

        <Section label="Story">
          <Input placeholder="About me" value={about} onChangeText={setAbout} multiline rows={6} />
          <Input placeholder="What I'm building" value={building} onChangeText={setBuilding} multiline rows={5} />
          <Input placeholder="What I'm looking for" value={lookingFor} onChangeText={setLookingFor} multiline rows={5} />
          <Input placeholder="Quote / Manifesto" value={quote} onChangeText={setQuote} multiline rows={3} />
        </Section>

        <Section label="Roles">
          <View style={styles.rolesGrid}>
            {ROLE_CHOICES.map((role) => (
              <TouchableOpacity key={role} style={[styles.roleToggle, roles.includes(role) && styles.roleToggleActive]} onPress={() => toggleRole(role)}>
                <Text style={[styles.roleToggleText, roles.includes(role) && styles.roleToggleTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section label="Skills">
          <View style={styles.skillsRow}>
            <Input placeholder="Add a skill" value={skillDraft} onChangeText={setSkillDraft} flex />
            <TouchableOpacity style={styles.addBtn} onPress={addSkill}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillChipsWrap}>
            {skills.map((skill) => (
              <TouchableOpacity key={skill} style={styles.skillChip} onPress={() => removeSkill(skill)}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section label="Social links">
          {(Object.keys(SOCIAL_LABELS) as (keyof SocialLinks)[]).map((key) => (
            <Input
              key={key}
              placeholder={`${SOCIAL_LABELS[key]} URL`}
              value={social[key] || ""}
              onChangeText={(val) => setSocial((prev) => ({ ...prev, [key]: val }))}
            />
          ))}
        </Section>

        <Section label="Portfolio">
          <TouchableOpacity style={styles.addPortfolioBtn} onPress={() => setPortfolioModal(true)}>
            <Text style={styles.addPortfolioText}>Add featured work</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioPreviewRow}> 
            <TouchableOpacity style={styles.portfolioPreviewAdd} onPress={() => setPortfolioModal(true)}>
              <Text style={styles.portfolioPreviewAddText}>+ Add work</Text>
            </TouchableOpacity>
            {portfolio.map((item) => (
              <View key={item._id} style={styles.portfolioPreviewCard}>
                <Image source={{ uri: resolveMedia(item.mediaUrl) }} style={styles.portfolioPreviewImage} />
                <TouchableOpacity style={styles.portfolioPreviewRemove} onPress={() => removePortfolio(item._id)}>
                  <Text style={styles.portfolioPreviewRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          {!portfolio.length ? (
            <Text style={styles.emptyCopy}>No portfolio pieces yet. Spotlight your projects to earn instant trust.</Text>
          ) : null}
        </Section>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save profile"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent animationType="slide" visible={portfolioModal} onRequestClose={() => setPortfolioModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add featured work</Text>
            <Input placeholder="Project title" value={portfolioTitle} onChangeText={setPortfolioTitle} />
            <Input placeholder="Short description" value={portfolioDesc} onChangeText={setPortfolioDesc} multiline rows={4} />
            <Input placeholder="Link (Behance, Site, etc.)" value={portfolioLink} onChangeText={setPortfolioLink} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setPortfolioModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadBtn} onPress={submitPortfolio} disabled={portfolioUploading}>
                <Text style={styles.uploadBtnText}>{portfolioUploading ? "Uploading..." : "Pick media"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  github: "GitHub",
  website: "Website",
  youtube: "YouTube",
  dribbble: "Dribbble",
  behance: "Behance"
};

const resolveMedia = (value?: string) => {
  if (!value) return "";
  if (/^https?:/i.test(value)) return value;
  return `${BASE_URL}${value}`;
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

type InputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  rows?: number;
  flex?: boolean;
};

function Input({ placeholder, value, onChangeText, multiline, rows = 0, flex }: InputProps) {
  const multilineStyle = multiline ? pickMultilineStyle(rows) : null;
  return (
    <TextInput
      style={[styles.input, multilineStyle, flex && styles.flex1]}
      placeholder={placeholder}
      placeholderTextColor="#7A6A9E"
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
    />
  );
}

function pickMultilineStyle(rows: number) {
  if (rows >= 6) return styles.inputMultilineTall;
  if (rows <= 3 && rows > 0) return styles.inputMultilineShort;
  return styles.inputMultiline;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },
  title: { color: colors.accentPrimary, fontSize: 28, fontWeight: "800", paddingHorizontal: 20, marginTop: 32 },
  subtitle: { color: colors.textSecondary, paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
  bannerUpload: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 14,
    alignItems: "center"
  },
  bannerUploadText: { color: colors.textPrimary, fontWeight: "700" },
  section: {
    marginTop: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 20
  },
  sectionLabel: { color: colors.accentPrimary, fontWeight: "700", marginBottom: 12, fontSize: 16 },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    color: colors.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  rolesGrid: { flexDirection: "row", flexWrap: "wrap" },
  roleToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginRight: 8,
    marginBottom: 8
  },
  roleToggleActive: { backgroundColor: colors.accentSecondary, borderColor: colors.accentSecondary },
  roleToggleText: { color: colors.textSecondary, fontWeight: "600" },
  roleToggleTextActive: { color: colors.textPrimary },
  skillsRow: { flexDirection: "row", alignItems: "center" },
  addBtn: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginLeft: 12
  },
  addBtnText: { color: colors.textPrimary, fontWeight: "700" },
  skillChipsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    margin: 4
  },
  skillChipText: { color: colors.textPrimary },
  addPortfolioBtn: {
    borderWidth: 1,
    borderColor: colors.accentSecondary,
    borderStyle: "dashed",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16
  },
  addPortfolioText: { color: colors.accentSecondary, fontWeight: "700" },
  portfolioPreviewRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: "center"
  },
  portfolioPreviewAdd: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.accentSecondary,
    borderRadius: 16,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  portfolioPreviewAddText: { color: colors.accentSecondary, fontWeight: "700" },
  portfolioPreviewCard: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  portfolioPreviewImage: { width: "100%", height: "100%" },
  portfolioPreviewRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 4
  },
  portfolioPreviewRemoveText: { color: "#fff", fontWeight: "700" },
  deleteBtn: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,107,107,0.15)"
  },
  deleteBtnText: { color: "#ff6b6b", fontWeight: "700" },
  emptyCopy: { color: colors.textSecondary },
  saveBtn: {
    marginTop: 28,
    marginHorizontal: 20,
    backgroundColor: colors.accentSecondary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  saveBtnText: { color: colors.textPrimary, fontWeight: "800", fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18
  },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 8 },
  modalActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cancelText: { color: colors.textSecondary },
  uploadBtn: {
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14
  },
  uploadBtnText: { color: colors.textPrimary, fontWeight: "700" },
  flex1: { flex: 1 },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
  inputMultilineTall: { minHeight: 160, textAlignVertical: "top" },
  inputMultilineShort: { minHeight: 80, textAlignVertical: "top" }
});
