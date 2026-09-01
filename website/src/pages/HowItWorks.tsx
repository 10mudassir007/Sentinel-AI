import {
  Smartphone,
  Camera,
  Brain,
  Bell,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Eye,
  Fingerprint,
  Video,
  Server,
  GitBranch,
  FileVideo,
  Network,
  Route,
  Activity,
  Languages,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: Fingerprint,
      title: "CNIC Authentication",
      subtitle: "Login & User Type Detection",
      description:
        "Users log in to the Sentinel AI app with their CNIC (Computerized National Identity Card) number. The backend verifies credentials against an Argon2id-hashed database and issues a secure bearer token — tying every report to a verified identity to prevent fraudulent detections. Based on the account, the system detects the user type: a normal citizen reporter, or an authoritative user (police, ambulance, or fire brigade responder).",
      details: [
        "CNIC-based login with Argon2id password hashing",
        "CNIC-verified identity prevents fraudulent detections",
        "Role detection: citizen / police / ambulance / fire brigade",
        "24-hour bearer token session issued by FastAPI backend",
      ],
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20",
    },
    {
      number: "02",
      icon: Video,
      title: "Live Incident Recording",
      subtitle: "Mobile App or CCTV Camera",
      description:
        "A citizen or CCTV camera records the incident in real-time through the mobile app. The system works identically for both sources — a phone camera actively recording a scene, or a fixed CCTV feed streaming into the pipeline. For demonstration purposes, users can also upload a pre-recorded video manually to showcase the detection capabilities.",
      details: [
        "Real-time recording via mobile app camera",
        "Full support for CCTV camera feeds",
        "Manual video upload mode for product demos",
        "GPS coordinates + device ID attached to every capture",
      ],
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400/20",
    },
    {
      number: "03",
      icon: Network,
      title: "Chunked Upload (5-Second Segments)",
      subtitle: "Streaming Video to Backend",
      description:
        "The incident video is not uploaded as one large file — it is split into 5-second chunks and streamed to the Sentinel AI backend (FastAPI). Each chunk is validated for file type (extension + magic-byte check) and duration before entering a per-source async processing queue, which serializes analysis for each camera or device to prevent overload.",
      details: [
        "Video split into 5-second chunks for streaming",
        "Chunk validation: extension + magic-byte checks",
        "Per-source async queue (serialized per camera/device)",
        "Secure upload via FastAPI multipart endpoint",
      ],
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20",
    },
    {
      number: "04",
      icon: Eye,
      title: "Motion Gate & YOLO11m Detection",
      subtitle: "Backend Frame Analysis",
      description:
        "The backend processes each chunk: a motion gate (frame differencing with Gaussian blur and adaptive thresholding) filters out static frames, then the YOLO11m model detects interest classes (person, vehicle, weapon) at a confidence threshold of 0.25. A per-camera escalation state machine (IDLE to SUSPICIOUS to CONFIRMING to ALERT to COOLDOWN) tracks whether a potential incident is developing.",
      details: [
        "Motion gate filters static frames (OpenCV frame differencing)",
        "YOLO11m detects interest classes at confidence >= 0.25",
        "Escalation state machine per camera source",
        "Confirmed detections flagged for AI reasoning",
      ],
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      borderColor: "border-amber-400/20",
    },
    {
      number: "05",
      icon: Brain,
      title: "AI Reasoning & Classification",
      subtitle: "Vision LLM + LangGraph Agent",
      description:
        "Confirmed frames are sent to the Gemini 3.5 Flash vision LLM (with Groq fallback), which describes the scene and classifies the incident in bilingual Urdu/English. The LangChain/LangGraph agent then evaluates the context, and if the incident is confirmed it automatically invokes the appropriate dispatch tool — call_ambulance, call_police, or call_firebrigade.",
      details: [
        "Gemini 3.5 Flash vision LLM describes scene (Groq fallback)",
        "Bilingual Urdu/English incident classification",
        "LangGraph agent with emergency dispatch tools",
        "Confidence + severity assessment before escalation",
      ],
      color: "text-indigo-400",
      bgColor: "bg-indigo-400/10",
      borderColor: "border-indigo-400/20",
    },
    {
      number: "06",
      icon: Bell,
      title: "Authority Notification",
      subtitle: "In-App Alerts & Automated Calls",
      description:
        "When an incident is confirmed, authoritative users (police, ambulance, fire brigade) are immediately informed through the Sentinel AI app with the incident type, GPS location, and evidence clip. Simultaneously, the backend places automated emergency calls via Asterisk AMI — ambulance (1122), police (15), fire (16) — with TTS-generated voice alerts in Urdu/English and reverse-geocoded location details.",
      details: [
        "Authoritative users alerted in-app with evidence + location",
        "Automated SIP calls via Asterisk AMI (1122 / 15 / 16)",
        "TTS voice alerts in Urdu/English (Edge-TTS / ElevenLabs)",
        "Reverse geocoded address via Nominatim",
      ],
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      borderColor: "border-red-400/20",
    },
    {
      number: "07",
      icon: BarChart3,
      title: "Logging & Response Tracking",
      subtitle: "Incident Store & Dashboard",
      description:
        "Every incident is persisted to the incident store with detection time, classification, confidence, dispatch status, and response timestamps. For demonstration purposes this data is stored in a simple JSON file; in production it would be stored in a proper database (SQL — see Under the Hood). The admin dashboard aggregates this data for tracking: which authority was notified, acknowledgment status, and resolution — providing measurable response metrics across the system.",
      details: [
        "Incident persisted with full audit trail",
        "Demo storage: simple JSON file (production: SQL database)",
        "Detection / notification / response timestamps logged",
        "Authority acknowledgment & resolution tracking",
      ],
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/20",
    },
  ];

  const detectionSources = [
    {
      icon: Smartphone,
      title: "Mobile App",
      description:
        "Citizens and responders record incidents in real-time using the Sentinel AI mobile app on their device camera. The app handles authentication, recording, chunked upload, and receiving authority alerts.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      icon: Camera,
      title: "CCTV Cameras",
      description:
        "The same pipeline works with CCTV camera feeds. Fixed cameras stream footage through the identical chunked upload path — motion gate, YOLO11m, and AI reasoning run exactly the same way.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
    },
    {
      icon: FileVideo,
      title: "Manual Upload (Demo)",
      description:
        "For demonstration purposes, a manual video upload option is available on the website and app. This is only for showcasing the detection pipeline; the uploaded video goes through the exact same backend processing.",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  const technicalDetails = [
    {
      icon: Network,
      title: "5-Second Chunking",
      description:
        "Incident video is transmitted in 5-second chunks rather than a single large file, enabling real-time streaming analysis and faster detection while reducing memory overhead on the backend.",
      color: "text-purple-400",
    },
    {
      icon: Activity,
      title: "Motion-Gated Analysis",
      description:
        "Frames only reach the AI models when motion is detected (frame differencing + adaptive thresholding). This filters out static surveillance footage and saves compute on the GPU.",
      color: "text-amber-400",
    },
    {
      icon: Route,
      title: "Escalation State Machine",
      description:
        "Each camera/device source runs its own state machine: IDLE, SUSPICIOUS, CONFIRMING, ALERT, COOLDOWN. Multiple confirmations are required before dispatch, reducing false positives.",
      color: "text-indigo-400",
    },
    {
      icon: GitBranch,
      title: "LangGraph Agent Tools",
      description:
        "The reasoning agent calls dedicated tools (call_ambulance, call_police, call_firebrigade) that trigger Asterisk AMI phone calls with TTS alerts — real automated dispatch, not just notifications.",
      color: "text-red-400",
    },
    {
      icon: Server,
      title: "FastAPI + Uvicorn",
      description:
        "All endpoints run on FastAPI with Uvicorn (port 8754), including auth, chunked upload, incident queries, and audio delivery. Rate limiting, upload size caps, and magic-byte validation secure every request.",
      color: "text-emerald-400",
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description:
        "CNIC credentials are verified against Argon2id hashes — plaintext is never stored. CNIC-verified login prevents fraudulent detections. Bearer tokens expire after 24 hours, and role-based access determines what each user can see or do.",
      color: "text-primary",
    },
    {
      icon: Languages,
      title: "English & Urdu Support",
      description:
        "The app UI is available in English and Urdu, and responses are generated in both languages — incident classifications are produced bilingually, and TTS voice alerts to authorities are spoken in Urdu or English (Edge-TTS / ElevenLabs).",
      color: "text-sky-400",
    },
    {
      icon: Database,
      title: "Incident Storage",
      description:
        "Demo builds store detected incident data in a simple JSON file. In production, a SQL database (e.g. PostgreSQL) would be used: incident records are structured and relational (incidents, users, authorities, response times), requiring ACID transactions and efficient analytics queries — a document store would not fit this relational model as well.",
      color: "text-green-400",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
          >
            <Zap className="w-3 h-3" />
            <span>End-to-End Incident Detection &amp; Response</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
          >
            How <span className="text-primary">Sentinel AI</span> Works
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed"
          >
            From CNIC login to automated authority dispatch — here is the complete working flow of the production system.
          </motion.p>
        </section>

        {/* Pipeline Overview - Horizontal badges */}
        <section className="container mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
          >
            {["Auth", "Record", "Chunk", "Detect", "Reason", "Notify", "Track"].map((label, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-xs text-muted-foreground font-mono"
              >
                <span className="text-primary">{String(i + 1).padStart(2, "0")}</span> {label}
              </div>
            ))}
          </motion.div>
        </section>

        {/* Step-by-Step Pipeline */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">The Working Flow</h2>
              <p className="text-muted-foreground">Every stage of the pipeline, from user login to authority response tracking.</p>
            </motion.div>

            <div className="space-y-12 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={stepVariants}
                  className="relative"
                >
                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="hidden md:block absolute left-8 top-24 w-0.5 h-24 bg-gradient-to-b from-primary/50 to-transparent origin-top"
                    />
                  )}

                  <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                    {/* Step Number & Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className="flex flex-col items-center md:items-start"
                    >
                      <div
                        className={`relative w-16 h-16 rounded-2xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center mb-3`}
                      >
                        <step.icon className={`w-8 h-8 ${step.color}`} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{step.number}</span>
                    </motion.div>

                    {/* Content Section */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-background border border-border rounded-2xl p-8 shadow-lg"
                    >
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${step.bgColor} ${step.color} mb-2 inline-block`}>
                        {step.subtitle}
                      </span>
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">{step.description}</p>

                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid sm:grid-cols-2 gap-3"
                      >
                        {step.details.map((detail, i) => (
                          <motion.div key={i} variants={itemVariants} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{detail}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detection Sources */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Three Ways to Capture an Incident</h2>
            <p className="text-muted-foreground">The pipeline is source-agnostic — detection works the same way regardless of where the footage comes from.</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {detectionSources.map((source, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="space-y-4 p-6 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-all shadow-lg"
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`w-12 h-12 rounded-lg ${source.bgColor} flex items-center justify-center`}
                >
                  <source.icon className={`w-6 h-6 ${source.color}`} />
                </motion.div>
                <h3 className="text-lg font-bold">{source.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{source.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Technical Details */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">Under the Hood</h2>
              <p className="text-muted-foreground">Technical implementation details of the Sentinel AI backend.</p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            >
              {technicalDetails.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="space-y-4 p-6 rounded-xl bg-background border border-border hover:border-primary/30 transition-all shadow-lg"
                >
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    whileInView={{ rotate: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </motion.div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Demo & App Note */}
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
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Try It Without the App</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Core detection and reporting happens via the <span className="text-foreground font-medium">Sentinel AI mobile app</span> and CCTV feeds.
                    This website also provides a <a href="/demo" className="text-primary hover:underline">Demo page</a> where you can upload
                    a video manually to test the detection pipeline — the exact same YOLO11m + LangChain backend processes your upload.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Safety & Privacy */}
        <section className="container mx-auto px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Built with Safety &amp; Privacy in Mind</h2>
            <p className="text-muted-foreground mb-8">
              All incident footage is encrypted in transit and at rest. Data is only shared with verified emergency personnel.
              No facial recognition, no third-party data selling, and no continuous surveillance.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="gap-2" asChild>
                <a href="/privacy-policy">
                  Read Our Privacy &amp; Data Policy
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default HowItWorks;