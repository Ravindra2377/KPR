import React from "react";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import AnimatedOnboardCard from "../../components/AnimatedOnboardCard";
import { onboardingStyles as s } from "./styles";

export default function Onboard1({ navigation }: any) {
  const CARD_CONTENT = [
    {
      title: "Welcome to KPR",
      subtitle: "A sanctuary where creators, founders, thinkers, and artists build the future together."
    },
    {
      title: "Create & Connect",
      subtitle: "Launch ideas, jam in Rooms, and build Pods with the world’s best collaborators."
    },
    {
      title: "Oracle Guidance",
      subtitle: "Tap AI mentorship that sharpens ideas and unlocks your creative flow."
    }
  ];

  const scrollX = useSharedValue(0);
  const width = Dimensions.get("window").width;
  const onScroll = useAnimatedScrollHandler((evt) => {
    scrollX.value = evt.contentOffset.x;
  });

  return (
    <View style={s.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={localStyles.carousel}
      >
        {CARD_CONTENT.map((card, index) => (
          <View key={card.title} style={[localStyles.slide, { width }]}>
            <AnimatedOnboardCard index={index} scrollX={scrollX} title={card.title} subtitle={card.subtitle} />
          </View>
        ))}
      </Animated.ScrollView>

      <Text style={s.subtitle}>Swipe to feel the vibe, then jump in.</Text>

      <TouchableOpacity style={s.nextBtn} onPress={() => navigation.navigate("Onboard2")}>
        <Text style={s.nextText}>Next</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SkillSelect")}>
        <Text style={s.skip}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const localStyles = StyleSheet.create({
  carousel: {
    marginBottom: 30
  },
  slide: {
    alignItems: "center",
    justifyContent: "center"
  }
});
