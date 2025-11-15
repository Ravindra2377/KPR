import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AuthScreen from "../screens/AuthScreen";
import TempleHall from "../screens/TempleHall";
import IdeaList from "../screens/IdeaList";
import IdeaDetail from "../screens/IdeaDetail";
import IdeaComposer from "../screens/IdeaComposer";
import RoomList, { Room } from "../screens/RoomList";
import RoomChat from "../screens/RoomChat";
import Profile from "../screens/Profile";
import EditProfile from "../screens/EditProfile";

export type RootStackParamList = {
  Auth: undefined;
  TempleHall: undefined;
  IdeaList: undefined;
  IdeaDetail: { id: string };
  IdeaComposer: undefined;
  RoomList: undefined;
  RoomChat: { room: Room };
  Profile: undefined;
  EditProfile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="TempleHall" component={TempleHall} />
        <Stack.Screen name="IdeaList" component={IdeaList} />
        <Stack.Screen name="IdeaDetail" component={IdeaDetail} />
        <Stack.Screen name="IdeaComposer" component={IdeaComposer} />
        <Stack.Screen name="RoomList" component={RoomList} />
        <Stack.Screen name="RoomChat" component={RoomChat} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
