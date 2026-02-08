import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, Server, Trash2, UserCheck, Globe, Mail } from "lucide-react";

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
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            Sentinel AI is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our platform.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Last updated: February 8, 2026
          </p>
        </section>

        {/* Policy Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Section 1 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">1. Information We Collect</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>When you use Sentinel AI, we may collect the following types of information:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Video Footage:</span> Videos uploaded for incident analysis. These are processed by our AI models for threat detection and verification.</li>
                      <li><span className="text-foreground font-medium">Usage Data:</span> Anonymous analytics about how you interact with the platform, including pages visited and features used.</li>
                      <li><span className="text-foreground font-medium">Device Information:</span> Browser type, operating system, and device identifiers used for compatibility and security purposes.</li>
                      <li><span className="text-foreground font-medium">Contact Information:</span> If you reach out to us, we may collect your name, email address, and any details you provide.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Server className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">2. How We Use Your Information</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>We use the information we collect for the following purposes:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Incident Analysis:</span> To process uploaded video footage, detect incidents, and generate emergency alerts for relevant authorities.</li>
                      <li><span className="text-foreground font-medium">Platform Improvement:</span> To understand usage patterns and improve the performance, reliability, and features of Sentinel AI.</li>
                      <li><span className="text-foreground font-medium">Communication:</span> To respond to your inquiries, provide support, and send important service updates.</li>
                      <li><span className="text-foreground font-medium">Security:</span> To detect and prevent fraud, abuse, and unauthorized access to our systems.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">3. Data Retention & Deletion</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Uploaded video footage is processed in real-time and is <span className="text-foreground font-medium">not stored permanently</span> on our servers. Videos are automatically purged after analysis is complete unless required for an active emergency investigation.
                    </p>
                    <p>
                      Anonymous usage analytics may be retained for up to 12 months for platform improvement. You may request deletion of any personal data by contacting us directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">4. Data Security</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      We implement industry-standard security measures to protect your data, including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Encryption in Transit:</span> All data transmitted between your device and our servers is encrypted using TLS/SSL protocols.</li>
                      <li><span className="text-foreground font-medium">Access Controls:</span> Strict access controls ensure that only authorized personnel can access sensitive data.</li>
                      <li><span className="text-foreground font-medium">Infrastructure Security:</span> Our servers are hosted on secure, audited cloud infrastructure with continuous monitoring.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">5. Third-Party Sharing</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      Sentinel AI does <span className="text-foreground font-medium">not sell, rent, or trade</span> your personal information to third parties. We may share data only in the following circumstances:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Emergency Services:</span> Verified incident data may be shared with relevant emergency authorities (Fire, Police, Medical) to facilitate rapid response.</li>
                      <li><span className="text-foreground font-medium">Legal Requirements:</span> We may disclose information if required by law, regulation, or legal process.</li>
                      <li><span className="text-foreground font-medium">Service Providers:</span> Trusted third-party services (e.g., cloud hosting, AI model providers) that help us operate the platform, bound by strict data-processing agreements.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">6. Your Rights</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>You have the following rights regarding your personal data:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                      <li><span className="text-foreground font-medium">Access:</span> Request a copy of the personal data we hold about you.</li>
                      <li><span className="text-foreground font-medium">Correction:</span> Request correction of any inaccurate or incomplete data.</li>
                      <li><span className="text-foreground font-medium">Deletion:</span> Request deletion of your personal data, subject to legal or operational requirements.</li>
                      <li><span className="text-foreground font-medium">Opt-Out:</span> Opt out of non-essential data collection and analytics at any time.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7 */}
            <div className="gradient-card rounded-xl border border-border p-8 bg-background/50 backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">7. Contact Us</h2>
                  <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                    <p>
                      If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
                    </p>
                    <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-foreground font-medium">Sentinel AI Team</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Email: <a href="mailto:privacy@sentinel-ai.dev" className="text-primary hover:underline">privacy@sentinel-ai.dev</a>
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
              <p>This privacy policy may be updated periodically. We will notify users of significant changes through our platform. Continued use of Sentinel AI after changes constitutes acceptance of the updated policy.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
