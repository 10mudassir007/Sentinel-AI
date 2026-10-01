import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { Logo } from "./Logo";
import { checkBackendHealth, reconfigureClient } from "../api/client";
import { loadSettings, saveSettings } from "../store/settings";

interface Props {
  onComplete: () => void;
}

const URL_PATTERN = /^https?:\/\/.+/i;

export default function BackendUrlSetupScreen({ onComplete }: Props) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setUrl(settings.backendUrl);
    })();
  }, []);

  const normalizeUrl = (value: string): string => {
    return value.trim().replace(/\/$/, "");
  };

  const handleContinue = async () => {
    const normalized = normalizeUrl(url);

    if (!normalized || !URL_PATTERN.test(normalized)) {
      setError(t("backend_url_invalid"));
      return;
    }

    setError(null);
    setLoading(true);

    const result = await checkBackendHealth(normalized);

    if (!result.ok) {
      setError(result.error ?? t("backend_url_unreachable"));
      setLoading(false);
      return;
    }

    await saveSettings({ backendUrl: normalized });
    reconfigureClient(normalized);
    setLoading(false);
    onComplete();
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.header}>
          <View style={styles.glowRing}>
            <Logo size={80} />
          </View>
          <Text style={styles.title}>{t("app_name")}</Text>
          <Text style={styles.subtitle}>{t("backend_url_title")}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>API</Text>
          <Text style={styles.infoText}>{t("backend_url_description")}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>{t("backend_url")}</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder={t("backend_url_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            value={url}
            onChangeText={(text) => {
              setError(null);
              setUrl(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleContinue}
            editable={!loading}
            autoFocus
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              loading && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.foreground} size="small" />
            ) : (
              <Text style={styles.continueButtonText}>
                {t("backend_url_test_continue")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    paddingVertical: spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  glowRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  title: {
    ...typography.h2,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.secondaryForeground,
    flex: 1,
    lineHeight: 20,
  },
  form: {
    width: "100%",
  },
  label: {
    ...typography.label,
    color: colors.secondaryForeground,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  inputError: {
    borderColor: colors.destructive,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.destructive,
    flex: 1,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  continueButtonDisabled: {
    opacity: 0.65,
  },
  continueButtonText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});