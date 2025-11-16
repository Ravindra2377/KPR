import { colors } from "./colors";

export const brand = {
  gradient: {
    primary: [colors.accentPrimary, colors.accentSecondary] as [string, string],
    subtle: ["#1F0030", "#0B0B0D"] as [string, string]
  },
  glass: {
    backgroundColor: "rgba(19, 10, 31, 0.65)",
    borderColor: "rgba(134, 68, 255, 0.2)"
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6
  }
};
