import { AxiosInstance, InternalAxiosRequestConfig, create } from "axios";
import * as SecureStore from "expo-secure-store";
import { DEFAULT_API_URL } from "../store/settings";

const TOKEN_KEY = "sentinel_access_token";
export const USER_TYPE_KEY = "sentinel_user_type";
export const CNIC_KEY = "sentinel_cnic";

/**
 * Safe way to read an HTTP status out of an unknown thrown value (e.g. an
 * AxiosError) without logging the error object itself, which would leak the
 * Authorization header (Bearer token) into logs.
 */
export function getErrorStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

type SessionExpiryListener = () => void;
const sessionExpiryListeners = new Set<SessionExpiryListener>();

/** Subscribe to global 401 events (expired/revoked token). Returns an unsubscribe fn. */
export function addSessionExpiryListener(
  listener: SessionExpiryListener
): () => void {
  sessionExpiryListeners.add(listener);
  return () => {
    sessionExpiryListeners.delete(listener);
  };
}

let clientInstance: AxiosInstance | null = null;

function createClient(baseURL: string): AxiosInstance {
  const instance = create({
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

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // A 401 from anywhere except /login means the stored session is
      // expired or revoked — notify subscribers so the app can sign out.
      const url: string = error?.config?.url ?? "";
      if (error?.response?.status === 401 && !url.includes("/login")) {
        sessionExpiryListeners.forEach((listener) => listener());
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

export { TOKEN_KEY };
