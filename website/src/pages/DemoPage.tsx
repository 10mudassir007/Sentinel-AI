import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Play,
  CheckCircle2,
  FileVideo,
  Loader2,
  AlertCircle,
  Eye,
  Brain,
  Phone,
  Target,
  Zap,
  ArrowRight,
  FlaskConical,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ApiClient, isApiError } from "@/lib/api";
import type { AnalyzeVideoResponse, Incident, DispatchEntry } from "@/lib/api";
import { sampleResponse } from "./demo-sample";

const DEMO_CNIC = import.meta.env.VITE_DEMO_CNIC || "";
const DEMO_LANGUAGE = "en";
const DEMO_LATITUDE = "25.39689";
const DEMO_LONGITUDE = "68.37718";
const DEMO_CAMERA_ID = "web-demo";
const DEMO_SINGLE_UPLOAD = "1";

// Matches the backend limit (MAX_UPLOAD_MB) — enforced here to avoid streaming
// oversized or non-video files to the server.
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
// Only extensions the backend (routes.py) actually accepts.
const VIDEO_EXTENSION = /\.(mp4|avi|mov)$/i;

// Single shared client instance for the life of the page.
const apiClient = new ApiClient(undefined, DEMO_CNIC);

// LangChain LLM responses can be a plain string OR a list of content blocks
// like [{ type: "text", text: "...", extras: ... }] — normalize both to text.
const textOf = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(" ");
  if (value && typeof value === "object" && "text" in value && typeof value.text === "string") return value.text;
  return "";
};

const pipelineStages = [
  { id: "motion", label: "Motion Gate", icon: Activity, color: "text-cyan-400" },
  { id: "yolo", label: "YOLO11m", icon: Eye, color: "text-purple-400" },
  { id: "reasoning", label: "LangChain", icon: Brain, color: "text-indigo-400" },
  { id: "dispatch", label: "Dispatch", icon: Phone, color: "text-red-400" },
];

