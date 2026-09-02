import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { setAudioModeAsync } from "expo-audio";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import { analyzeVideo, getLocationCoords } from "../api/endpoints";
import { loadSettings } from "../store/settings";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  UserStackParamList,
  VideoAnalysisResult,
  ChunkedSessionResult,
} from "../types";

type Nav = NativeStackNavigationProp<UserStackParamList, "RecordVideo">;

interface Props {
  navigation: Nav;
}

const CHUNK_DURATION_SECONDS = 5;

export default function RecordVideoScreen({ navigation }: Props) {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const isRtl = lang === "ur";

  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isRecordingRef = useRef(false);
  const chunkIndexRef = useRef(0);
  const resultsRef = useRef<VideoAnalysisResult[]>([]);
  const chunkCountRef = useRef(0);
  const locationRef = useRef<{ latitude: string; longitude: string } | null>(
    null
  );
  const cameraIdRef = useRef("mobile-cam-001");
  const uploadCountRef = useRef(0);
  const [uploadCount, setUploadCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the recording indicator
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    // Configure audio for recording
    setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });

    // Pre-fetch location and camera_id from settings
    (async () => {
      const settings = await loadSettings();
      cameraIdRef.current = settings.cameraId;
      const coords = await getLocationCoords();
      locationRef.current = coords;
    })();
  }, [permission]);

  /** Upload a single chunk and accumulate the result */
  const uploadChunk = useCallback(
    async (uri: string, chunkIdx: number): Promise<void> => {
      try {
        const result = await analyzeVideo({
          fileUri: uri,
          fileName: `chunk_${chunkIdx}_${Date.now()}.mp4`,
          fileMimeType: "video/mp4",
          cameraId: cameraIdRef.current,
          latitude: locationRef.current?.latitude,
          longitude: locationRef.current?.longitude,
          singleUpload: "0", // chunked mode
        });
        resultsRef.current.push(result);
        chunkCountRef.current++;
        uploadCountRef.current++;
        setUploadCount(uploadCountRef.current);
      } catch (err) {
        console.error(`Chunk ${chunkIdx} upload failed:`, err);
      }
    },
    []
  );

  /** Record one 5-second chunk and recurse */
  const recordNextChunk = useCallback(async () => {
    if (!isRecordingRef.current) return;

    const currentChunk = chunkIndexRef.current;
    chunkIndexRef.current++;

    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: CHUNK_DURATION_SECONDS,
      });

      // If user stopped while this chunk was recording, don't upload or continue
      if (!isRecordingRef.current) return;

      if (video?.uri) {
        // Upload this chunk in background
        uploadChunk(video.uri, currentChunk);

        // Small delay to let camera reset for next chunk
        setTimeout(() => {
          recordNextChunk();
        }, 300);
      }
    } catch (err) {
      console.error("Chunk recording failed:", err);
      // Try next chunk anyway
      if (isRecordingRef.current) {
        setTimeout(() => recordNextChunk(), 500);
      }
    }
  }, [uploadChunk]);

  const handleStartRecording = async () => {
    resultsRef.current = [];
    chunkIndexRef.current = 0;
    chunkCountRef.current = 0;
    uploadCountRef.current = 0;
    setUploadCount(0);
    isRecordingRef.current = true;
    setIsRecording(true);

    // Re-fetch location in case it changed
    const coords = await getLocationCoords();
    locationRef.current = coords;

    // Start the first chunk
    recordNextChunk();
  };

  const handleStopRecording = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop the current recording
    try {
      cameraRef.current?.stopRecording();
    } catch {
      // ignore
    }

    // Wait a moment for any in-flight chunk to finish, then navigate
    setIsProcessingFinal(true);
    await new Promise((r) => setTimeout(r, 1500));

    // Build aggregated result from all chunks
    const allResults = resultsRef.current;
    const lastResult = allResults[allResults.length - 1];
    const aggregated: ChunkedSessionResult = {
      chunks: allResults.length,
      results: allResults,
      totalIncidents: allResults.reduce(
        (sum, r) => sum + (r.incidents_detected || 0),
        0
      ),
      lastAudioFile: lastResult?.audio_file ?? null,
      lastAgentResponse: lastResult?.agent_response ?? null,
    };

    navigation.replace("AnalysisResult", { result: aggregated });
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centerContainer,
          { paddingTop: insets.top },
          isRtl && { direction: "rtl" },
        ]}
      >
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>🎥</Text>
          <Text style={styles.permissionTitle}>Camera Required</Text>
          <Text style={styles.permissionText}>
            Camera permission is required to record video for AI analysis.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRtl && { direction: "rtl" }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        mode="video"
        facing="back"
        videoQuality="720p"
      >
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            disabled={isRecording || isProcessingFinal}
          >
            <Text style={styles.backBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Recording indicator */}
          <View style={styles.recordingStatusContainer}>
            {isRecording && (
              <View style={styles.recordingStatusRow}>
                <Animated.View
                  style={[styles.recordingDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.recordingLabel}>
                  {uploadCount > 0
                    ? t("recording_chunks")
                        .replace("{0}", String(uploadCount))
                        .replace("{1}", String(chunkIndexRef.current || 1))
                    : t("recording")}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.backBtn} />
        </View>

        {/* Chunk counter */}
        {isRecording && uploadCount > 0 && (
          <View style={styles.chunkCounter}>
            <Text style={styles.chunkCounterText}>
              {t("chunks_uploaded").replace("{0}", String(uploadCount))}
            </Text>
          </View>
        )}

        {/* Location badge */}
        {locationRef.current && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>📍 Live</Text>
          </View>
        )}

        {/* Camera ID badge */}
        {cameraIdRef.current && (
          <View style={styles.cameraIdBadge}>
            <Text style={styles.cameraIdBadgeText}>
              📷 {cameraIdRef.current}
            </Text>
          </View>
        )}

        {/* Processing overlay */}
        {isProcessingFinal && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.processingTitle}>
                {t("processing_chunk").replace(
                  "{0}",
                  String(resultsRef.current.length)
                )}
              </Text>
              <Text style={styles.processingHint}>
                Analyzing {uploadCount} chunks...
              </Text>
            </View>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          {!isRecording && !isProcessingFinal && (
            <TouchableOpacity
              style={[styles.recordBtn, shadows.glow]}
              onPress={handleStartRecording}
              activeOpacity={0.7}
            >
              <View style={styles.recordInner} />
            </TouchableOpacity>
          )}
          {isRecording && (
            <TouchableOpacity
              style={[styles.stopBtn, shadows.glowDestructive]}
              onPress={handleStopRecording}
              activeOpacity={0.7}
            >
              <View style={styles.stopInner} />
            </TouchableOpacity>
          )}
          <Text style={styles.recordHint}>
            {isRecording
              ? t("stop_recording")
              : isProcessingFinal
              ? t("processing")
              : t("record_video")}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  permissionCard: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius["2xl"],
    padding: spacing["2xl"],
    alignItems: "center",
    maxWidth: 340,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  permissionTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  permissionText: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing["2xl"],
    borderRadius: borderRadius.md,
    ...shadows.glow,
  },
  permissionBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 15,
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  backBtnText: {
    fontSize: 18,
    color: colors.foreground,
    fontWeight: "600",
  },
  recordingStatusContainer: {
    alignItems: "center",
    flex: 1,
  },
  recordingStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.destructive,
  },
  recordingLabel: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
  },
  chunkCounter: {
    alignSelf: "center",
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  chunkCounterText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  locationBadge: {
    position: "absolute",
    top: 100,
    right: spacing.md,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.successGlow,
  },
  locationBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "600",
  },
  cameraIdBadge: {
    position: "absolute",
    top: 100,
    left: spacing.md,
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primaryGlow,
  },
  cameraIdBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  processingCard: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius["2xl"],
    padding: spacing["2xl"],
    alignItems: "center",
    gap: spacing.md,
  },
  processingTitle: {
    ...typography.h3,
    color: colors.foreground,
  },
  processingHint: {
    ...typography.bodySmall,
    color: colors.mutedForeground,
  },
  bottomBar: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  recordInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.destructive,
  },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  stopInner: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.destructive,
  },
  recordHint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
});