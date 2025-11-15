import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";

interface UserContextValue {
  user: any;
  setUser: (val: any) => void;
  loadUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("kpr_token");
      if (!token) return;

      const res = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data);
      globalThis.__KPR_USER = res.data;
      globalThis.__KPR_USER_ID = res.data._id;
      globalThis.__KPR_USER_NAME = res.data.name;
      globalThis.__KPR_TOKEN = token;
    } catch (err) {
      console.warn("User load error:", err);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return <UserContext.Provider value={{ user, setUser, loadUser }}>{children}</UserContext.Provider>;
}
