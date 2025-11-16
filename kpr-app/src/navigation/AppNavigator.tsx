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
import Oracle from "../screens/Oracle";
import Profile from "../screens/Profile";
import EditProfile from "../screens/EditProfile";
import PodList from "../screens/Pods/PodList";
import PodDetail from "../screens/Pods/PodDetail";
import NotificationsScreen from "../screens/Notifications";

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
  Oracle: { ideaText?: string } | undefined;
  PodList: undefined;
  PodDetail: { id: string; name: string };
  Notifications: undefined;
  Profile: undefined;
  EditProfile: undefined;
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
        <Stack.Screen name="Oracle" component={Oracle} />
        <Stack.Screen name="PodList" component={PodList} />
        <Stack.Screen name="PodDetail" component={PodDetail} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
