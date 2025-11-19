import React from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "../screens/AuthScreen";
import Onboard1 from "../screens/Onboarding/Onboard1";
import Onboard2 from "../screens/Onboarding/Onboard2";
import Onboard3 from "../screens/Onboarding/Onboard3";
import SkillSelect from "../screens/Onboarding/SkillSelect";
import ProfileSetup from "../screens/Onboarding/ProfileSetup";
import TempleHall from "../screens/TempleHall";
import IdeaList from "../screens/IdeaList";
import IdeaDetail from "../screens/IdeaDetail";
import IdeaComposer from "../screens/IdeaComposer";
import RoomList, { Room } from "../screens/RoomList";
import RoomChat from "../screens/RoomChat";
import DMChat from "../screens/DMChat";
import DMInbox from "../screens/DMInbox";
import Oracle from "../screens/Oracle";
import Profile from "../screens/Profile";
import EditProfile from "../screens/EditProfile";
import PodsDiscoverWithSwitcher from "../screens/Pods/PodsDiscoverWithSwitcher";
import PodsIndex from "../screens/Pods/PodsIndex";
import PodDetail from "../screens/Pods/PodDetail";
import OwnerDashboard from "../screens/Pods/OwnerDashboard";
import ApplicantManager from "../screens/Pods/ApplicantManager";
import NotificationsCenter from "../screens/Notifications/NotificationsCenter";
import RequestsInbox from "../screens/Collab/RequestsInbox";
import CollaboratorsList from "../screens/Collab/CollaboratorsList";
import CollabHistory from "../screens/Collab/CollabHistory";
import DiscoverScreen from "../screens/Discover/DiscoverScreen";
import UserProfileView from "../screens/Discover/UserProfileView";
import type { DiscoverUser } from "../types/discover";
import HuddleCall from "../screens/Huddle/HuddleCall";

export type RootStackParamList = {
  Auth: undefined;
  Onboard1: undefined;
  Onboard2: undefined;
  Onboard3: undefined;
  SkillSelect: undefined;
  ProfileSetup: { skills: string[] };
  TempleHall: undefined;
  IdeaList: undefined;
  IdeaDetail: { id: string };
  IdeaComposer: undefined;
  RoomList: undefined;
  RoomChat: { room: Room };
  DMChat: { room: Room; partner?: { _id: string; name?: string; avatar?: string; bio?: string; skills?: string[] } };
  DMInbox: undefined;
  Oracle: { ideaText?: string } | undefined;
  PodsDiscover: undefined;
  PodsIndex: { view?: "grid" | "list" | "hybrid" } | undefined;
  PodDetail: { podId?: string; id?: string; name?: string };
  OwnerDashboard: undefined;
  ApplicantManager: { podId: string };
  NotificationsCenter: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Discover: undefined;
  UserProfileView: { user: DiscoverUser };
  RequestsInbox: undefined;
  CollaboratorsList: { userId: string; userName: string };
  CollabHistory: { userId: string };
  HuddleCall: { url: string; title?: string; huddleId?: string; isHost?: boolean; roomId?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

type Props = {
  navigationRef?: React.RefObject<NavigationContainerRef<RootStackParamList> | null>;
};

export default function AppNavigator({ navigationRef }: Props) {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Onboard1" component={Onboard1} />
        <Stack.Screen name="Onboard2" component={Onboard2} />
        <Stack.Screen name="Onboard3" component={Onboard3} />
        <Stack.Screen name="SkillSelect" component={SkillSelect} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetup} />
        <Stack.Screen name="TempleHall" component={TempleHall} />
        <Stack.Screen name="IdeaList" component={IdeaList} />
        <Stack.Screen name="IdeaDetail" component={IdeaDetail} />
        <Stack.Screen name="IdeaComposer" component={IdeaComposer} />
        <Stack.Screen name="RoomList" component={RoomList} />
        <Stack.Screen name="RoomChat" component={RoomChat} />
        <Stack.Screen name="DMChat" component={DMChat} />
        <Stack.Screen name="DMInbox" component={DMInbox} />
        <Stack.Screen name="Oracle" component={Oracle} />
        <Stack.Screen name="PodsDiscover" component={PodsDiscoverWithSwitcher} />
        <Stack.Screen name="PodsIndex" component={PodsIndex} />
        <Stack.Screen name="PodDetail" component={PodDetail} />
  <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
  <Stack.Screen name="ApplicantManager" component={ApplicantManager} />
        <Stack.Screen name="NotificationsCenter" component={NotificationsCenter} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />
        <Stack.Screen name="UserProfileView" component={UserProfileView} />
        <Stack.Screen name="RequestsInbox" component={RequestsInbox} />
        <Stack.Screen name="CollaboratorsList" component={CollaboratorsList} />
        <Stack.Screen name="CollabHistory" component={CollabHistory} />
        <Stack.Screen name="HuddleCall" component={HuddleCall} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