const DemoPage = () => {
  const [uploadState, setUploadState] = useState<"idle" | "processing" | "complete">("idle");
  const [fileName, setFileName] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<AnalyzeVideoResponse | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const audioUrlRef = useRef<string>("");

  // Clean up the audio blob URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const loadAudio = useCallback(async (filename: string) => {
    try {
      const blob = await apiClient.fetchAudio(filename);
      // Release the previous object URL so repeated uploads do not leak blobs.
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = URL.createObjectURL(blob);
      setAudioUrl(audioUrlRef.current);
    } catch (error) {
      console.warn("Could not load voice alert:", error);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side guard — the backend enforces the same limit.
    const isVideo = file.type.startsWith("video/") || VIDEO_EXTENSION.test(file.name);
    if (!isVideo || file.size > MAX_UPLOAD_BYTES) {
      setApiError(`Invalid file: ${file.name}. Must be a video under 200MB.`);
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setApiError(null);
    setIsFallback(false);
    setUploadState("processing");

    // Fire the API call immediately, animate pipeline stages alongside it.
    const apiPromise = apiClient
      .analyzeVideo(file, {
        language: DEMO_LANGUAGE,
        latitude: DEMO_LATITUDE,
        longitude: DEMO_LONGITUDE,
        cameraId: DEMO_CAMERA_ID,
        singleUpload: DEMO_SINGLE_UPLOAD,
      })
      .then((data) => {
        setApiResponse(data);
        if (data?.audio_file) loadAudio(data.audio_file);
        setActiveStage("dispatch");
        return data;
      })
      .catch((error) => {
        console.error("API Error:", error);
        setApiError(isApiError(error) ? error.message : null);
        setApiResponse(sampleResponse);
        setIsFallback(true);
        setActiveStage("dispatch");
      });

    // Animate through pipeline stages concurrently while the API works.
    setActiveStage("motion");
    await new Promise((r) => setTimeout(r, 600));
    setActiveStage("yolo");
    await new Promise((r) => setTimeout(r, 800));
    setActiveStage("reasoning");

    // Wait for the API to finish (if it hasn't already).
    await apiPromise;

    await new Promise((r) => setTimeout(r, 400));
    setActiveStage(null);
    setUploadState("complete");
    event.target.value = "";
  };

  const resetDemo = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }
    setUploadState("idle");
    setFileName("");
    setApiResponse(null);
    setIsFallback(false);
    setActiveStage(null);
    setApiError(null);
    setAudioUrl("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
          >
            <Zap className="w-3 h-3" />
            <span>Test the Detection Pipeline</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4"
          >
            Live API <span className="text-primary">Demo</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Upload a video clip to test the Sentinel AI detection pipeline. The system runs YOLO11m detection,
            LangChain reasoning, and simulated dispatch — just like the production backend.
          </motion.p>
        </section>

        {/* Pipeline Visualization */}
        <section className="container mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-between gap-2 p-4 rounded-xl bg-secondary/30 border border-border">
              {pipelineStages.map((stage, i) => (
                <div key={stage.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                      activeStage === stage.id
                        ? "bg-primary/20 border border-primary/40 shadow-glow"
                        : uploadState === "complete"
                        ? "bg-secondary/50 border border-border"
                        : "bg-secondary/30 border border-border/50 opacity-50"
                    }`}
                  >
                    <stage.icon
                      className={`w-3.5 h-3.5 ${
                        activeStage === stage.id ? stage.color : "text-muted-foreground"
                      } ${activeStage === stage.id ? "animate-pulse" : ""}`}
                    />
                    <span
                      className={`text-xs font-mono ${
                        activeStage === stage.id ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {i < pipelineStages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                  )}
                </div>
              ))}
              <div
                className={`text-[10px] font-mono px-2 py-1 rounded ${
                  uploadState === "complete"
                    ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                    : uploadState === "processing"
                    ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                    : "text-muted-foreground/30"
                }`}
              >
                {uploadState === "idle"
                  ? "AWAITING_INPUT"
                  : uploadState === "processing"
                  ? `${activeStage?.toUpperCase()}_ACTIVE`
                  : "COMPLETE"}
              </div>
            </div>
          </motion.div>
        </section>

        {(apiError || isFallback) && (
          <section className="container mx-auto px-4 pb-6">
            <Alert
              className={`max-w-6xl mx-auto ${
                apiError
                  ? "bg-red-500/10 border-red-500/50 text-red-500"
                  : "bg-orange-500/10 border-orange-500/50 text-orange-500"
              }`}
            >
              <AlertCircle className={`h-4 w-4 ${apiError ? "stroke-red-500" : "stroke-orange-500"}`} />
              <AlertTitle>
                {apiError ? (isFallback ? "API Server Error" : "Invalid File") : "API Unreachable"}
              </AlertTitle>
              <AlertDescription>
                {isFallback ? (
                  <>
                    API unreachable or error occurred. Displaying <strong>Sample Response</strong> below for reference.
                  </>
                ) : (
                  <>{apiError}</>
                )}
              </AlertDescription>
            </Alert>
          </section>
        )}

        {/* Main Demo Panels */}
        <section className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Upload Panel */}
            <div className="space-y-6">
              <div className="gradient-card rounded-xl border border-border p-6 bg-background/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-primary" />
                  Incident Footage
                </h3>

                {uploadState === "idle" ? (
                  <label className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                    <input type="file" accept="video/*" className="sr-only" onChange={handleFileUpload} />
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Click to upload emergency footage</p>
                    <p className="text-xs text-muted-foreground/60 mt-2">Supports MP4, AVI, MOV — max 200MB</p>
                  </label>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                      <FileVideo className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {uploadState === "processing"
                            ? `Pipeline: ${activeStage?.toUpperCase()}`
                            : "Analysis complete"}
                        </p>
                      </div>
                      {uploadState === "complete" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-primary transition-all duration-700 ${
                          uploadState === "processing"
                            ? "w-[70%] animate-pulse"
                            : uploadState === "complete"
                            ? "w-full"
                            : "w-[30%]"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline info card */}
              {uploadState !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="gradient-card rounded-xl border border-border p-4 bg-background/50"
                >
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    What happens when you upload
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "Motion gate filters static frames", stage: "motion" },
                      { label: "YOLO11m detects objects", stage: "yolo" },
                      { label: "LangChain reasoning assesses severity", stage: "reasoning" },
                      { label: "Dispatch decision & authority alert", stage: "dispatch" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            uploadState === "complete"
                              ? "bg-emerald-400"
                              : activeStage === step.stage
                              ? "bg-primary animate-pulse"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                        <span>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Response Panel */}
            <div className="gradient-card rounded-xl border border-border bg-background/50 backdrop-blur-sm">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold">Verification Output</h3>
                {uploadState === "complete" && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      isFallback
                        ? "border-orange-500/50 text-orange-400"
                        : "border-emerald-500/50 text-emerald-400"
                    }`}
                  >
                    {isFallback ? "SAMPLE_DATA" : "LIVE_RESPONSE"}
                  </span>
                )}
              </div>

              <div className="p-6 max-h-[500px] overflow-y-auto">
                {uploadState === "idle" && (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/30">
                    <Play className="w-12 h-12 mb-2" />
                    <p className="text-sm">Upload a video to begin analysis</p>
                  </div>
                )}

                {uploadState === "processing" && (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="relative mb-6">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground animate-pulse">
                      [{activeStage?.toUpperCase()}] Processing...
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                      {activeStage === "motion" && "Filtering static frames..."}
                      {activeStage === "yolo" && "Running YOLO11m detection model..."}
                      {activeStage === "reasoning" && "LangChain agent evaluating incident..."}
                      {activeStage === "dispatch" && "Generating dispatch alert..."}
                    </p>
                  </div>
                )}

                {apiResponse && uploadState === "complete" && (
                  <div className="space-y-4">
                    {/* Analysis Summary */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-secondary/30 border border-border">
                        {apiResponse.incidents_detected ?? 0} incident(s)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-secondary/30 border border-border">
                        {apiResponse.video_analysis?.total_frames ?? 0} frames
                      </span>
                      {apiResponse.camera_id && (
                        <span className="px-2 py-0.5 rounded bg-secondary/30 border border-border">
                          cam: {apiResponse.camera_id}
                        </span>
                      )}
                      {apiResponse.location?.display_name && (
                        <span className="px-2 py-0.5 rounded bg-secondary/30 border border-border">
                          loc: {apiResponse.location.display_name}
                        </span>
                      )}
                      {apiResponse.audio_file && (
                        <span className="px-2 py-0.5 rounded bg-secondary/30 border border-border">
                          audio: {apiResponse.audio_file}
                        </span>
                      )}
                    </div>

                    {/* Incidents Detected */}
                    {apiResponse.video_analysis?.incidents && apiResponse.video_analysis.incidents.length > 0 && (
                      <div className="p-4 rounded-lg bg-background/50 border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Detected Incidents
                        </h4>
                        {apiResponse.video_analysis.incidents.map((inc: Incident, i: number) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">Incident {i + 1}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">t+{inc.timestamp}s</span>
                            </div>
                            {inc.objects && inc.objects.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {inc.objects.map((obj, j: number) => (
                                  <span
                                    key={j}
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary"
                                  >
                                    {obj.label} {Math.round((obj.confidence ?? 0) * 100)}%
                                  </span>
                                ))}
                              </div>
                            )}
                            {inc.llm_description && (
                              <p className="text-xs text-muted-foreground mt-1">{textOf(inc.llm_description)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Agent Response */}
                    {apiResponse.agent_response && (
                      <div className="p-4 rounded-lg bg-background/50 border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Reasoning Output (LangChain Agent)
                        </h4>
                        <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words font-mono bg-secondary/30 p-3 rounded-lg border border-border">
                          {textOf(apiResponse.agent_response)}
                        </div>
                      </div>
                    )}

                    {/* Dispatch Info */}
                    {apiResponse.dispatch && apiResponse.dispatch.length > 0 && (
                      <div className="p-4 rounded-lg bg-background/50 border border-border">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Dispatch Decision
                        </h4>
                        <div className="space-y-2">
                          {apiResponse.dispatch.map((entry: DispatchEntry, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <Phone className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-foreground font-medium capitalize">{entry.service}</span>
                              <span className="text-muted-foreground font-mono">{entry.destination}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  entry.status === "placed"
                                    ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                                    : "bg-orange-400/10 text-orange-400 border-orange-400/20"
                                }`}
                              >
                                {entry.status === "placed" ? "CALL_PLACED" : "FAILED"}
                              </span>
                              {entry.error && (
                                <span className="text-orange-400/70 truncate">{entry.error}</span>
                              )}
                            </div>
                          ))}
                          {apiResponse.audio_file && (
                            <div className="pt-2 mt-2 border-t border-border">
                              {audioUrl ? (
                                <audio controls src={audioUrl} className="w-full h-8" />
                              ) : (
                                <button
                                  onClick={() => {
                                    if (apiResponse.audio_file) loadAudio(apiResponse.audio_file);
                                  }}
                                  className="text-[10px] text-primary hover:underline flex items-center gap-1"
                                >
                                  <Play className="w-3 h-3" />
                                  Play voice alert ({apiResponse.audio_file})
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clear Button */}
                    <Button onClick={resetDemo} variant="ghost" className="w-full text-xs h-8 text-muted-foreground">
                      Clear &amp; Upload New Footage
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Info Footer */}
        <section className="container mx-auto px-4 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="gradient-card rounded-xl border border-primary/20 p-6 bg-primary/5">
              <div className="flex items-start gap-3">
                <FlaskConical className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">About This Demo</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This page connects to the Sentinel AI backend.
                    When the backend is unreachable, sample data is displayed showing a realistic pipeline response.
                    The same YOLO11m + LangChain pipeline runs in production — this demo gives you a live look
                    at how incidents are detected, classified, and escalated.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default DemoPage;