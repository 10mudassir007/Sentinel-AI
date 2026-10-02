import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { DEFAULT_API_URL } from "../store/settings";

export const TOKEN_KEY = "sentinel_access_token";
export const USER_TYPE_KEY = "sentinel_user_type";
export const CNIC_KEY = "sentinel_cnic";

// --- Session expiry (401 on a protected request) ---
type SessionExpiryListener = () => void;
const sessionExpiryListeners = new Set<SessionExpiryListener>();

/** Subscribe to session expiry. Returns an unsubscribe function. */
export function addSessionExpiryListener(fn: SessionExpiryListener): () => void {
  sessionExpiryListeners.add(fn);
  return () => {
    sessionExpiryListeners.delete(fn);
  };
}

/** HTTP status code from a failed request, or undefined if there was no response (network error, timeout, non-Axios error). */
export function getErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}

function notifySessionExpired() {
  sessionExpiryListeners.forEach((fn) => fn());
}

let clientInstance: AxiosInstance | null = null;

function createClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 60000, // 60s — video uploads can be large
    headers: { "Content-Type": "application/json" },
  });

  // Attach Bearer token to every request automatically
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // SecureStore may fail on simulators — proceed without token
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // A 401 on a request that carried a token means the session is dead.
  // Requests without a token (e.g. a failed login) are ignored.
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        error.config?.headers?.Authorization
      ) {
        notifySessionExpired();
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

/** Get or create the shared Axios instance with a given base URL. */
export function getClient(baseURL?: string): AxiosInstance {
  if (!clientInstance || baseURL) {
    clientInstance = createClient(baseURL ?? DEFAULT_API_URL);
  }
  return clientInstance!;
}

/** Re-create the client with a new backend URL (used when settings change). */
export function reconfigureClient(baseURL: string): AxiosInstance {
  clientInstance = createClient(baseURL);
  return clientInstance;
}

export interface BackendHealthResult {
  ok: boolean;
  error?: string;
}

/**
 * Test connectivity to a backend URL without mutating the shared client.
 * Used during first-launch setup before the URL is persisted.
 */
export async function checkBackendHealth(
  baseURL: string
): Promise<BackendHealthResult> {
  try {
    const tempClient = axios.create({
      baseURL,
      timeout: 5000,
    });
    await tempClient.get("/health", { timeout: 5000 });
    return { ok: true };
  } catch (err) {
    let message = "Could not reach the backend.";
    if (axios.isAxiosError(err)) {
      if (err.code === "ERR_NETWORK") {
        message =
          "Network error. Check the URL and make sure the server is running.";
      } else if (err.response) {
        message = `Server returned ${err.response.status} ${err.response.statusText}.`;
      } else if (err.request) {
        message =
          "No response from server. If testing in a browser, check CORS settings on the backend.";
      }
    }
    return { ok: false, error: message };
  }
}