import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import io from "socket.io-client";
import api, { BASE_URL } from "../../api/client";
import { colors } from "../../theme/colors";
import { v4 as uuidv4 } from "uuid";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type RouteProps = RouteProp<RootStackParamList, "PodDetail">;

type Task = {
  _id: string;
  title: string;
  status: "todo" | "inprogress" | "done";
  assignee?: { name: string } | null;
};

type ColumnKey = "todo" | "inprogress" | "done";

export default function PodDetail() {
  const route = useRoute<RouteProps>();
  const { id: podId } = route.params;
  const [pod, setPod] = useState<any>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const socketRef = useRef<any>(null);

  const tokenHeaders = () => {
    const token = (globalThis as any).__KPR_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const fetchPod = useCallback(async () => {
    try {
      const res = await api.get(`/pods/${podId}`, { headers: tokenHeaders() });
      setPod(res.data);
    } catch (err) {
      console.warn("fetch pod err", err);
    }
  }, [podId]);

  useEffect(() => {
    fetchPod();

    const socket = io(BASE_URL.replace(/\/api$/, ""), { transports: ["websocket"] });
    socketRef.current = socket;
    const userId = (globalThis as any).__KPR_USER_ID;

    socket.on("connect", () => {
      socket.emit("joinPod", { podId, userId });
    });

    socket.on("podTaskUpdated", (payload: any) => {
      if (payload?.podId === podId) {
        fetchPod();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPod, podId]);

  const emitUpdate = (action: string) => {
    socketRef.current?.emit("podTaskUpdated", { podId, action, at: Date.now() });
  };

  const createTask = async () => {
    if (!taskTitle.trim()) return;
    try {
      const res = await api.post(
        `/pods/${podId}/tasks`,
        { title: taskTitle.trim() },
        { headers: tokenHeaders() }
      );
      setPod(res.data);
      setTaskTitle("");
      emitUpdate("task_created");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Server error");
    }
  };

  const changeTaskStatus = async (taskId: string, status: ColumnKey) => {
    try {
      const res = await api.patch(
        `/pods/${podId}/tasks/${taskId}`,
        { status },
        { headers: tokenHeaders() }
      );
      setPod(res.data);
      emitUpdate("task_updated");
    } catch {
      Alert.alert("Error", "Unable to update task");
    }
  };

  if (!pod) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading pod...</Text>
      </View>
    );
  }

  const tasksByStatus: Record<ColumnKey, Task[]> = {
    todo: pod.tasks?.filter((t: Task) => t.status === "todo") || [],
    inprogress: pod.tasks?.filter((t: Task) => t.status === "inprogress") || [],
    done: pod.tasks?.filter((t: Task) => t.status === "done") || []
  };

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      {item.assignee?.name ? <Text style={styles.taskMeta}>Assignee: {item.assignee.name}</Text> : null}
      <View style={styles.taskActions}>
        {item.status !== "inprogress" && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => changeTaskStatus(item._id, "inprogress")}>
            <Text style={styles.actionText}>Start</Text>
          </TouchableOpacity>
        )}
        {item.status !== "done" && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionGap]} onPress={() => changeTaskStatus(item._id, "done")}>
            <Text style={styles.actionText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

    const renderColumn = (key: ColumnKey, title: string, isLast?: boolean) => (
      <View style={[styles.column, isLast && styles.columnLast]}>
      <Text style={styles.columnTitle}>{title}</Text>
      <FlatList
        data={tasksByStatus[key]}
        keyExtractor={(item) => item._id || uuidv4()}
        renderItem={renderTask}
        ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{pod.name}</Text>
      {pod.description ? <Text style={styles.sub}>{pod.description}</Text> : null}
      <Text style={styles.meta}>Members: {pod.members?.length || 0}</Text>

      <View style={styles.newTaskSection}>
        <TextInput
          placeholder="New task title"
          placeholderTextColor="#777"
          value={taskTitle}
          onChangeText={setTaskTitle}
          style={styles.input}
        />
        <TouchableOpacity style={styles.createBtn} onPress={createTask}>
          <Text style={styles.createText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.board}>
        {renderColumn("todo", "To Do")}
        {renderColumn("inprogress", "In Progress")}
        {renderColumn("done", "Done", true)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  loadingWrap: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.textSecondary },
  header: { color: colors.accentPrimary, fontSize: 22, fontWeight: "700" },
  sub: { color: colors.textSecondary, marginTop: 4 },
  meta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  newTaskSection: { marginTop: 16, backgroundColor: colors.surface, padding: 12, borderRadius: 12 },
  input: { backgroundColor: colors.inputBg, padding: 12, borderRadius: 10, color: colors.textPrimary },
  createBtn: {
    marginTop: 10,
    backgroundColor: colors.accentSecondary,
    padding: 12,
    alignItems: "center",
    borderRadius: 10
  },
  createText: { color: colors.textPrimary, fontWeight: "700" },
  board: { flexDirection: "row", marginTop: 16 },
  column: { flex: 1, backgroundColor: colors.surface, padding: 10, borderRadius: 12, marginRight: 12 },
  columnLast: { marginRight: 0 },
  columnTitle: { color: colors.textSecondary, fontWeight: "700", marginBottom: 8 },
  taskCard: { backgroundColor: "#120B17", padding: 10, borderRadius: 10, marginBottom: 10 },
  taskTitle: { color: colors.textPrimary, fontWeight: "700" },
  taskMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  taskActions: { flexDirection: "row", marginTop: 10 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#241934", borderRadius: 8 },
  actionText: { color: colors.textPrimary, fontWeight: "600" },
  actionGap: { marginLeft: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 12, textAlign: "center", marginTop: 10 }
});
