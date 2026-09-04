const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8754";

export type ContentBlock = { type?: string; text?: string; [key: string]: unknown };

export type DetectedObject = {
  label: string;
  confidence?: number;
  bbox?: number[];
};

export type Incident = {
  timestamp: number;
  objects?: DetectedObject[];
  llm_description?: string | ContentBlock[];
};

export type DispatchEntry = {
  tool?: string;
  service?: string;
  destination?: string;
  status?: string;
  error?: string;
  location?: string;
  audio?: { name?: string };
};

export type AnalyzeVideoResponse = {
  filename?: string;
  camera_id?: string;
  location?: { display_name?: string };
  escalation?: { state?: string };
  incidents_detected?: number;
  video_analysis?: {
    total_frames?: number;
    camera_id?: string;
    alert?: boolean;
    incidents?: Incident[];
  };
  agent_response?: string | ContentBlock[];
  dispatch?: DispatchEntry[];
  audio_file?: string;
};

// ApiError carries the HTTP status from the backend.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** Narrow an unknown thrown value to ApiError. */
export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

/**
 * Thin HTTP client wrapping the Sentinel-AI backend.
 *
 * Manages bearer-token lifecycle: logs in once, reuses the token until it
 * nears expiry, and retries once on 401.
 */
export class ApiClient {
  private token: string | null = null;
  private expiresAt = 0;
  private authPromise: Promise<string> | null = null;

  constructor(
    private readonly baseUrl: string = API_URL,
    private readonly demoCnic: string = "",
  ) {}

  // ---- auth -----------------------------------------------------------

  private async login(): Promise<string> {
    if (!this.demoCnic) throw new Error("No CNIC configured for demo login");
    const res = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cnic: this.demoCnic }),
    });
    if (!res.ok) throw new Error(`Login failed (${res.status})`);
    const data = await res.json();
    const rawExpiry = data.expires_at;
    const parsed =
      typeof rawExpiry === "number"
        ? rawExpiry * 1000
        : new Date(rawExpiry).getTime();
    this.token = data.access_token;
    this.expiresAt = Number.isFinite(parsed)
      ? parsed
      : Date.now() + 24 * 60 * 60 * 1000;
    return this.token;
  }

  async ensureAuthToken(): Promise<string> {
    if (this.token && this.expiresAt > Date.now() + 60_000) {
      return this.token;
    }
    if (!this.authPromise) {
      this.authPromise = this.login().finally(() => {
        this.authPromise = null;
      });
    }
    return this.authPromise;
  }

  // ---- video analysis -------------------------------------------------

  async analyzeVideo(
    file: File,
    opts: {
      language?: string;
      latitude?: string;
      longitude?: string;
      cameraId?: string;
      singleUpload?: string;
    } = {},
  ): Promise<AnalyzeVideoResponse> {
    const token = await this.ensureAuthToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", opts.language ?? "en");
    formData.append("latitude", opts.latitude ?? "");
    formData.append("longitude", opts.longitude ?? "");
    formData.append("camera_id", opts.cameraId ?? "web-demo");
    formData.append("single_upload", opts.singleUpload ?? "1");

    const makeRequest = (t: string) =>
      fetch(`${this.baseUrl}/analyze-video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
        body: formData,
      });

    let response = await makeRequest(token);

    // Retry once on 401 (expired token)
    if (response.status === 401) {
      this.token = null;
      const newToken = await this.ensureAuthToken();
      response = await makeRequest(newToken);
    }

    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = typeof body?.detail === "string" ? body.detail : "";
      } catch {
        // non-JSON body — ignore
      }
      throw new ApiError(
        response.status,
        detail
          ? `API rejected the request (${response.status}): ${detail}`
          : `Server error (${response.status})`,
      );
    }
    return response.json();
  }

  // ---- audio retrieval ------------------------------------------------

  async fetchAudio(filename: string): Promise<Blob> {
    const token = await this.ensureAuthToken();
    const res = await fetch(
      `${this.baseUrl}/audio/${encodeURIComponent(filename)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`Audio fetch failed (${res.status})`);
    return res.blob();
  }
}