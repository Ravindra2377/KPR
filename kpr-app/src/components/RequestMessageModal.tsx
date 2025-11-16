import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
};

export default function RequestMessageModal({ visible, onClose, onSend }: Props) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    onSend(message.trim());
    setMessage("");
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Send a note</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            placeholder="Let them know what you want to build together"
            placeholderTextColor="#7f7f7f"
          />

          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendText}>Send request</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    width: "88%",
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 18
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  input: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2B2233",
    minHeight: 90,
    padding: 12,
    color: colors.textPrimary,
    backgroundColor: "#161219",
    textAlignVertical: "top"
  },
  sendBtn: {
    backgroundColor: colors.accentSecondary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 18,
    alignItems: "center"
  },
  sendText: { color: colors.textPrimary, fontWeight: "700" },
  cancelBtn: { alignItems: "center", marginTop: 12 },
  cancelText: { color: colors.textSecondary }
});
