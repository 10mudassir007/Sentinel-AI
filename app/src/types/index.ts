/** Supported UI languages */
export type AppLanguage = "en" | "ur";

export interface AppSettings {
  language: AppLanguage;
  backendUrl: string;
  pollingIntervalMs: number;
  cameraId: string;
  shareLocation: boolean;
}

export interface LoginRequest {
  cnic: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  cnic: string;
  user_type: "user" | "authoritative";
}

export interface Incident {
  display_name: string | null;
  llm_desc: string | null;
  agent_answer: string | null;
  audio_file: string | null;
  id: string;
  created_at: string;
  status: string;
}

export interface IncidentsResponse {
  incidents: Incident[];
}

export interface VideoAnalysisResult {
  filename: string;
  camera_id: string | null;
  location: Record<string, unknown> | null;
  escalation: unknown;
  incidents_detected: number;
  video_analysis: Record<string, unknown>;
  agent_response: string | null;
  dispatch: unknown[] | null;
  audio_file: string | null;
}

/** Accumulated results from a chunked recording session */
export interface ChunkedSessionResult {
  chunks: number;
  results: VideoAnalysisResult[];
  totalIncidents: number;
  lastAudioFile: string | null;
  lastAgentResponse: string | null;
}

export type RootStackParamList = {
  LanguageSelect: undefined;
  Login: undefined;
  UserTabs: undefined;
  AdminTabs: undefined;
};

export type UserStackParamList = {
  UserHome: undefined;
  RecordVideo: undefined;
  UploadVideo: undefined;
  AnalysisResult: { result: ChunkedSessionResult };
  Settings: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
  Settings: undefined;
};

// Translation map for UI strings
export type TranslationKey =
  | "app_name"
  | "select_language"
  | "english"
  | "urdu"
  | "continue"
  | "login_title"
  | "cnic_placeholder"
  | "login_button"
  | "logging_in"
  | "invalid_cnic"
  | "unauthorized"
  | "server_error"
  | "legal_disclaimer"
  | "settings"
  | "language"
  | "backend_url"
  | "polling_interval"
  | "camera_id_label"
  | "camera_id_desc"
  | "share_location"
  | "share_location_desc"
  | "logout"
  | "confirm_logout"
  | "cancel"
  | "record_video"
  | "upload_demo"
  | "recording"
  | "recording_chunks"
  | "chunks_uploaded"
  | "stop_recording"
  | "processing"
  | "processing_chunk"
  | "select_video"
  | "analysis_title"
  | "analysis_multi_title"
  | "chunks_analyzed"
  | "incidents_detected"
  | "agent_response"
  | "no_incidents"
  | "play_audio"
  | "done"
  | "incident_list"
  | "new_incident"
  | "mark_processed"
  | "processing_pass"
  | "no_incidents_yet"
  | "alert_title"
  | "alert_description"
  | "dismiss"
  | "view_incidents"
  | "error"
  | "ok"
  | "demo_badge"
  | "cnic_format_hint"
  | "connection_error"
  | "location_permission"
  | "location_fetching"
  | "location_unavailable"
  | "save"
  | "login_security_note";

export type Translations = Record<AppLanguage, Record<TranslationKey, string>>;