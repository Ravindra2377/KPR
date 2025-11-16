import React from "react";
import { Dimensions, Text, StyleSheet } from "react-native";
import Animated, { Extrapolate, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface AnimatedOnboardCardProps {
  index: number;
  scrollX: SharedValue<number>;
  title: string;
  subtitle: string;
}

export default function AnimatedOnboardCard({ index, scrollX, title, subtitle }: AnimatedOnboardCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolate.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolate.CLAMP);

    return {
      transform: [{ scale }, { translateY }],
      opacity
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width - 80,
    marginHorizontal: 40,
    backgroundColor: "#0F0E12",
    borderRadius: 18,
    padding: 28,
    alignItems: "center"
  },
  title: {
    color: "#BB86FC",
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    color: "#C6C6C8",
    marginTop: 12,
    textAlign: "center"
  }
});
