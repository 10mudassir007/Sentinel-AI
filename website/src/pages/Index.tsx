import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { ArrowRight, FlaskConical, Eye, Brain, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />

        {/* Quick Demo CTA Section */}
        <section className="py-24 relative bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
              >
                <FlaskConical className="w-3 h-3" />
                <span>Try It Yourself</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Test the Detection Pipeline
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Upload a video to the Sentinel AI demo and watch the YOLO11m + LangChain pipeline
                classify incidents, assess severity, and generate a dispatch decision in real time.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
                {[
                  { icon: Eye, label: "YOLO11m Detection", desc: "Object detection at conf ≥ 0.25" },
                  { icon: Brain, label: "LangChain Reasoning", desc: "Context-aware severity assessment" },
                  { icon: Phone, label: "Dispatch Decision", desc: "Authority alert with evidence" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-background border border-border"
                  >
                    <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild size="lg" className="glow-primary gap-2">
                  <a href="/demo">
                    Open Demo Page
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;