import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { DEFAULT_API_URL } from "../store/settings";

const TOKEN_KEY = "sentinel_access_token";

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