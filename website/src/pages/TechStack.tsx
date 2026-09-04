import {
  FlaskConical,
  Brain,
  Eye,
  Cpu,
  Zap,
  Camera,
  Phone,
  Mic,
  MapPin,
  Lock,
  Server,
  Globe,
  GitBranch,
  Activity,
  Layers,
  Route,
  Radio,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { containerVariants, itemVariants } from "@/lib/utils";

const techCategories = [
  {
    title: "Backend & API",
    description: "Core server framework and API layer powering the detection pipeline.",
    items: [
      { name: "Python 3.11", desc: "Primary runtime language for all backend services.", icon: FlaskConical, color: "text-blue-400" },
      { name: "FastAPI", desc: "Async Python web framework handling all HTTP endpoints, file uploads, and WebSocket connections.", icon: Server, color: "text-emerald-400" },
      { name: "Uvicorn", desc: "High-performance ASGI server running the FastAPI application on port 8754.", icon: Zap, color: "text-amber-400" },
      { name: "Pydantic", desc: "Data validation and settings management for API request/response models.", icon: CheckCircle2, color: "text-cyan-400" },
    ],
    borderColor: "border-emerald-400/20",
  },
  {
    title: "AI / ML Models",
    description: "Computer vision and machine learning models at the heart of incident detection.",
    items: [
      { name: "YOLO11m", desc: "Ultralytics YOLO11 medium model for real-time object detection. Runs on base COCO-pretrained weights (not custom-trained) with interest filters for person, vehicle, and weapon detection; ready to be fine-tuned on incident-specific data.", icon: Eye, color: "text-purple-400" },
      { name: "PyTorch 2.13", desc: "Deep learning framework powering YOLO11m inference with GPU acceleration support.", icon: Cpu, color: "text-orange-400" },
      { name: "TorchVision", desc: "Image transformations and computer vision utilities used in the detection pipeline.", icon: Layers, color: "text-pink-400" },
      { name: "OpenCV", desc: "Video frame extraction, motion detection (frame differencing with adaptive thresholding), and image preprocessing.", icon: Camera, color: "text-blue-400" },
    ],
    borderColor: "border-purple-400/20",
  },
  {
    title: "AI Agents & Reasoning",
    description: "LangChain-based reasoning layer that interprets detections and makes escalation decisions.",
    items: [
      { name: "LangChain 1.3", desc: "Agent framework orchestrating the reasoning pipeline, tool calling, and context management.", icon: GitBranch, color: "text-indigo-400" },
      { name: "LangGraph", desc: "State-machine agent with checkpointing for multi-step escalation workflows.", icon: Route, color: "text-violet-400" },
      { name: "Gemini 3.5 Flash", desc: "Primary vision LLM for frame description and incident classification. Runs with Urdu/English bilingual prompts.", icon: Brain, color: "text-blue-300" },
      { name: "Groq (Qwen 72B)", desc: "Fallback LLM provider activated when Gemini API is unavailable, via LangChain with_fallbacks().", icon: Zap, color: "text-green-400" },
    ],
    borderColor: "border-indigo-400/20",
  },
  {
    title: "Communication & Dispatch",
    description: "Emergency notification and alert systems for contacting first responders.",
    items: [
      { name: "Asterisk AMI", desc: "SIP-based telephony integration for placing automated emergency calls to police (15), ambulance (1122), and fire (16) services.", icon: Phone, color: "text-red-400" },
      { name: "Panoramisk", desc: "Python Asterisk AMI client library managing real-time call control and status monitoring.", icon: Radio, color: "text-rose-400" },
      { name: "Edge-TTS", desc: "Microsoft Edge TTS engine for Urdu/English voice message synthesis in emergency dispatch calls.", icon: Mic, color: "text-cyan-400" },
      { name: "ElevenLabs", desc: "Alternative high-quality TTS provider for emergency voice alerts (fallback to Edge-TTS).", icon: Mic, color: "text-amber-400" },
    ],
    borderColor: "border-red-400/20",
  },
  {
    title: "Infrastructure & Security",
    description: "Authentication, security middleware, and deployment infrastructure.",
    items: [
      { name: "Argon2id", desc: "Memory-hard password hashing for CNIC-based authentication with 24-hour bearer token expiry.", icon: Lock, color: "text-emerald-400" },
      { name: "Geopy / Nominatim", desc: "Reverse geocoding service converting GPS coordinates to human-readable location for dispatch alerts.", icon: MapPin, color: "text-sky-400" },
      { name: "Docker", desc: "Containerized deployment on Python 3.11-slim with multi-stage builds.", icon: Globe, color: "text-blue-400" },
      { name: "Rate Limiting", desc: "Per-IP and per-source request throttling with max upload size enforcement and magic-byte validation.", icon: Activity, color: "text-yellow-400" },
    ],
    borderColor: "border-emerald-400/20",
  },
];

const pipelineFlow = [
  { name: "Motion Gate", icon: Activity, color: "text-cyan-400" },
  { name: "YOLO11m", icon: Eye, color: "text-purple-400" },
  { name: "Escalation", icon: Route, color: "text-indigo-400" },
  { name: "Vision LLM", icon: Brain, color: "text-blue-300" },
  { name: "LangGraph", icon: GitBranch, color: "text-violet-400" },
  { name: "Dispatch", icon: Phone, color: "text-red-400" },
];

const TechnologyStack = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-24">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
          >
            <Zap className="w-3 h-3" />
            <span>Production Backend Stack</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-foreground mb-4"
          >
            Technology <span className="text-primary">Stack</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed"
          >
            The Python-based frameworks, models, and services that power Sentinel AI's core detection-to-dispatch pipeline.
          </motion.p>
        </section>

        {/* Pipeline Flow Badge */}
        <section className="container mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-6">
              <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">Detection Pipeline</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {pipelineFlow.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border ${item.color}`}>
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                  {i < pipelineFlow.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Tech Categories */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-20 max-w-6xl mx-auto"
            >
              {techCategories.map((category, catIndex) => (
                <motion.div key={catIndex} variants={itemVariants}>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-foreground mb-2">{category.title}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {category.items.map((item, itemIndex) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={itemIndex}
                          variants={itemVariants}
                          whileHover={{ y: -6, transition: { duration: 0.3 } }}
                          className="bg-background border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
                        >
                           <div className={`w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4`}>
                            <Icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <h3 className="text-base font-bold text-foreground mb-1.5">{item.name}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Architecture Summary */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="gradient-card rounded-2xl border border-primary/20 p-8 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Full Pipeline Flow</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Video upload triggers a motion-gated pipeline: frames with sufficient motion pass to <strong className="text-foreground">YOLO11m</strong> for object detection. 
                    If an interest class (person, vehicle, weapon) is detected, the frame enters a <strong className="text-foreground">per-camera escalation state machine</strong> 
                    (IDLE &rarr; SUSPICIOUS &rarr; CONFIRMING &rarr; ALERT &rarr; COOLDOWN). Confirmed incidents are sent to the <strong className="text-foreground">Gemini 3.5 Flash</strong> vision LLM 
                    (with Groq fallback) for bilingual Urdu/English description, then to the <strong className="text-foreground">LangGraph agent</strong> which decides on 
                    <strong className="text-foreground"> Asterisk SIP dispatch</strong> calls to police, ambulance, or fire services with TTS-generated voice alerts.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default TechnologyStack;