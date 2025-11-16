import { Alert } from "react-native";
import api from "../api/client";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { Room } from "../screens/RoomList";
import type { DiscoverUser } from "../types/discover";

export async function startDirectMessage(
  navigation: NavigationProp<RootStackParamList>,
  userId: string,
  userName?: string,
  partnerDetails?: Partial<DiscoverUser>
) {
  try {
    const token = (globalThis as any).__KPR_TOKEN;
    if (!token) {
      Alert.alert("Login required", "Please sign in again to chat.");
      return;
    }

    const res = await api.post<Room>(
      "/rooms/dm",
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const dmRoom = res.data;
    navigation.navigate("DMChat", {
      room: {
        ...dmRoom,
        name: userName ? `DM • ${userName}` : dmRoom.name,
        description: dmRoom.description || "Direct message",
        type: "dm",
        isDM: true
      },
      partner: {
        _id: userId,
        name: userName || partnerDetails?.name || "Creator",
        avatar: partnerDetails?.avatar,
        bio: partnerDetails?.bio,
        skills: partnerDetails?.skills
      }
    });
  } catch (err: any) {
    console.warn("startDirectMessage error", err);
    Alert.alert("Unable to start DM", err?.response?.data?.message || "Please try again later.");
  }
}
