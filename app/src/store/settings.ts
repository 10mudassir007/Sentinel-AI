import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppLanguage, AppSettings } from "../types";

const SETTINGS_KEY = "sentinel_app_settings";

/**
 * Backend URL baked in from .env (EXPO_PUBLIC_API_URL) at bundle time.
 * Used as the default until the user overrides it via Settings.
 */
export const DEFAULT_API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8754";

const DEFAULT_SETTINGS: AppSettings = {
  language: "en",
  backendUrl: DEFAULT_API_URL,
  pollingIntervalMs: 4000,
  cameraId: "mobile-cam-001",
  shareLocation: true,
};

/** Load persisted settings, falling back to defaults for missing keys. */
export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Corrupt or missing — return defaults
  }
  return { ...DEFAULT_SETTINGS };
}

/** Persist settings. */
export async function saveSettings(
  partial: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await loadSettings();
  const merged: AppSettings = { ...current, ...partial };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
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