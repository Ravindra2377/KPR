import { Platform } from "react-native";

const family = {
  regular: Platform.select({ ios: "Inter-Regular", android: "Inter-Regular" }) || "Inter",
  medium: Platform.select({ ios: "Inter-Medium", android: "Inter-Medium" }) || "Inter-Medium",
  bold: Platform.select({ ios: "Inter-Bold", android: "Inter-Bold" }) || "Inter-Bold",
  extraBold: Platform.select({ ios: "Inter-ExtraBold", android: "Inter-ExtraBold" }) || "Inter-ExtraBold"
};

export const typography = {
  family,
  title: { fontFamily: family.extraBold, letterSpacing: -0.5 },
  heading: { fontFamily: family.bold },
  body: { fontFamily: family.regular },
  accent: { fontFamily: family.medium, letterSpacing: 0.5 }
};
