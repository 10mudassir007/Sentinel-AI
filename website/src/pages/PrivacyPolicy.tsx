import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, Trash2, UserCheck, Globe, AlertTriangle, Video, FileText } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Lock className="w-3 h-3" />
            <span>Your Privacy Matters</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
            Privacy &amp; <span className="text-primary">Data</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            Sentinel AI is committed to transparency about how data is captured, processed, and protected in our incident detection system.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Last updated: September 2026
          </p>
        </section>

        {/* Prototype / Hackathon Disclaimer */}
        <section className="container mx-auto px-4 pb-8">
          <div className="max-w-4xl mx-auto p-6 rounded-xl border border-warning/40 bg-warning/5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">Prototype / Hackathon Notice</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sentinel AI is a prototype/hackathon project. The data handling policies described on this page are 
                  <span className="text-foreground font-medium"> illustrative and not production-grade</span>. 
                  They serve as a reference for the intended privacy and security posture of the system. 
                  A formal compliance review (including GDPR, CCPA, and jurisdictional assessments) would be required 
                  before any real-world deployment. These policies may change significantly as the project evolves.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-12">

            {/* Section 1 - What Data Is Captured */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">1. What Data Is Captured</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>When Sentinel AI is used to record or analyze a potential incident, the following data is collected and processed:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <span className="text-foreground font-medium">CNIC &amp; Account Type:</span> The CNIC number used to log in, stored only as an Argon2id hash (never plaintext). The system detects whether the account is a normal citizen reporter or an authoritative user (police, ambulance, fire brigade) to determine who receives alerts.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Incident Video:</span> Footage recorded in real-time by the mobile app's camera or a CCTV feed, transmitted to the backend in 5-second chunks. Uploads are validated (file extension + magic-byte check) and capped at 15 seconds / 200 MB. No continuous background recording occurs.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Metadata:</span> Incident timestamp, GPS latitude/longitude, camera identifier, and language preference (English/Urdu). Coordinates are reverse-geocoded into a readable place name (e.g. via OpenStreetMap Nominatim) so responders know where to go.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Detection &amp; Dispatch Logs:</span> Object detections (label, confidence, bounding box), escalation state transitions, the AI's bilingual classification, and dispatch records — which authority was notified, the destination number, and the call status.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Generated Voice Alerts:</span> Text-to-speech audio (WAV) produced for automated emergency calls, kept for retrieval by authorized users.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Website Demo Uploads:</span> Videos uploaded through this website's Demo page are sent to the Sentinel AI backend and analyzed by the same pipeline. If the backend is unreachable, the page displays locally generated sample output and nothing leaves your browser. The website itself uses no tracking cookies or analytics.
                      </li>
                    </ul>
                    <p className="mt-2">
                      The system is designed to <span className="text-foreground font-medium">only capture and process data when an incident trigger occurs</span> — a motion gate filters static footage, and frames are escalated to AI analysis only when relevant objects are detected. There is no continuous background recording or surveillance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Why Data Is Captured */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">2. Why Data Is Captured</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>Captured data serves a single mission-critical purpose:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <span className="text-foreground font-medium">Incident Detection &amp; Verification:</span> Video chunks pass through a motion gate, the YOLO11m object detector, and a vision LLM that describes and classifies the scene — confirming whether a real incident occurred before anything is escalated.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Faster Authority Notification:</span> Confirmed incidents alert authoritative users in-app (with evidence, GPS location, and classification) and trigger automated emergency calls via the telephony system, so responders can assess the situation before arriving.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Fraud Prevention:</span> Every report is tied to a CNIC-verified identity, preventing anonymous or fabricated detections from consuming emergency resources.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Bilingual Response:</span> Classifications and voice alerts are produced in English and Urdu so both reporters and authorities can understand the situation.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 - Retention */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">3. Data Retention</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Data is retained only as long as the prototype requires it, as follows:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <span className="text-foreground font-medium">Uploaded Videos:</span> Temporary files are written to disk only for the duration of analysis and are <span className="text-foreground font-medium">deleted immediately after processing</span> — whether or not an incident was found. Raw footage is not stored.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Session Tokens:</span> Login tokens live only in server memory (as SHA-256 digests, never plaintext) and expire automatically after 24 hours. Sessions are also capped to prevent unbounded growth.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Demo Incident Records:</span> For demonstration purposes, detected incidents are persisted to a simple JSON file (incidents.json) with classification, location, dispatch status, and timestamps. Records remain until the file is cleared.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Generated Voice Alerts:</span> TTS audio (WAV) used for dispatch calls is kept in a dedicated output directory and served only through the authenticated audio endpoint.
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground/70 mt-2 italic">
                      Note: In production, incident records would be stored in a proper SQL database (e.g. PostgreSQL) with a formal retention schedule aligned with jurisdictional regulations. The retention practices described here apply to the current prototype.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 - Access Control */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">4. Who Has Access</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Access to incident data is strictly limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li>
                        <span className="text-foreground font-medium">Authenticated Users Only:</span> Every backend endpoint — video analysis, incident records, and audio retrieval — requires a valid bearer token obtained via CNIC login. There is no anonymous access.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">Authorized Responders:</span> Verified authoritative users (police, ambulance, fire brigade) receive in-app alerts containing the incident type, GPS location, and evidence clip for incidents relevant to them, alongside automated emergency calls.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">System Operators:</span> The admin dashboard aggregates incident records for tracking and response management. Access is role-based and requires the same authenticated session.
                      </li>
                      <li>
                        <span className="text-foreground font-medium">No Public Access:</span> Incident footage, records, and audio are never made public or shared on any platform, social media, or public dashboard.
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground/70 mt-2 italic">
                      Note: This access control model is a placeholder design for the prototype. Production deployment requires a formal access control policy with identity verification, background checks, and compliance auditing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 - Facial Recognition & Data Selling */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">5. AI Processing, Facial Recognition &amp; Data Sharing</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p className="font-medium text-foreground">Third-Party AI Processing:</p>
                    <p>
                      To classify incidents, <span className="text-foreground font-medium">downscaled frames from confirmed footage are sent to external AI services</span>: Google's Gemini 3.5 Flash vision model (primary) and Groq (automatic fallback). Text-to-speech for dispatch calls uses Edge-TTS or ElevenLabs, and reverse geocoding uses OpenStreetMap's Nominatim. Only the minimum data needed for each step (a downscaled frame, a location string, an alert script) is shared with these providers.
                    </p>
                    <p className="font-medium text-foreground">Facial Recognition Policy:</p>
                    <p>
                      Sentinel AI does <span className="text-foreground font-medium">not perform facial recognition</span> for identification purposes. Our detection models classify objects and events (e.g., "vehicle collision," "person falling," "fire/smoke") — they do not identify, track, or profile individuals. Any face or person detected in footage is treated as an anonymous subject within the scene, not as an identifiable individual.
                    </p>
                    <p className="font-medium text-foreground mt-3">No Third-Party Data Selling:</p>
                    <p>
                      Sentinel AI <span className="text-foreground font-medium">does not sell, rent, or trade</span> any user data, incident footage, or metadata to third parties. Data is only shared with authorized emergency services for incident response and with the AI/cloud providers listed above, each bound by their own data-processing terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 - Data Security */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">6. Data Security Measures</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      We implement appropriate technical safeguards to protect incident data:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Credential Security:</span> CNIC credentials are verified against Argon2id hashes — plaintext is never stored. Bearer tokens are stored in memory only as SHA-256 digests, expire after 24 hours, and are capped in number to prevent session exhaustion.</li>
                      <li><span className="text-foreground font-medium">Upload Validation:</span> Every upload is checked with extension allow-lists and magic-byte inspection before any processing, with hard size (200 MB) and duration (15 s) limits enforced.</li>
                      <li><span className="text-foreground font-medium">Request Rate Limiting:</span> Per-IP request limits throttle abusive traffic to the API.</li>
                      <li><span className="text-foreground font-medium">Transient Data Handling:</span> Uploaded videos exist only as temporary files deleted immediately after analysis; the audio endpoint guards against path traversal so only generated files can be retrieved.</li>
                      <li><span className="text-foreground font-medium">Encryption in Transit:</span> All data transmitted between the mobile app, backend API, and dashboard is encrypted using TLS/SSL protocols.</li>
                      <li><span className="text-foreground font-medium">Access Logging:</span> Incident records are written to the store with timestamps and dispatch outcomes for auditability.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7 - Your Rights */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">7. Your Rights &amp; Choices</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>As a user of the Sentinel AI prototype, you retain the following rights:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Access:</span> Request a summary of what data has been captured and processed in connection with your use of the system.</li>
                      <li><span className="text-foreground font-medium">Deletion:</span> Request deletion of your incident footage and associated metadata, subject to any ongoing legal or evidentiary holds.</li>
                      <li><span className="text-foreground font-medium">Opt-Out:</span> Choose not to use the mobile app's passive monitoring feature and only trigger manual uploads.</li>
                      <li><span className="text-foreground font-medium">Inquiry:</span> Contact the project team with questions about data handling at any time.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 8 - Contact */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">8. Contact &amp; Project Information</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Sentinel AI is an open-source prototype project. If you have questions, concerns, or requests regarding this Privacy &amp; Data page or the project's data practices, please reach out:
                    </p>
                    <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-foreground font-medium">Sentinel AI Project Team</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Email: <a href="mailto:muddassir032@gmail.com" className="text-primary hover:underline">muddassir032@gmail.com</a>
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        GitHub: <a href="https://github.com/10mudassir007/Sentinel-AI" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com/10mudassir007/Sentinel-AI</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Updates Notice */}
            <div className="text-center text-xs text-muted-foreground/60 pt-8 border-t border-border">
              <p>This privacy &amp; data page applies to the Sentinel AI prototype and is subject to revision as the project evolves. For any concerns, contact the project team directly.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;