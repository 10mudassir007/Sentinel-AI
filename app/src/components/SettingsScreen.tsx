import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { loadSettings, saveSettings } from "../store/settings";
import { reconfigureClient } from "../api/client";
import type { AppLanguage, AppSettings } from "../types";

interface Props {
  onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: Props) {
  const { t, lang, setLanguage } = useI18n();
  const { userType, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const isRtl = lang === "ur";

  const [backendUrl, setBackendUrl] = useState("");
  const [pollingSec, setPollingSec] = useState("4");
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(lang);
  const [cameraId, setCameraId] = useState("");
  const [shareLocation, setShareLocation] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setBackendUrl(settings.backendUrl);
      setPollingSec(String(Math.round(settings.pollingIntervalMs / 1000)));
      setSelectedLang(settings.language);
      setCameraId(settings.cameraId);
      setShareLocation(settings.shareLocation);
    })();
  }, []);

  const markChanged = () => setHasChanges(true);
  const resetChanged = () => setHasChanges(false);

  const handleSave = async () => {
    const url = backendUrl.trim().replace(/\/+$/, "");
    const pollingMs = Math.max(
      1000,
      Math.min(30000, parseInt(pollingSec, 10) * 1000 || 4000)
    );
    const camId = cameraId.trim() || "mobile-cam-001";

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Alert.alert(t("error"), "Backend URL must start with http:// or https://");
      return;
    }

    await saveSettings({
      backendUrl: url,
      pollingIntervalMs: pollingMs,
      language: selectedLang,
      cameraId: camId,
      shareLocation,
    });

    setLanguage(selectedLang);
    reconfigureClient(url);
    resetChanged();
    Alert.alert(t("ok"), "Settings saved. Changes apply immediately.");
  };

  const handleLogout = () => {
    Alert.alert(t("confirm_logout"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          onLogout();
        },
      },
    ]);
  };

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
        <Text style={styles.headerTitle}>{t("settings")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Language */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isRtl && { textAlign: "right" }]}>
            {t("language")}
          </Text>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[
                styles.langOption,
                selectedLang === "en" && styles.langOptionSelected,
              ]}
              onPress={() => {
                setSelectedLang("en");
                markChanged();
              }}
            >
              <Text
                style={[
                  styles.langOptionText,
                  selectedLang === "en" && styles.langOptionTextSelected,
                ]}
              >
                🇬🇧 {t("english")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langOption,
                selectedLang === "ur" && styles.langOptionSelected,
              ]}
              onPress={() => {
                setSelectedLang("ur");
                markChanged();
              }}
            >
              <Text
                style={[
                  styles.langOptionText,
                  selectedLang === "ur" && styles.langOptionTextSelected,
                ]}
              >
                🇵🇰 {t("urdu")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Camera ID */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isRtl && { textAlign: "right" }]}>
            {t("camera_id_label")}
          </Text>
          <TextInput
            style={[styles.input, isRtl && { textAlign: "right" }]}
            value={cameraId}
            onChangeText={(text) => {
              setCameraId(text);
              markChanged();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="mobile-cam-001"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={[styles.inputHint, isRtl && { textAlign: "right" }]}>
            {t("camera_id_desc")}
          </Text>
        </View>

        {/* Share Location Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelArea}>
              <Text
                style={[styles.sectionLabel, isRtl && { textAlign: "right" }]}
              >
                {t("share_location")}
              </Text>
              <Text
                style={[
                  styles.inputHint,
                  isRtl && { textAlign: "right" },
                ]}
              >
                {t("share_location_desc")}
              </Text>
            </View>
            <Switch
              value={shareLocation}
              onValueChange={(v) => {
                setShareLocation(v);
                markChanged();
              }}
              trackColor={{
                false: colors.secondary,
                true: colors.primaryDark,
              }}
              thumbColor={shareLocation ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        {/* Backend URL */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isRtl && { textAlign: "right" }]}>
            {t("backend_url")}
          </Text>
          <TextInput
            style={[styles.input, isRtl && { textAlign: "right" }]}
            value={backendUrl}
            onChangeText={(text) => {
              setBackendUrl(text);
              markChanged();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://localhost:8754"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Polling Interval (admin only) */}
        {userType === "authoritative" && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionLabel, isRtl && { textAlign: "right" }]}
            >
              {t("polling_interval")}
            </Text>
            <TextInput
              style={[styles.input, isRtl && { textAlign: "right" }]}
              value={pollingSec}
              onChangeText={(text) => {
                setPollingSec(text.replace(/[^0-9]/g, ""));
                markChanged();
              }}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text
              style={[styles.inputHint, isRtl && { textAlign: "right" }]}
            >
              Range: 1-30 seconds
            </Text>
          </View>
        )}

        {/* Save button */}
        {hasChanges && (
          <TouchableOpacity
            style={[styles.saveBtn, shadows.glow]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>{t("save")}</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutBtnText}>{t("logout")}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Sentinel AI Mobile v2.0.0</Text>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.foreground,
    textAlign: "center",
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.secondaryForeground,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  langOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  langOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  langOptionText: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  langOptionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  toggleLabelArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.foreground,
  },
  inputHint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  saveBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.lg,
  },
  logoutBtn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  logoutBtnText: {
    ...typography.label,
    color: colors.destructive,
    fontSize: 16,
  },
  versionText: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});