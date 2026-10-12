import { Fragment } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { ArrowRight, FlaskConical, Eye, Brain, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MagicCard } from "@/components/ui/magic-card";
import { ShineBorder } from "@/components/ui/shine-border";

const pipelineSteps = [
  {
    num: "01",
    chip: "conf ≥ 0.25",
    icon: Eye,
    title: "YOLO11m Detection",
    desc: "Real-time object detection runs on every incoming frame with a confidence gate on interest classes.",
  },
  {
    num: "02",
    chip: "Severity",
    icon: Brain,
    title: "LangChain Reasoning",
    desc: "A vision LLM describes the scene and assesses incident severity with bilingual context awareness.",
  },
  {
    num: "03",
    chip: "Asterisk SIP",
    icon: Phone,
    title: "Dispatch Decision",
    desc: "A confirmed incident triggers an authority alert with evidence, location, and TTS voice call.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />

        {/* Detection Pipeline Section */}
        <section id="pipeline" className="relative scroll-mt-20 overflow-hidden pt-20 pb-28">
          {/* Soft glow + fine grid backdrop — masked to fade in from the page
              background so the hero hands off without a hard top edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 35%)",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 35%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, hsl(199 89% 48% / 0.04) 1px, transparent 1px), linear-gradient(to bottom, hsl(199 89% 48% / 0.04) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
                WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 25%, transparent 75%)",
                maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 25%, transparent 75%)",
              }}
            />
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                <ShineBorder
                  shineColor={["hsl(199 89% 48%)", "hsl(199 89% 72%)"]}
                  duration={7}
                  className="rounded-full"
                />
                <FlaskConical className="relative z-10 h-3 w-3" />
                <span className="relative z-10">Try It Yourself</span>
              </motion.div>

              <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
                Test the Detection Pipeline
              </h2>
              <p className="mx-auto mb-12 max-w-2xl leading-relaxed text-muted-foreground">
                Upload a video to the Sentinel AI demo and watch the YOLO11m + LangChain pipeline
                classify incidents, assess severity, and generate a dispatch decision in real time.
              </p>
            </motion.div>

            <div className="mx-auto flex max-w-4xl flex-col items-stretch gap-6 sm:flex-row">
              {pipelineSteps.map((step, i) => (
                <Fragment key={step.num}>
                  {i > 0 && (
                    <ArrowRight className="-mx-1 hidden h-5 w-5 shrink-0 self-center text-primary/40 sm:block" />
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="flex-1"
                  >
                    <MagicCard className="h-full rounded-2xl" gradientSize={200}>
                      <div className="h-full rounded-2xl p-6 text-left">
                        <div className="mb-5 flex items-center justify-between">
                          <span className="font-mono text-xs tracking-widest text-primary">
                            {step.num}
                          </span>
                          <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary/80">
                            {step.chip}
                          </span>
                        </div>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-primary/10">
                          <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold text-foreground">{step.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                      </div>
                    </MagicCard>
                  </motion.div>
                </Fragment>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.35 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-12 flex justify-center"
            >
              <Button asChild size="lg" className="glow-primary rounded-full gap-2">
                <a href="/demo">
                  Open Demo Page
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
