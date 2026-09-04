import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/endpoints";
import { reconfigureClient } from "../api/client";
import { loadSettings } from "../store/settings";
import { APP_VERSION } from "../constants";
import { AxiosError } from "axios";

interface Props {
  onLoginSuccess: () => void;
}

// Backend-compatible CNIC validation: dashed (12345-1234567-1) or 13 digits
const CNIC_DASHED = /^\d{5}-\d{7}-\d{1}$/;
const CNIC_DIGITS = /^\d{13}$/;

export default function LoginScreen({ onLoginSuccess }: Props) {
  const { t, lang } = useI18n();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [cnic, setCnic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isRtl = lang === "ur";

  // Animate in the disclaimer
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  /** Auto-format CNIC: insert hyphens as user types */
  const handleCnicChange = (text: string) => {
    setError(null);
    // Remove non-digit characters except hyphens for formatting
    const digits = text.replace(/[^\d]/g, "");
    let formatted = digits;
    if (digits.length > 5) {
      formatted = digits.slice(0, 5) + "-" + digits.slice(5);
    }
    if (digits.length > 12) {
      formatted =
        formatted.slice(0, 13) + "-" + formatted.slice(13, 14);
    }
    // Limit to 15 chars (5+1+7+1+1 = 15)
    setCnic(formatted.slice(0, 15));
  };

  const validateCnic = (value: string): boolean => {
    return CNIC_DASHED.test(value) || CNIC_DIGITS.test(value);
  };

  const handleLogin = async () => {
    const trimmed = cnic.trim();

    if (!validateCnic(trimmed)) {
      setError(t("invalid_cnic"));
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const settings = await loadSettings();
      reconfigureClient(settings.backendUrl);

      const res = await login(trimmed);
      await signIn(res);
      onLoginSuccess();
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          setError(t("unauthorized"));
        } else if (err.response?.status === 422) {
          setError(t("invalid_cnic"));
        } else if (err.code === "ERR_NETWORK") {
          setError(t("connection_error"));
        } else {
          setError(t("server_error"));
        }
      } else {
        setError(t("server_error"));
      }
    } finally {
      setLoading(false);
    }
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
        {/* Logo / Brand */}
        <View style={styles.header}>
          <View style={styles.glowRing}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>S</Text>
            </View>
          </View>
          <Text style={[styles.title, isRtl && { textAlign: "right" }]}>
            {t("app_name")}
          </Text>
          <Text style={[styles.subtitle, isRtl && { textAlign: "right" }]}>
            {t("login_title")}
          </Text>
        </View>

        {/* Legal Disclaimer */}
        <Animated.View style={[styles.disclaimerCard, { opacity: fadeAnim }]}>
          <View style={styles.disclaimerIconRow}>
            <Text style={styles.disclaimerIcon}>⚖️</Text>
            <Text style={styles.disclaimerTitle}>
              {t("authorized_use_only")}
            </Text>
          </View>
          <Text style={styles.disclaimerText}>{t("legal_disclaimer")}</Text>
          <View style={styles.disclaimerDivider} />
          <Text style={styles.disclaimerNote}>{t("login_security_note")}</Text>
        </Animated.View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={[styles.label, isRtl && { textAlign: "right" }]}>
            CNIC
          </Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              isRtl && { textAlign: "right", writingDirection: "rtl" },
              error ? styles.inputError : null,
            ]}
            placeholder={t("cnic_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            value={cnic}
            onChangeText={handleCnicChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            editable={!loading}
            maxLength={15}
          />
          <Text style={[styles.hint, isRtl && { textAlign: "right" }]}>
            {t("cnic_format_hint")}
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.foreground} size="small" />
            ) : (
              <Text style={styles.loginButtonText}>{t("login_button")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Text style={styles.version}>
        {t("app_name")} v{APP_VERSION}
      </Text>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadows.glow,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.foreground,
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
  disclaimerCard: {
    backgroundColor: "rgba(245, 158, 11, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  disclaimerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  disclaimerIcon: {
    fontSize: 16,
  },
  disclaimerTitle: {
    ...typography.label,
    color: colors.warning,
    letterSpacing: 0.5,
  },
  disclaimerText: {
    ...typography.bodySmall,
    color: colors.secondaryForeground,
    lineHeight: 20,
  },
  disclaimerDivider: {
    height: 1,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    marginVertical: spacing.sm,
  },
  disclaimerNote: {
    ...typography.caption,
    color: colors.mutedForeground,
    fontStyle: "italic",
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
  hint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.glow,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  version: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: "center",
    paddingBottom: spacing.md,
  },
});