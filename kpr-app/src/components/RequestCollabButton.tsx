import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../api/client";
import { colors } from "../theme/colors";
import RequestMessageModal from "./RequestMessageModal";
import { UserContext } from "../context/UserContext";

type Props = {
  toUserId: string;
};

export default function RequestCollabButton({ toUserId }: Props) {
  const ctx = useContext(UserContext);
  const currentUser = ctx?.user;
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const token = (globalThis as any).__KPR_TOKEN;

  const fetchOutgoing = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await api.get("/collab/outgoing", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = (res.data || []).find(
        (item: any) => String(item.to?._id || item.to) === String(toUserId) && item.status === "pending"
      );
      setExisting(found || null);
    } catch (err) {
      console.warn("collab outgoing fetch", err);
    } finally {
      setLoading(false);
    }
  }, [token, toUserId]);

  useEffect(() => {
    fetchOutgoing();
  }, [fetchOutgoing]);

  const sendRequest = async (message: string) => {
    if (!token) return Alert.alert("Login required", "Please sign back in to send a request.");
    try {
      setLoading(true);
      const note = message?.trim?.() ? message.trim() : undefined;
      await api.post(
        "/collab/send",
        { to: toUserId, message: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Request sent", "They'll get a notification immediately.");
      setModalVisible(false);
      fetchOutgoing();
    } catch (err: any) {
      console.warn("collab send error", err);
      Alert.alert("Unable to send", err?.response?.data?.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const cancelRequest = async () => {
    if (!existing) return;
    if (!token) return;
    try {
      setLoading(true);
      await api.delete(`/collab/cancel/${existing._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Request cancelled");
      setExisting(null);
      fetchOutgoing();
    } catch (err: any) {
      Alert.alert("Unable to cancel", err?.response?.data?.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !currentUser || String(currentUser._id) === String(toUserId)) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={colors.accentSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {existing ? (
        <TouchableOpacity style={styles.cancelBtn} onPress={cancelRequest}>
          <Text style={styles.cancelText}>Cancel request</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.requestBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.requestText}>Request collaboration</Text>
        </TouchableOpacity>
      )}

      <RequestMessageModal visible={modalVisible} onClose={() => setModalVisible(false)} onSend={sendRequest} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginTop: 20 },
  loaderWrap: { marginTop: 20 },
  requestBtn: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center"
  },
  requestText: { color: colors.background, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cancelBtn: {
    backgroundColor: "#3A2A49",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center"
  },
  cancelText: { color: colors.textPrimary, fontWeight: "700" }
});
