import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { colors, spacing, borderRadius, typography, shadows } from "../theme";
import { useI18n } from "../context/I18nContext";
import {
  analyzeVideo,
  getLocationCoords,
} from "../api/endpoints";
import { loadSettings } from "../store/settings";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  UserStackParamList,
  ChunkedSessionResult,
  VideoAnalysisResult,
} from "../types";

type Nav = NativeStackNavigationProp<UserStackParamList, "UploadVideo">;

interface Props {
  navigation: Nav;
}

export default function UploadVideoScreen({ navigation }: Props) {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const isRtl = lang === "ur";

  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraId, setCameraId] = useState("mobile-cam-001");
  const [locationInfo, setLocationInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === "granted");

      const settings = await loadSettings();
      setCameraId(settings.cameraId);

      const coords = await getLocationCoords();
      if (coords) {
        setLocationInfo(`${coords.latitude}, ${coords.longitude}`);
      }
    })();
  }, []);

  const pickVideo = async () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "Gallery access is needed to select demo videos."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadVideo(asset.uri, asset.fileName ?? "demo.mp4");
      }
    } catch (err) {
      console.error("Video pick failed:", err);
    }
  };

  const uploadVideo = async (uri: string, fileName: string) => {
    setIsProcessing(true);
    try {
      const coords = await getLocationCoords();

      const result: VideoAnalysisResult = await analyzeVideo({
        fileUri: uri,
        fileName,
        fileMimeType: "video/mp4",
        cameraId,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        singleUpload: "1", // single/demo mode
      });

      const aggregated: ChunkedSessionResult = {
        chunks: 1,
        results: [result],
        totalIncidents: result.incidents_detected || 0,
        lastAudioFile: result.audio_file,
        lastAgentResponse: result.agent_response,
      };

      navigation.replace("AnalysisResult", { result: aggregated });
    } catch (err) {
      console.error("Analysis failed:", err);
      navigation.goBack();
    } finally {
      setIsProcessing(false);
    }
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("upload_demo")}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Info badges */}
        <View style={styles.infoRow}>
          {cameraId && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>📷 {cameraId}</Text>
            </View>
          )}
          {locationInfo && (
            <View style={[styles.infoBadge, styles.infoBadgeLocation]}>
              <Text style={styles.infoBadgeText}>📍</Text>
            </View>
          )}
        </View>

        <View style={styles.uploadArea}>
          <View style={styles.uploadIconContainer}>
            <Text style={styles.uploadIcon}>📁</Text>
          </View>
          <Text style={styles.uploadTitle}>{t("select_video")}</Text>
          <Text style={styles.uploadDesc}>
            Choose a pre-recorded video from your gallery to test the Sentinel
            AI detection pipeline.
          </Text>
          <Text style={styles.uploadFormatNote}>
            A single video upload with GPS coordinates attached.
          </Text>
          <TouchableOpacity
            style={[styles.selectBtn, isProcessing && styles.selectBtnDisabled]}
            onPress={pickVideo}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            <Text style={styles.selectBtnText}>{t("select_video")}</Text>
          </TouchableOpacity>
          <Text style={styles.formats}>Supported: MP4, MOV, AVI</Text>
        </View>
      </View>

      {/* Processing overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingTitle}>{t("processing")}</Text>
            <Text style={styles.processingHint}>
              Analyzing with AI detection pipeline...
            </Text>
          </View>
        </View>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 20,
    color: colors.foreground,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.foreground,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  infoBadgeLocation: {
    borderColor: colors.successGlow,
  },
  infoBadgeText: {
    ...typography.caption,
    color: colors.mutedForeground,
    fontWeight: "600",
  },
  uploadArea: {
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius["2xl"],
    borderStyle: "dashed",
    padding: spacing["2xl"],
  },
  uploadIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadTitle: {
    ...typography.h3,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  uploadDesc: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  uploadFormatNote: {
    ...typography.bodySmall,
    color: colors.secondaryForeground,
    textAlign: "center",
    marginBottom: spacing.lg,
    fontStyle: "italic",
  },
  selectBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing["2xl"],
    borderRadius: borderRadius.md,
    ...shadows.glow,
  },
  selectBtnDisabled: {
    opacity: 0.6,
  },
  selectBtnText: {
    ...typography.label,
    color: colors.foreground,
    fontSize: 16,
  },
  formats: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.md,
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
});