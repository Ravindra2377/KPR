import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import api from "../api/client";

interface Props {
  visible: boolean;
  onClose: () => void;
  pod: { _id: string; name?: string };
}

export default function PodBoostModal({ visible, onClose, pod }: Props) {
  const [amount, setAmount] = useState("999");
  const [loading, setLoading] = useState(false);

  const submitBoost = async () => {
    try {
      setLoading(true);
      const token = (globalThis as any).__KPR_TOKEN;
      await api.post(`/pods/${pod._id}/boost`, { amount: Number(amount) }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Boost scheduled", "Your pod has been boosted.");
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Boost Pod</Text>
          <Text style={styles.subtitle}>Promote this pod to more creators for faster applicants.</Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity onPress={submitBoost} style={styles.submitBtn}>
            <Text style={styles.submitText}>{loading ? "Processing..." : `Pay ₹${amount}`}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  content: { width: "86%", backgroundColor: colors.surface, borderRadius: 12, padding: 18 },
  title: { color: colors.textPrimary, fontWeight: "800", fontSize: 18 },
  subtitle: { color: colors.textSecondary, marginTop: 8 },
  input: { marginTop: 12, backgroundColor: "#050507", color: "#fff", padding: 12, borderRadius: 10 },
  submitBtn: { marginTop: 12, backgroundColor: colors.accentSecondary, padding: 12, borderRadius: 10, alignItems: "center" },
  submitText: { color: colors.textPrimary, fontWeight: "800" },
  cancelBtn: { marginTop: 10, alignItems: "center" },
  cancelText: { color: colors.textSecondary }
});
