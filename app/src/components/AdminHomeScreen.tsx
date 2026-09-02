import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAudioPlayer } from "expo-audio";
import type { AudioPlayer } from "expo-audio";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import {
  fetchLatestIncidents,
  passIncident,
  getLocalAudioUri,
} from "../api/endpoints";
import { loadSettings } from "../store/settings";
import type { Incident } from "../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "../types";
import IncidentAlertModal from "./IncidentAlertModal";

// How long a newly created incident stays highlighted as a flashing alert
// card (~15s ≈ 4–5 polling cycles at the default 4s interval).
const RECENT_INCIDENT_MS = 15000;

type Nav = NativeStackNavigationProp<AdminStackParamList, "AdminHome">;

interface Props {
  navigation: Nav;
}

export default function AdminHomeScreen({ navigation }: Props) {
  const { t, lang } = useI18n();
  const { cnic } = useAuth();
  const insets = useSafeAreaInsets();
  const isRtl = lang === "ur";

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [passingIds, setPassingIds] = useState<Set<string>>(new Set());
  const [alertIncident, setAlertIncident] = useState<Incident | null>(null);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const pendingPlayRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Any incident created within the last ~15s renders as a heartbeat alert card
  const hasRecentIncident = incidents.some(
    (i) => Date.now() - new Date(i.created_at).getTime() <= RECENT_INCIDENT_MS
  );

  // Double-thump heartbeat while a recent alert card is visible
  useEffect(() => {
    if (!hasRecentIncident) {
      pulseAnim.setValue(1);
      return;
    }
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.65,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.delay(650),
      ])
    );
    beat.start();
    return () => beat.stop();
  }, [hasRecentIncident, pulseAnim]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingIntervalMs = useRef(4000);

  // Load settings for polling interval
  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      pollingIntervalMs.current = settings.pollingIntervalMs;
    })();
  }, []);

  // Fetch incidents on mount + polling
  const loadIncidents = useCallback(async () => {
    try {
      const data = await fetchLatestIncidents();

      // Detect new incidents for alert
      const currentIds = new Set(data.map((i) => i.id));
      const newOnes = data.filter(
        (i) => !knownIds.has(i.id) && knownIds.size > 0
      );

      if (newOnes.length > 0) {
        // Trigger alert for the newest incident
        setAlertIncident(newOnes[0]);
      }

      setKnownIds(currentIds);
      setIncidents(data);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [knownIds]);

  useEffect(() => {
    loadIncidents();

    pollRef.current = setInterval(() => {
      loadIncidents();
    }, pollingIntervalMs.current);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Stop playback and release the active player (also cancels a pending
  // audio download so it never starts playing after being stopped)
  const stopPlayback = () => {
    const p = playerRef.current;
    playerRef.current = null;
    pendingPlayRef.current = null;
    setPendingId(null);
    if (p) {
      try {
        p.remove();
      } catch {}
    }
    setPlayingId(null);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when polling interval changes
  useEffect(() => {
    const updatePolling = async () => {
      const settings = await loadSettings();
      if (settings.pollingIntervalMs !== pollingIntervalMs.current) {
        pollingIntervalMs.current = settings.pollingIntervalMs;
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = setInterval(() => {
            loadIncidents();
          }, pollingIntervalMs.current);
        }
      }
    };
    const sub = setInterval(updatePolling, 5000);
    return () => clearInterval(sub);
  }, [loadIncidents]);

  const handlePass = async (incidentId: string) => {
    setPassingIds((prev) => new Set(prev).add(incidentId));
    try {
      await passIncident(incidentId);
      setIncidents((prev) => prev.filter((i) => i.id !== incidentId));
      setKnownIds((prev) => {
        const next = new Set(prev);
        next.delete(incidentId);
        return next;
      });
    } catch {
      Alert.alert(t("error"), "Failed to mark incident as processed.");
    } finally {
      setPassingIds((prev) => {
        const next = new Set(prev);
        next.delete(incidentId);
        return next;
      });
    }
  };

  const handlePlayAudio = async (incident: Incident) => {
    if (!incident.audio_file) return;

    // Toggle off if this incident is already playing or still downloading
    if (
      playingId === incident.id ||
      pendingPlayRef.current === incident.id
    ) {
      stopPlayback();
      return;
    }

    stopPlayback();
    pendingPlayRef.current = incident.id;
    setPendingId(incident.id);

    try {
      // /audio requires a Bearer token — download via the authed client
      // (cached), then hand the local file to the native player.
      const uri = await getLocalAudioUri(incident.audio_file);
      if (pendingPlayRef.current !== incident.id) return; // stopped meanwhile

      pendingPlayRef.current = null;
      setPendingId(null);

      const player = createAudioPlayer({ uri });
      playerRef.current = player;
      setPlayingId(incident.id);

      player.addListener("playbackStatusUpdate", (status) => {
        if (playerRef.current !== player) return;
        if (status.didJustFinish) {
          // Defer cleanup out of the event callback to avoid disposing mid-event
          setTimeout(stopPlayback, 0);
          return;
        }
        // Kick off playback as soon as the file is ready
        if (status.isLoaded && !status.playing) {
          player.play();
        }
      });
    } catch (err) {
      console.error("Audio playback failed:", err);
      stopPlayback();
    }
  };

  const dismissAlert = () => {
    setAlertIncident(null);
  };

  const formatDate = (iso: string): string => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const renderIncident = ({ item }: { item: Incident }) => {
    // Server-side creation age drives the alert window, so incidents created
    // via any client (API, website, app) flash as soon as they appear.
    const isRecent =
      Date.now() - new Date(item.created_at).getTime() <= RECENT_INCIDENT_MS;

    return (
      <Animated.View
        style={[
          styles.incidentCard,
          isRecent && styles.incidentCardAlert,
          isRecent && { opacity: pulseAnim },
        ]}
      >
        {/* Status indicator */}
        <View style={styles.cardTop}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Heartbeat alert banner — shown while the incident is recent */}
        {isRecent && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>🚨 {t("alert_title")}</Text>
          </View>
        )}

        {/* Description */}
        {item.llm_desc && (
          <Text style={styles.incidentDesc} numberOfLines={3}>
            {item.llm_desc}
          </Text>
        )}

        {/* Location */}
        {item.display_name && (
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {item.display_name}
          </Text>
        )}

        {/* Agent answer */}
        {item.agent_answer && (
          <Text style={styles.agentText} numberOfLines={2}>
            {item.agent_answer}
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {item.audio_file && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.audioBtn,
                playingId === item.id && styles.audioBtnActive,
              ]}
              onPress={() => handlePlayAudio(item)}
              activeOpacity={0.8}
            >
              {pendingId === item.id ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text style={styles.actionBtnText}>
                  {playingId === item.id ? "⏹" : "▶"} Audio
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.passBtn]}
            onPress={() => handlePass(item.id)}
            disabled={passingIds.has(item.id)}
            activeOpacity={0.8}
          >
            {passingIds.has(item.id) ? (
              <ActivityIndicator size="small" color={colors.foreground} />
            ) : (
              <Text style={styles.actionBtnText}>✓ {t("mark_processed")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
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
        <View>
          <Text style={styles.headerTitle}>{t("incident_list")}</Text>
          <Text style={styles.headerSub}>
            {incidents.length} pending | {cnic}
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

      {/* Incident list */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : incidents.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyText}>{t("no_incidents_yet")}</Text>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={renderIncident}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Alert modal */}
      <IncidentAlertModal
        visible={alertIncident !== null}
        incident={alertIncident}
        onDismiss={dismissAlert}
        onViewIncidents={() => {
          dismissAlert();
        }}
        onPlayAudio={(incident) => handlePlayAudio(incident)}
      />
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
  headerTitle: {
    ...typography.h2,
    color: colors.foreground,
  },
  headerSub: {
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
    marginBottom: spacing.sm,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing["2xl"],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.mutedForeground,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  incidentCard: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  incidentCardAlert: {
    backgroundColor: colors.alertBackground,
    borderColor: colors.alertBorder,
    borderWidth: 2,
    ...shadows.glowDestructive,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderWidth: 1,
    borderColor: colors.alertBorder,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  alertBannerText: {
    ...typography.label,
    color: colors.destructive,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
  },
  statusText: {
    ...typography.caption,
    color: colors.destructive,
    fontWeight: "700",
    letterSpacing: 1,
  },
  timeText: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  incidentDesc: {
    ...typography.body,
    color: colors.foreground,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  locationText: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  agentText: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.md,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  audioBtn: {
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  audioBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(14, 165, 233, 0.15)",
  },
  passBtn: {
    backgroundColor: colors.success,
  },
  actionBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 13,
  },
});