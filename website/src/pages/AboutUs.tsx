import React from "react";
import { Shield, Target, Eye, Users, Video, Bell, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
        >
          <Zap className="w-3 h-3" />
          <span>Bridging the Response Gap</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
        >
          From Recording to <span className="text-primary">Responding</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed"
        >
          In moments of crisis—fire, accidents, or robberies—most people reach for their phones to record. 
          <span className="text-foreground font-medium"> Sentinel AI</span> turns those recordings into immediate, verified lifelines for emergency services.
        </motion.p>
      </section>

      {/* The Problem & Solution Section */}
      <section className="py-24 bg-secondary/30 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-4">The Challenge</h2>
                <p className="text-muted-foreground">
                  When disaster strikes, information is often trapped in a witness's camera roll while emergency dispatchers remain in the dark. Valuable minutes are lost as incidents go viral before they are reported.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  The Sentinel Breakthrough
                </h3>
                <p className="text-muted-foreground">
                  Our platform provides a direct pipeline from the scene to the authorities. By uploading a video, our AI instantly verifies the threat level and notifies the relevant emergency services—Fire, Police, or Medical—with precise situational data.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <h4 className="font-bold text-primary text-2xl">Verified</h4>
                  <p className="text-xs text-muted-foreground">Real-time incident validation</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border">
                  <h4 className="font-bold text-primary text-2xl">Automated</h4>
                  <p className="text-xs text-muted-foreground">Instant authority notification</p>
                </div>
              </div>
            </motion.div>

            {/* Visual Workflow Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <div className="relative space-y-4">
                {[
                  { icon: Video, label: "Witness Records Incident", color: "text-blue-400" },
                  { icon: Shield, label: "AI Analyzes & Verifies", color: "text-primary" },
                  { icon: Bell, label: "Authorities Notified", color: "text-red-400" },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.15 }}
                    className="flex items-center gap-4 p-4 bg-background border border-border rounded-2xl shadow-xl"
                  >
                    <div className={`h-12 w-12 rounded-lg bg-secondary flex items-center justify-center ${step.color}`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className="font-semibold">{step.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Icons */}
      <section className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">A Breakthrough in Safety</h2>
          <p className="text-muted-foreground">Revolutionizing how emergencies are reported in the digital age.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Smart Intake</h3>
            <p className="text-sm text-muted-foreground">People are already filming. We give that footage a purpose by using it as a high-fidelity data source for dispatchers.</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Zero-Noise Verification</h3>
            <p className="text-sm text-muted-foreground">Our Vision LLMs filter out false alarms, ensuring authorities only receive high-priority, confirmed emergency alerts.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Faster Response</h3>
            <p className="text-sm text-muted-foreground">By eliminating the delay of manual calls and verbal descriptions, we provide visual context that saves lives.</p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="gradient-card p-12 rounded-3xl text-center max-w-4xl mx-auto border border-primary/20 bg-primary/5"
        >
          <h2 className="text-3xl font-bold mb-6">Let's make the world safer together.</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Sentinel AI is designed to turn the digital bystander into a hero. Join us in building the next generation of emergency infrastructure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="glow-primary" asChild>
              <a target="_blank" href="mailto:muddassir032@gmail.com">Contact Us</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/tech-stack">Technical Overview</a>
            </Button>
          </div>
        </motion.div>
      </section>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;