import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io, { Socket } from "socket.io-client";
import api, { BASE_URL } from "../api/client";

interface NotificationValue {
  notifications: any[];
  unreadCount: number;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  socket: Socket | null;
}

export const NotificationContext = createContext<NotificationValue>({
  notifications: [],
  unreadCount: 0,
  load: async () => {},
  reload: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  socket: null
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("kpr_token");
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const res = await api.get("/notifications", { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch (err) {
      console.warn("load notifications err", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let isMounted = true;
    const connectSocket = async () => {
      const userId = await AsyncStorage.getItem("kpr_user_id");
      if (!userId) return;
      const client = io(BASE_URL.replace(/\/api$/, ""), { transports: ["websocket"] });
      socketRef.current = client;
      setSocket(client);

      client.on("connect", () => {
        client.emit("identify", { userId });
      });

      client.on("notification", (notif: any) => {
        if (!isMounted) return;
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((c) => c + (notif.read ? 0 : 1));
      });
    };

    connectSocket();

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("kpr_token");
      if (!token) return;
      await api.patch(`/notifications/${id}/markRead`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn("markRead err", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("kpr_token");
      if (!token) return;
      await api.patch(
        "/notifications/markAllRead",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn("markAllRead err", err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        load: loadNotifications,
        reload: loadNotifications,
        markRead,
        markAllRead,
        socket
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
