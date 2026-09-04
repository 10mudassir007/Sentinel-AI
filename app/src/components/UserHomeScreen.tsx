import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { maskCnic } from "../constants";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { UserStackParamList } from "../types";

type Nav = NativeStackNavigationProp<UserStackParamList, "UserHome">;

interface Props {
  navigation: Nav;
}

export default function UserHomeScreen({ navigation }: Props) {
  const { t, lang } = useI18n();
  const { cnic } = useAuth();
  const insets = useSafeAreaInsets();
  const isRtl = lang === "ur";

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        isRtl && { direction: "rtl" },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t("app_name")}</Text>
          <Text style={styles.cnicText}>
            {cnic ? maskCnic(cnic) : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate("Settings")}
          activeOpacity={0.7}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Main options */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, isRtl && { textAlign: "right" }]}>
          {t("detection_modes")}
        </Text>
        <Text style={[styles.sectionDesc, isRtl && { textAlign: "right" }]}>
          {t("detection_modes_desc")}
        </Text>

        {/* Record Card */}
        <TouchableOpacity
          style={[styles.actionCard, shadows.md]}
          onPress={() => navigation.navigate("RecordVideo")}
          activeOpacity={0.9}
        >
          <View style={[styles.cardIcon, styles.recordIcon]}>
            <Text style={styles.cardIconText}>🎥</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t("record_video")}</Text>
            <Text style={styles.cardDesc}>{t("record_desc")}</Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.featurePill}>📍 {t("gps")}</Text>
              <Text style={styles.featurePill}>📋 {t("chunks_5s")}</Text>
              <Text style={styles.featurePill}>📷 {t("camera_id_label")}</Text>
            </View>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </TouchableOpacity>

        {/* Demo Upload Card */}
        <TouchableOpacity
          style={[styles.actionCard, shadows.md]}
          onPress={() => navigation.navigate("UploadVideo")}
          activeOpacity={0.9}
        >
          <View style={[styles.cardIcon, styles.demoIcon]}>
            <Text style={styles.cardIconText}>📁</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.demoLabelRow}>
              <Text style={styles.cardTitle}>{t("upload_demo")}</Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>{t("demo_badge")}</Text>
              </View>
            </View>
            <Text style={styles.cardDesc}>{t("demo_upload_desc")}</Text>
            <View style={styles.cardFeatures}>
              <Text style={[styles.featurePill, styles.featurePillDemo]}>
                📂 {t("single_file")}
              </Text>
              <Text style={[styles.featurePill, styles.featurePillDemo]}>
                📍 {t("gps")}
              </Text>
            </View>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  greeting: {
    ...typography.h2,
    color: colors.foreground,
  },
  cnicText: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  recordIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  demoIcon: {
    backgroundColor: "rgba(14, 165, 233, 0.12)",
  },
  cardIconText: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.foreground,
    marginBottom: 2,
  },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.secondaryForeground,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  cardFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  featurePill: {
    ...typography.caption,
    color: colors.destructive,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    fontWeight: "600",
    fontSize: 10,
    overflow: "hidden",
  },
  featurePillDemo: {
    color: colors.primary,
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primaryGlowIntense,
  },
  cardArrow: {
    fontSize: 20,
    color: colors.mutedForeground,
    marginTop: spacing.md,
  },
  demoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  demoBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  demoBadgeText: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "700",
  },
});