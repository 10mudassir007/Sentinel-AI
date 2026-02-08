import { useState } from "react";
import { Upload, Play, CheckCircle, FileVideo, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const mockResponse = {
  status: "completed (SAMPLE)",
  processing_time_ms: 1847,
  incidents_detected: [
    {
      type: "vehicle_collision",
      confidence: 0.94,
      description: "Sample: Two-vehicle collision detected.",
      severity: "high"
    }
  ],
  agent_response: "This is a sample response because the local API is unreachable."
};

const APIDemo = () => {
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "complete">("idle");
  const [fileName, setFileName] = useState<string>("");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isFallback, setIsFallback] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadState("uploading");
    setIsFallback(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Start Processing State
      setUploadState("processing");

      const response = await fetch("http://localhost:8000/analyze-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      
      // 1. Get the raw string from your backend
      const cleanMessage = data.agent_response || "";

      // 2. Extract content from the HumanMessage(content='...') section
      

      setApiResponse(cleanMessage);
      setUploadState("complete");
    } catch (error) {
      console.error("API Error:", error);
      // 2. Fallback Logic
      setTimeout(() => {
        setApiResponse(mockResponse);
        setIsFallback(true);
        setUploadState("complete");
      }, 1500); // Small delay to feel realistic
    }
  };

  const resetDemo = () => {
    setUploadState("idle");
    setFileName("");
    setApiResponse(null);
    setIsFallback(false);
  };

  return (
    <section id="demo" className="py-24 relative bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Live API Analysis</h2>
          <p className="text-muted-foreground">
            Upload a video to Sentinel AI. Our system will verify the incident and return structured data for emergency dispatch.
          </p>

          
        </div>

        {isFallback && (
          <Alert variant="destructive" className="max-w-6xl mx-auto mb-8 bg-orange-500/10 border-orange-500/50 text-orange-500">
            <AlertCircle className="h-4 w-4 stroke-orange-500" />
            <AlertTitle>Local API Offline</AlertTitle>
            <AlertDescription>
              Could not connect to localhost:8000. Displaying <strong>Sample Response</strong>. Please contact us for a full production demo.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Upload Panel */}
          <div className="space-y-6">
            <div className="gradient-card  rounded-xl border border-border p-6 bg-background/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-primary" />
                Incident Footage
              </h3>
              
              {uploadState === "idle" ? (
                <label className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                  <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                  <Upload className="w-10 h-10  text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Click to upload emergency footage</p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                    <FileVideo className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileName}</p>
                      <p className="text-xs text-muted-foreground">Status: {uploadState.toUpperCase()}</p>
                    </div>
                    {uploadState === "complete" && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-primary transition-all duration-500 ${
                        uploadState === "processing" ? "w-[70%] animate-pulse" : uploadState === "complete" ? "w-full" : "w-[30%]"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            
          </div>

          {/* Response Panel */}
          <div className="gradient-card rounded-xl border border-border p-6 max-h-[450px] overflow-y-auto bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Verification Output</h3>
              {uploadState === "complete" && (
                <span className={`text-[10px] px-2 py-0.5 rounded border ${isFallback ? 'border-orange-500 text-orange-500' : 'border-green-500 text-green-500'}`}>
                  {isFallback ? "FALLBACK_DATA" : "LIVE_RESPONSE"}
                </span>
              )}
            </div>
            
            {!apiResponse && uploadState !== "processing" && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-20">
                <Play className="w-12 h-12 mb-2" />
                <p>Awaiting upload...</p>
              </div>
            )}

            {uploadState === "processing" && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-sm animate-pulse text-muted-foreground font-mono">[AI] Verifying Incident Severity...</p>
              </div>
            )}

            {apiResponse && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border shadow-sm">
                {/* whitespace-pre-wrap: respects newlines from the prompt */}
                {/* break-words: prevents long paths/lists from overflowing */}
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {apiResponse}
                </div>
              </div>
            </div>
          )}

            {uploadState === "complete" && (
              <Button onClick={resetDemo} variant="ghost" className="w-full mt-4 text-xs h-8">
                Clear Analysis
              </Button>
            )}
          </div>
          
        </div>
        <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="px-8">
              <a target="_blank" href="mailto:muddassir032@gmail.com">Request Demo</a>
            </Button>
          </div>
      </div>
    </section>
  );
};

export default APIDemo;