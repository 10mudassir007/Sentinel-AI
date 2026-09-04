import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppSettings } from "../types";

const SETTINGS_KEY = "sentinel_app_settings";

/**
 * Backend URL baked in from .env (EXPO_PUBLIC_API_URL) at bundle time.
 * Used as the default until the user overrides it via Settings.
 */
export const DEFAULT_API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8754";

/** Old hardcoded default that every install used to share. */
const LEGACY_DEFAULT_CAMERA_ID = "mobile-cam-001";

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  backendUrl: DEFAULT_API_URL,
  pollingIntervalMs: 4000,
  // Empty means "not assigned yet" — loadSettings() generates and persists a
  // per-install unique id so two phones never share one backend queue key.
  cameraId: "",
  // Privacy: GPS is opt-in; the user enables it in Settings.
  shareLocation: false,
};

/**
 * Generate a per-install camera identifier. Collisions across installs are
 * what previously made every phone share the backend's per-camera queue.
 */
export function generateDeviceCameraId(): string {
  return `mobile-cam-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

// Settings are read often (each upload, each poll). Cache the parsed promise
// so concurrent callers cannot each generate a different camera id; the cache
// is refreshed whenever saveSettings() writes new values.
let cachedSettings: Promise<AppSettings> | null = null;

async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const parsed: Partial<AppSettings> = raw
      ? (JSON.parse(raw) as Partial<AppSettings>)
      : {};
    let cameraId = parsed.cameraId;
    if (!cameraId || cameraId === LEGACY_DEFAULT_CAMERA_ID) {
      // First run (or legacy install): assign a unique id and persist it so
      // every subsequent read returns the same value.
      cameraId = generateDeviceCameraId();
      const merged = { ...DEFAULT_SETTINGS, ...parsed, cameraId };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    // Corrupt/missing storage — fall back to defaults with a fresh id so the
    // session still has a consistent camera identity.
    return { ...DEFAULT_SETTINGS, cameraId: generateDeviceCameraId() };
  }
}

/** Load persisted settings, falling back to defaults for missing keys. */
export function loadSettings(): Promise<AppSettings> {
  cachedSettings ??= readSettings();
  return cachedSettings;
}

/** Persist settings. */
export async function saveSettings(
  partial: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await loadSettings();
  const merged: AppSettings = { ...current, ...partial };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  cachedSettings = Promise.resolve(merged);
  return merged;
}

/** Check if the user has completed first-launch setup. */
export async function isFirstLaunch(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem("sentinel_first_launch_done");
    return value !== "true";
  } catch {
    return true;
  }
}

/** Mark first-launch as done. */
export async function markFirstLaunchDone(): Promise<void> {
  await AsyncStorage.setItem("sentinel_first_launch_done", "true");
}
