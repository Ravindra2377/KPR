import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 30,
    justifyContent: "center"
  },
  title: {
    fontSize: 32,
    color: colors.accentPrimary,
    fontWeight: "800",
    marginBottom: 20
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 50
  },
  nextBtn: {
    backgroundColor: colors.accentSecondary,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 40
  },
  nextText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700"
  },
  skip: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20
  }
});
