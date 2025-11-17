import React from "react";
import { View, Image, StyleSheet, Dimensions, Animated, Text } from "react-native";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");
export const BANNER_HEIGHT = 220;

export default function ProfileBannerParallax({
  bannerUrl,
  scrollY,
  children,
  placeholderColor = "#0b0b0d"
}: {
  bannerUrl?: string | null;
  scrollY: Animated.Value;
  children?: React.ReactNode;
  placeholderColor?: string;
}) {
  const translateY = scrollY.interpolate({
    inputRange: [-BANNER_HEIGHT, 0, BANNER_HEIGHT],
    outputRange: [BANNER_HEIGHT / 2, 0, -BANNER_HEIGHT / 2]
  });
  const scale = scrollY.interpolate({
    inputRange: [-BANNER_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolate: "clamp"
  });

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Animated.View style={[styles.bannerWrap, { transform: [{ translateY }, { scale }] }]}
      >
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={styles.bannerImage} resizeMode="cover" />
        ) : (
          <View style={[styles.bannerPlaceholder, { backgroundColor: placeholderColor }]}> 
            <Text style={styles.placeholderText}>No banner yet</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.headerContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerWrap: {
    width,
    height: BANNER_HEIGHT,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center"
  },
  bannerImage: {
    width,
    height: BANNER_HEIGHT
  },
  bannerPlaceholder: {
    width,
    height: BANNER_HEIGHT,
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderText: {
    color: colors.textSecondary
  },
  headerContent: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: -36,
    alignItems: "flex-start"
  }
});
