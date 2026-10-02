import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Renders the confirm action in the destructive (red) accent. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed confirmation dialog — replaces the bare native Alert so destructive
 * actions match the app's dark glass UI.
 */
export default function ThemedConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  const accent = destructive ? colors.destructive : colors.primary;
  const accentGlow = destructive ? colors.destructiveGlow : colors.primaryGlow;
  const accentShadow = destructive ? shadows.glowDestructive : shadows.glow;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap cancels */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />

        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: accentGlow }]}>
            <Text style={[styles.badgeIcon, { color: accent }]}>⏻</Text>
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: accent }, accentShadow]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadows.lg,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  badgeIcon: {
    fontSize: 26,
    lineHeight: 30,
  },
  title: {
    ...typography.h4,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cancelBtnText: {
    ...typography.label,
    color: colors.secondaryForeground,
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 15,
    letterSpacing: 0.5,
  },
});