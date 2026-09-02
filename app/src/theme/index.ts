/**
 * Sentinel AI Mobile Theme — 2026 Modern Edition
 *
 * Dark professional blue palette with glassmorphism tokens:
 *   Background: hsl(222, 47%, 6%)   → #0A0E1A
 *   Primary:    hsl(199, 89%, 48%)  → #0EA5E9
 *   Card:       hsl(222, 47%, 8%)   → #0D1225
 *   Border:     hsl(222, 30%, 18%)  → #1E293B
 *   Text:       hsl(210, 40%, 96%)  → #F0F4F8
 */

export const colors = {
  // Base
  background: "#0A0E1A",
  foreground: "#F0F4F8",

  // Primary (cyan-blue accent)
  primary: "#0EA5E9",
  primaryLight: "#38BDF8",
  primaryDark: "#0284C7",
  primaryGlow: "rgba(14, 165, 233, 0.25)",
  primaryGlowIntense: "rgba(14, 165, 233, 0.4)",

  // Surfaces
  card: "#0D1225",
  cardBorder: "#1E293B",
  cardElevated: "#111827",

  // Glassmorphism tokens
  glassBackground: "rgba(13, 18, 37, 0.6)",
  glassBorder: "rgba(30, 41, 59, 0.5)",
  glassLight: "rgba(255, 255, 255, 0.03)",
  glassHighlight: "rgba(255, 255, 255, 0.05)",

  // Secondary / muted
  secondary: "#1E293B",
  secondaryForeground: "#94A3B8",
  muted: "#1A1F2E",
  mutedForeground: "#94A3B8",

  // Semantic
  success: "#22C55E",
  successGlow: "rgba(34, 197, 94, 0.25)",
  warning: "#F59E0B",
  warningGlow: "rgba(245, 158, 11, 0.25)",
  destructive: "#EF4444",
  destructiveGlow: "rgba(239, 68, 68, 0.25)",

  // Alert (emergency)
  alertBackground: "#1A0A0A",
  alertBorder: "#EF4444",
  alertGlow: "rgba(239, 68, 68, 0.3)",

  // UI elements
  border: "#1E293B",
  inputBackground: "rgba(17, 24, 39, 0.8)",
  inputBorder: "#2A3A4A",
  inputBorderFocus: "#0EA5E9",
  ring: "#0EA5E9",

  // Tab bar
  tabBarBackground: "rgba(8, 12, 22, 0.9)",
  tabBarBorder: "rgba(30, 41, 59, 0.5)",
  tabInactive: "#4A5568",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.75)",
  overlayLight: "rgba(0, 0, 0, 0.4)",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  glowDestructive: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: "700" as const,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontWeight: "600" as const,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  mono: {
    fontSize: 14,
    fontFamily: "monospace" as const,
  },
} as const;

/** Gradient presets for LinearGradient-like overlays */
export const gradients = {
  primary: ["rgba(14, 165, 233, 0.15)", "rgba(14, 165, 233, 0.02)"] as const,
  destructive: ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0.02)"] as const,
  card: ["rgba(13, 18, 37, 0.8)", "rgba(8, 12, 22, 0.4)"] as const,
} as const;