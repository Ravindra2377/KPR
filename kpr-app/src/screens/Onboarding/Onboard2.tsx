import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { onboardingStyles as s } from "./styles";

export default function Onboard2({ navigation }: any) {
  return (
    <View style={s.container}>
      <Text style={s.title}>Create & Connect</Text>
      <Text style={s.subtitle}>
        Share ideas. Join creative rooms. Collaborate inside Pods.{"\n"}
        Build with the world’s most talented people.
      </Text>

      <TouchableOpacity style={s.nextBtn} onPress={() => navigation.navigate("Onboard3")}>
        <Text style={s.nextText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SkillSelect")}>
        <Text style={s.skip}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}
