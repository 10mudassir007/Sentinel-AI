import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Vibration,
} from "react-native";
import { createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { getLocalAudioUri } from "../api/endpoints";
import type { Incident } from "../types";

interface Props {
  visible: boolean;
  incident: Incident | null;
  onDismiss: () => void;
  onViewIncidents: () => void;
  onPlayAudio: (incident: Incident) => void;
}

export default function IncidentAlertModal({
  visible,
  incident,
  onDismiss,
  onViewIncidents,
  onPlayAudio,
}: Props) {
  const { t, lang } = useI18n();
  const isRtl = lang === "ur";
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Player created by this modal's auto-play; kept in a ref so replaying via
  // the parent stops it first (two players would otherwise overlap).
  const localPlayerRef = useRef<AudioPlayer | null>(null);

  const stopLocalPlayback = useCallback(() => {
    const p = localPlayerRef.current;
    localPlayerRef.current = null;
    if (p) {
      try {
        p.remove();
      } catch {
        // ignore
      }
    }
  }, []);

  // Pulse animation for the alert icon
  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Vibrate to grab attention
      Vibration.vibrate([0, 500, 200, 500], false);

      return () => {
        pulse.stop();
        Vibration.cancel();
      };
    }
  }, [visible, pulseAnim]);

  // Auto-play audio when alert appears — the /audio endpoint needs a Bearer
  // token, which the native player can't attach, so download to cache first.
  useEffect(() => {
    const audioFile = incident?.audio_file;
    if (!visible || !audioFile) return;

    let cancelled = false;
    let started = false;

    (async () => {
      try {
        const uri = await getLocalAudioUri(audioFile);
        if (cancelled) return;
        const player = createAudioPlayer({ uri });
        if (cancelled) {
          // Stopped while downloading — release the fresh player immediately
          try {
            player.remove();
          } catch {
            // ignore
          }
          return;
        }
        localPlayerRef.current = player;
        player.addListener("playbackStatusUpdate", (status) => {
          // Ignore events after this player was stopped/replaced
          if (localPlayerRef.current !== player) return;
          // Start playback as soon as the file has loaded
          if (!cancelled && !started && status.isLoaded) {
            started = true;
            player.play();
          }
        });
      } catch (err) {
        console.error(
          "Alert audio playback failed:",
          err instanceof Error ? err.message : "unknown error"
        );
      }
    })();

    return () => {
      cancelled = true;
      stopLocalPlayback();
    };
  }, [visible, incident?.audio_file, stopLocalPlayback]);

  if (!incident) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[styles.alertContainer, isRtl && { direction: "rtl" }]}
        >
          {/* Pulse icon */}
          <Animated.View
            style={[styles.alertIcon, { opacity: pulseAnim }]}
          >
            <Text style={styles.alertEmoji}>🚨</Text>
          </Animated.View>

          <Text style={styles.alertTitle}>{t("alert_title")}</Text>
          <Text style={styles.alertDesc}>{t("alert_description")}</Text>

          {/* Incident summary */}
          <View style={styles.incidentPreview}>
            {incident.llm_desc && (
              <Text style={styles.incidentText} numberOfLines={4}>
                {incident.llm_desc}
              </Text>
            )}
            {incident.display_name && (
              <Text style={styles.incidentLocation} numberOfLines={2}>
                📍 {incident.display_name}
              </Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissBtnText}>{t("dismiss")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.viewBtn}
              onPress={onViewIncidents}
              activeOpacity={0.8}
            >
              <Text style={styles.viewBtnText}>{t("view_incidents")}</Text>
            </TouchableOpacity>
          </View>

          {/* Replay audio */}
          <TouchableOpacity
            style={styles.replayBtn}
            onPress={() => {
              // Stop this modal's own player first so the parent's player is
              // the only one playing (no overlapping audio)
              stopLocalPlayback();
              onPlayAudio(incident);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.replayBtnText}>🔊 {t("play_audio")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  alertContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.alertBackground,
    borderWidth: 2,
    borderColor: colors.alertBorder,
    borderRadius: borderRadius["2xl"],
    padding: spacing["2xl"],
    alignItems: "center",
    ...shadows.glowDestructive,
  },
  alertIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.destructiveGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  alertEmoji: {
    fontSize: 40,
  },
  alertTitle: {
    ...typography.h1,
    color: colors.destructive,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  alertDesc: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  incidentPreview: {
    backgroundColor: colors.glassBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: "100%",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  incidentText: {
    ...typography.body,
    color: colors.foreground,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  incidentLocation: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
  },
  dismissBtnText: {
    ...typography.label,
    color: colors.mutedForeground,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.destructive,
    alignItems: "center",
  },
  viewBtnText: {
    ...typography.label,
    color: colors.foreground,
  },
  replayBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  replayBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
});