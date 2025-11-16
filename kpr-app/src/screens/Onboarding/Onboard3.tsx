import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { onboardingStyles as s } from "./styles";

export default function Onboard3({ navigation }: any) {
  return (
    <View style={s.container}>
      <Text style={s.title}>Meet the Oracle</Text>
      <Text style={s.subtitle}>
        Your AI creative mentor.{"\n"}
        Refining ideas. Enhancing clarity.{"\n"}
        Guiding your vision.
      </Text>

      <TouchableOpacity style={s.nextBtn} onPress={() => navigation.navigate("SkillSelect")}>
        <Text style={s.nextText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SkillSelect")}>
        <Text style={s.skip}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}
