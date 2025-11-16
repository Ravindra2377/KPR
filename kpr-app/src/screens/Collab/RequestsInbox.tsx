import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import api from "../../api/client";
import { colors } from "../../theme/colors";
import { startDirectMessage } from "../../utils/startDM";

export default function RequestsInbox() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptingData, setAcceptingData] = useState<{ id: string; requester: any } | null>(null);
  const [podName, setPodName] = useState("");

  const navigation = useNavigation<any>();
  const token = (globalThis as any).__KPR_TOKEN;

  const loadRequests = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get("/collab/incoming", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/collab/outgoing", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setIncoming(incomingRes.data || []);
      setOutgoing(outgoingRes.data || []);
    } catch (err) {
      console.warn("collab inbox load", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const openAcceptModal = (request: any) => {
    setAcceptingData({ id: request._id, requester: request.from });
  };

  const submitAccept = async (withPod: boolean) => {
    if (!token || !acceptingData) return;
    try {
      setAccepting(true);
      await api.post(
        `/collab/${acceptingData.id}/accept`,
        { createPod: withPod, podName: withPod ? podName.trim() || undefined : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAcceptingData(null);
      setPodName("");
      Alert.alert("Accepted", withPod ? "Collaborators + new pod ready." : "You're now collaborators." );
      if (acceptingData.requester?._id) {
        startDirectMessage(navigation, acceptingData.requester._id, acceptingData.requester.name, acceptingData.requester);
      }
      loadRequests();
    } catch (err: any) {
      Alert.alert("Unable to accept", err?.response?.data?.message || "Please try later.");
    } finally {
      setAccepting(false);
    }
  };

  const submitReject = async () => {
    if (!token || !rejectingId) return;
    try {
      await api.post(
        `/collab/${rejectingId}/reject`,
        { reason: reason.trim() ? reason.trim() : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Request declined");
      setReason("");
      setRejectingId(null);
      loadRequests();
    } catch (err: any) {
      Alert.alert("Unable to reject", err?.response?.data?.message || "Please try later.");
    }
  };

  const handleRejectPress = (id: string) => {
    setRejectingId(id);
    setReason("");
  };

  const renderIncomingCard = (item: any) => (
    <View key={item._id} style={styles.card}>
      <Text style={styles.cardTitle}>{item.from?.name || "Unknown"}</Text>
      <Text style={styles.cardMessage}>{item.message || "wants to collaborate with you"}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => openAcceptModal(item)}>
          <Text style={styles.actionText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRejectPress(item._id)}>
          <Text style={styles.actionText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutgoingCard = (item: any) => (
    <View key={item._id} style={styles.card}>
      <Text style={styles.cardTitle}>To {item.to?.name || "creator"}</Text>
      <Text style={styles.cardMessage}>{item.message || "Awaiting reply"}</Text>
      <Text style={styles.meta}>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Collaboration requests</Text>
      <Text style={styles.pageSubtitle}>Track every invitation and response.</Text>

      {loading ? (
        <View style={styles.loaderBlock}>
          <ActivityIndicator color={colors.accentSecondary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Incoming</Text>
          {incoming.length === 0 ? <Text style={styles.emptyText}>No incoming requests yet.</Text> : incoming.map(renderIncomingCard)}

          <Text style={styles.sectionTitle}>Outgoing</Text>
          {outgoing.length === 0 ? <Text style={styles.emptyText}>No outgoing requests yet.</Text> : outgoing.map(renderOutgoingCard)}
        </ScrollView>
      )}

  <Modal visible={Boolean(rejectingId)} transparent animationType="fade" onRequestClose={() => setRejectingId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Decline request</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Optional reason"
              placeholderTextColor="#777"
              value={reason}
              onChangeText={setReason}
              multiline
            />
            <TouchableOpacity style={styles.modalPrimary} onPress={submitReject}>
              <Text style={styles.modalPrimaryText}>Send response</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectingId(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(acceptingData)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!accepting) {
            setAcceptingData(null);
            setPodName("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Accept request</Text>
            <Text style={styles.modalBody}>
              How do you want to kick things off with {acceptingData?.requester?.name || "this creator"}?
            </Text>
            <TouchableOpacity style={styles.modalPrimary} disabled={accepting} onPress={() => submitAccept(false)}>
              <Text style={styles.modalPrimaryText}>{accepting ? "Working..." : "Accept & Start DM"}</Text>
            </TouchableOpacity>
            <View style={styles.podBlock}>
              <Text style={styles.podLabel}>Or spin up a pod</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Pod name (optional)"
                placeholderTextColor="#777"
                value={podName}
                onChangeText={setPodName}
                editable={!accepting}
              />
              <TouchableOpacity style={[styles.modalPrimary, styles.podButton]} disabled={accepting} onPress={() => submitAccept(true)}>
                <Text style={styles.modalPrimaryText}>{accepting ? "Creating..." : "Accept + Create Pod"}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.modalCancel} onPress={() => (!accepting ? setAcceptingData(null) : null)}>
              <Text style={styles.cancelText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  pageTitle: { color: colors.accentPrimary, fontSize: 24, fontWeight: "800" },
  pageSubtitle: { color: colors.textSecondary, marginTop: 6, marginBottom: 18 },
  loaderBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginTop: 18, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2C2237"
  },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  cardMessage: { color: colors.textSecondary, marginTop: 6 },
  cardActions: { flexDirection: "row", marginTop: 14 },
  acceptBtn: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12
  },
  rejectBtn: {
    backgroundColor: "#352437",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginLeft: 12
  },
  actionText: { color: colors.textPrimary, fontWeight: "700" },
  meta: { color: colors.textSecondary, marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalCard: {
    width: "85%",
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 18
  },
  modalTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: 18 },
  modalInput: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2B2233",
    padding: 12,
    minHeight: 80,
    color: colors.textPrimary,
    backgroundColor: "#161219",
    textAlignVertical: "top"
  },
  modalPrimary: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16
  },
  modalPrimaryText: { color: colors.textPrimary, fontWeight: "700" },
  modalCancel: { alignItems: "center", marginTop: 12 },
  cancelText: { color: colors.textSecondary },
  modalBody: { color: colors.textSecondary, marginTop: 6 },
  podBlock: { marginTop: 16 },
  podLabel: { color: colors.textSecondary, marginBottom: 8 },
  podButton: { backgroundColor: "#433152", marginTop: 8 }
});
