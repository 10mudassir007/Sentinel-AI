import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import { getClient } from "./client";
import type {
  Incident,
  IncidentsResponse,
  LoginResponse,
  VideoAnalysisResult,
} from "../types";
import { loadSettings } from "../store/settings";

// ─── Login ───────────────────────────────────────────────────────────

export async function login(cnic: string): Promise<LoginResponse> {
  const { data } = await getClient().post<LoginResponse>("/login", { cnic });
  return data;
}

// ─── Location helper ─────────────────────────────────────────────────

export interface LocationCoords {
  latitude: string;
  longitude: string;
}

/** Get current GPS coordinates if permitted and enabled in settings. */
export async function getLocationCoords(): Promise<LocationCoords | null> {
  try {
    const settings = await loadSettings();
    if (!settings.shareLocation) return null;

    const { requestForegroundPermissionsAsync, getCurrentPositionAsync } =
      await import("expo-location");

    const { status } = await requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const pos = await getCurrentPositionAsync({
      accuracy: Platform.OS === "android" ? 3 : undefined, // balanced
    });
    return {
      latitude: String(pos.coords.latitude),
      longitude: String(pos.coords.longitude),
    };
  } catch {
    return null;
  }
}

// ─── Video Analysis ──────────────────────────────────────────────────

export interface AnalyzeVideoParams {
  fileUri: string;
  fileName: string;
  fileMimeType: string;
  language?: string;
  latitude?: string;
  longitude?: string;
  cameraId?: string;
  singleUpload?: string; // "0" or "1" as strings per API spec
}

export async function analyzeVideo(
  params: AnalyzeVideoParams
): Promise<VideoAnalysisResult> {
  const form = new FormData();

  // React Native FormData requires the file as an object with uri/name/type
  form.append("file", {
    uri: params.fileUri,
    name: params.fileName,
    type: params.fileMimeType,
  } as unknown as Blob);

  if (params.language) form.append("language", params.language);
  if (params.latitude) form.append("latitude", params.latitude);
  if (params.longitude) form.append("longitude", params.longitude);
  if (params.cameraId) form.append("camera_id", params.cameraId);
  // single_upload: always send "0" (chunked) or "1" (single/demo)
  form.append("single_upload", params.singleUpload ?? "0");

  const { data } = await getClient().post<VideoAnalysisResult>(
    "/analyze-video",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000, // 2 min for video processing
    }
  );
  return data;
}

// ─── Incidents (admin) ───────────────────────────────────────────────

export async function fetchLatestIncidents(): Promise<Incident[]> {
  const { data } = await getClient().get<IncidentsResponse>(
    "/incidents/latest"
  );
  return data.incidents ?? [];
}

export async function passIncident(incidentId: string): Promise<void> {
  await getClient().post(`/incidents/${incidentId}/pass`);
}

// ─── Audio ───────────────────────────────────────────────────────────

/**
 * Download a generated audio file through the authenticated client and
 * cache it locally. The native audio player cannot attach the Bearer token
 * (GET /audio/{filename} returns 401 without it), so remote audio must be
 * fetched via Axios and played from the local copy.
 */
const audioCache = new Map<string, string>();

export async function getLocalAudioUri(filename: string): Promise<string> {
  const cached = audioCache.get(filename);
  if (cached) return cached;

  const { data } = await getClient().get<ArrayBuffer>(
    `/audio/${encodeURIComponent(filename)}`,
    { responseType: "arraybuffer" }
  );

  const safeName = filename.replace(/[^\w.-]/g, "_");
  const file = new File(Paths.cache, `sentinel-audio-${safeName}`);
  if (file.exists) {
    try {
      file.delete();
    } catch {
      // Best effort — write() below will fail loudly if it cannot be replaced
    }
  }
  file.write(new Uint8Array(data));

  const uri = file.uri;
  audioCache.set(filename, uri);
  return uri;
}

// ─── Health ──────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    await getClient().get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}