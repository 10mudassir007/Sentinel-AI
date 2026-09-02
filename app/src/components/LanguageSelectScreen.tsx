import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import type { AppLanguage } from "../types";
import { markFirstLaunchDone, saveSettings } from "../store/settings";

interface Props {
  onComplete: () => void;
}

export default function LanguageSelectScreen({ onComplete }: Props) {
  const { t, lang, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();

  const handleSelect = async (l: AppLanguage) => {
    setLanguage(l);
    await saveSettings({ language: l });
    await markFirstLaunchDone();
    onComplete();
  };

  const isRtl = lang === "ur";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
        isRtl && { direction: "rtl" },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Logo / Title area */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoGlow} />
          <Text style={styles.logoText}>S</Text>
        </View>
        <Text style={styles.title}>{t("app_name")}</Text>
        <Text style={styles.subtitle}>{t("select_language")}</Text>
      </View>

      {/* Language buttons */}
      <View style={styles.options}>
        <TouchableOpacity
          style={[
            styles.langButton,
            lang === "en" && styles.langButtonSelected,
          ]}
          onPress={() => handleSelect("en")}
          activeOpacity={0.8}
        >
          <Text style={styles.langIcon}>🇬🇧</Text>
          <Text
            style={[
              styles.langLabel,
              lang === "en" && styles.langLabelSelected,
            ]}
          >
            {t("english")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.langButton,
            lang === "ur" && styles.langButtonSelected,
          ]}
          onPress={() => handleSelect("ur")}
          activeOpacity={0.8}
        >
          <Text style={styles.langIcon}>🇵🇰</Text>
          <Text
            style={[
              styles.langLabel,
              lang === "ur" && styles.langLabelSelected,
            ]}
          >
            {t("urdu")}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {t("select_language")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  logoGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryGlow,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.foreground,
  },
  title: {
    ...typography.h1,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  options: {
    width: "100%",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  langButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
    ...shadows.glow,
  },
  langIcon: {
    fontSize: 28,
  },
  langLabel: {
    ...typography.h3,
    color: colors.mutedForeground,
    flex: 1,
  },
  langLabelSelected: {
    color: colors.primary,
  },
  hint: {
    ...typography.caption,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});