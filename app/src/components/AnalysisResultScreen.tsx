import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { getLocalAudioUri } from "../api/endpoints";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { UserStackParamList, ChunkedSessionResult } from "../types";

type Nav = NativeStackNavigationProp<UserStackParamList, "AnalysisResult">;

interface Props {
  navigation: Nav;
  route: { params: { result: ChunkedSessionResult } };
}

export default function AnalysisResultScreen({ navigation, route }: Props) {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const isRtl = lang === "ur";
  const { result } = route.params;

  const [localAudioUri, setLocalAudioUri] = useState<string | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const player = useAudioPlayer(localAudioUri ? { uri: localAudioUri } : null);
  const status = useAudioPlayerStatus(player);
  const autoPlayedRef = useRef(false);
  const [ended, setEnded] = useState(false);

  const isMultiChunk = result.chunks > 1;
  const isPlaying = status.playing;
  const isLoadingAudio =
    !status.isLoaded && !!result.lastAudioFile && !audioFailed;

  // The /audio endpoint requires a Bearer token, which the native audio
  // player cannot attach — download through the authed client first and
  // play the cached local file instead.
  useEffect(() => {
    const audioFile = result.lastAudioFile;
    if (!audioFile) return;

    let cancelled = false;
    setAudioFailed(false);

    getLocalAudioUri(audioFile)
      .then((uri) => {
        if (!cancelled) setLocalAudioUri(uri);
      })
      .catch((err) => {
        console.error("Audio download failed:", err);
        if (!cancelled) setAudioFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [result.lastAudioFile, retryNonce]);

  // Auto-play the result audio once it has finished loading
  useEffect(() => {
    if (!result.lastAudioFile || !localAudioUri || autoPlayedRef.current) return;
    if (status.isLoaded) {
      autoPlayedRef.current = true;
      player.play();
    }
  }, [status.isLoaded, player, result.lastAudioFile, localAudioUri]);

  // Track natural end of playback so replay restarts from the beginning
  useEffect(() => {
    if (status.didJustFinish) setEnded(true);
    else if (status.playing) setEnded(false);
  }, [status.didJustFinish, status.playing]);

  const handlePlayPause = () => {
    if (!result.lastAudioFile) return;
    // Download not finished (or failed) — tapping retries it and auto-plays
    if (!localAudioUri) {
      setRetryNonce((n) => n + 1);
      return;
    }
    if (status.playing) {
      player.pause();
    } else {
      autoPlayedRef.current = true;
      if (ended) player.seekTo(0);
      player.play();
    }
  };

  // Get the most informative result for display
  const primaryResult = result.results[result.results.length - 1];

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
        <Text style={styles.headerTitle}>
          {isMultiChunk ? t("analysis_multi_title") : t("analysis_title")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chunk info badge */}
        {isMultiChunk && (
          <View style={styles.chunkBadge}>
            <Text style={styles.chunkBadgeText}>
              {t("chunks_analyzed").replace("{0}", String(result.chunks))}
            </Text>
          </View>
        )}

        {/* Incidents detected badge */}
        <View
          style={[
            styles.badgeRow,
            result.totalIncidents > 0 ? styles.badgeAlert : styles.badgeSafe,
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              result.totalIncidents > 0 ? styles.dotAlert : styles.dotSafe,
            ]}
          />
          <Text style={styles.badgeText}>
            {result.totalIncidents > 0
              ? `${result.totalIncidents} ${t("incidents_detected")}`
              : t("no_incidents")}
          </Text>
        </View>

        {/* Agent response (from last chunk) */}
        {result.lastAgentResponse && (
          <View style={styles.glassCard}>
            <Text style={[styles.cardLabel, isRtl && { textAlign: "right" }]}>
              {t("agent_response")}
            </Text>
            <Text style={[styles.cardValue, isRtl && { textAlign: "right" }]}>
              {result.lastAgentResponse}
            </Text>
          </View>
        )}

        {/* Audio player */}
        {result.lastAudioFile && (
          <View style={styles.audioCard}>
            <Text style={[styles.cardLabel, isRtl && { textAlign: "right" }]}>
              {t("play_audio")}
            </Text>
            <TouchableOpacity
              style={[styles.playBtn, shadows.glow]}
              onPress={handlePlayPause}
              disabled={isLoadingAudio}
              activeOpacity={0.85}
            >
              {isLoadingAudio ? (
                <ActivityIndicator color={colors.foreground} />
              ) : (
                <Text style={styles.playBtnText}>
                  {isPlaying ? "⏸ Pause" : "▶ Play"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Per-chunk summary (multi-chunk only) */}
        {isMultiChunk && result.results.length > 0 && (
          <View style={styles.glassCard}>
            <Text style={styles.chunksSectionTitle}>
              Per-Chunk Breakdown
            </Text>
            {result.results.map((r, i) => (
              <View key={i} style={styles.chunkRow}>
                <Text style={styles.chunkIndex}>Chunk {i + 1}</Text>
                <View style={styles.chunkMeta}>
                  <Text style={styles.chunkIncidents}>
                    {r.incidents_detected} incident{r.incidents_detected !== 1 ? "s" : ""}
                  </Text>
                  {r.camera_id && (
                    <Text style={styles.chunkCamera}>📷 {r.camera_id}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Single result metadata */}
        {!isMultiChunk && primaryResult && (
          <View style={styles.glassCard}>
            <Text style={styles.chunksSectionTitle}>Details</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>File</Text>
              <Text style={styles.metaValue}>{primaryResult.filename}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Camera</Text>
              <Text style={styles.metaValue}>
                {primaryResult.camera_id ?? "N/A"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>
                {primaryResult.location?.display_name
                  ? String(primaryResult.location.display_name).slice(0, 40) +
                    "..."
                  : "N/A"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Done button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.doneBtn, shadows.glow]}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>{t("done")}</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: spacing["2xl"],
  },
  chunkBadge: {
    alignSelf: "center",
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryGlowIntense,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  chunkBadgeText: {
    ...typography.label,
    color: colors.primary,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  badgeAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  badgeSafe: {
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotAlert: {
    backgroundColor: colors.destructive,
  },
  dotSafe: {
    backgroundColor: colors.success,
  },
  badgeText: {
    ...typography.label,
    color: colors.foreground,
  },
  glassCard: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardLabel: {
    ...typography.label,
    color: colors.mutedForeground,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardValue: {
    ...typography.body,
    color: colors.foreground,
    lineHeight: 22,
  },
  audioCard: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  playBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing["2xl"],
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    minWidth: 140,
    alignItems: "center",
  },
  playBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 16,
  },
  chunksSectionTitle: {
    ...typography.h4,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  chunkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  chunkIndex: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  chunkMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  chunkIncidents: {
    ...typography.bodySmall,
    color: colors.foreground,
  },
  chunkCamera: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  metaLabel: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
    flex: 1,
  },
  metaValue: {
    ...typography.bodySmall,
    color: colors.foreground,
    flex: 2,
    textAlign: "right",
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  doneBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 16,
  },
});