import React from "react";
import { 
  Upload, 
  Brain, 
  Shield, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  Video,
  Zap,
  ArrowRight,
  Eye,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Witness Uploads Video",
      description: "A bystander captures an emergency on their phone and uploads it through our platform—no account required, just action.",
      details: [
        "Drag-and-drop interface",
        "Mobile-optimized upload",
        "Location auto-detection",
        "Anonymous submission option"
      ],
      color: "text-blue-400",
      bgColor: "bg-blue-400/10"
    },
    {
      number: "02",
      icon: Brain,
      title: "AI Analysis Begins",
      description: "Our Vision LLM processes the footage in real-time, identifying incident type, severity, and key details.",
      details: [
        "Computer vision detection",
        "Scene understanding",
        "Threat level assessment",
        "Multi-frame analysis"
      ],
      color: "text-purple-400",
      bgColor: "bg-purple-400/10"
    },
    {
      number: "03",
      icon: Shield,
      title: "Verification & Classification",
      description: "Advanced algorithms verify authenticity and classify the emergency—Fire, Medical, or Police response needed.",
      details: [
        "Deep fake detection",
        "Incident categorization",
        "Priority scoring",
        "False alarm filtering"
      ],
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      number: "04",
      icon: Bell,
      title: "Instant Alert Dispatch",
      description: "Verified incidents are immediately routed to the appropriate emergency services with visual evidence and location data.",
      details: [
        "Multi-channel notification",
        "GPS coordinates included",
        "Video evidence attached",
        "Real-time status updates"
      ],
      color: "text-red-400",
      bgColor: "bg-red-400/10"
    }
  ];

  const techFeatures = [
    {
      icon: Eye,
      title: "Vision AI Processing",
      description: "Advanced computer vision models analyze every frame to detect fires, injuries, weapons, and other emergency indicators."
    },
    {
      icon: MapPin,
      title: "Geospatial Intelligence",
      description: "Automatic location extraction and mapping to route incidents to the nearest responding units."
    },
    {
      icon: Clock,
      title: "Sub-30 Second Analysis",
      description: "From upload to alert in under 30 seconds—faster than a traditional 911 call and with more context."
    },
    {
      icon: Shield,
      title: "Privacy-First Design",
      description: "End-to-end encryption, automatic face blurring, and data retention policies that protect witnesses."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
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
            <span>Real-Time Emergency Intelligence</span>
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
            From the moment a video is uploaded to the instant emergency services receive an alert—here's the technology that makes it possible.
          </motion.p>
        </section>

        {/* Process Flow */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold mb-4">The 4-Step Process</h2>
              <p className="text-muted-foreground">Every second counts in an emergency. Our system is built for speed and accuracy.</p>
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
                    {/* Icon Section */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className="flex flex-col items-center md:items-start"
                    >
                      <div className={`relative w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-3`}>
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
                      whileHover={{ scale: 1.02 }}
                      className="bg-background border border-border rounded-2xl p-8 shadow-lg"
                    >
                      <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-6">{step.description}</p>
                      
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid sm:grid-cols-2 gap-3"
                      >
                        {step.details.map((detail, i) => (
                          <motion.div
                            key={i}
                            variants={itemVariants}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
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

        {/* Technical Features */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Powered by Cutting-Edge Technology</h2>
            <p className="text-muted-foreground">The AI backbone that makes instant emergency response possible.</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {techFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="space-y-4 p-6 rounded-xl bg-secondary/30 border border-border hover:border-primary/30 transition-all"
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Example Scenario */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-bold mb-4">Real-World Scenario</h2>
                <p className="text-muted-foreground">See how Sentinel AI transforms a typical emergency situation.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-background border border-border rounded-3xl p-8 md:p-12 space-y-8"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-400/10 flex items-center justify-center">
                    <Video className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">12:34:15 PM - Video Uploaded</h4>
                    <p className="text-sm text-muted-foreground">Witness films a multi-car accident on Highway 101 and uploads via mobile app.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex items-center gap-4 pl-5"
                >
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-400/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">12:34:28 PM - AI Analysis Complete</h4>
                    <p className="text-sm text-muted-foreground">System detects 3 damaged vehicles, no visible flames, potential injuries. Classifies as "Medical + Police" priority response.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex items-center gap-4 pl-5"
                >
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">12:34:35 PM - Emergency Services Notified</h4>
                    <p className="text-sm text-muted-foreground">Local EMS and Highway Patrol receive alert with video evidence, exact GPS coordinates, and AI-generated incident summary.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <p className="text-sm font-medium text-center">
                    <span className="text-primary">Total Response Time: 20 seconds</span> — Compare that to a traditional 911 call that averages 2-5 minutes.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Safety & Privacy */}
        <section className="container mx-auto px-4 py-24">
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
              <AlertTriangle className="w-12 h-12 text-primary mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Built with Safety & Privacy in Mind</h2>
            <p className="text-muted-foreground mb-8">
              We understand the sensitivity of emergency footage. All uploads are encrypted, faces are automatically blurred, and data is only shared with verified emergency personnel. Witnesses maintain full control over their submissions.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" className="gap-2">
                <a href="/privacy-policy"> Read Our Privacy Policy </a>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="gradient-card p-12 rounded-3xl text-center max-w-4xl mx-auto border border-primary/20 bg-primary/5"
          >
            <h2 className="text-3xl font-bold mb-6">Ready to See It in Action?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Experience the future of emergency response. Request a demo or explore our technical documentation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="glow-primary">
                  <a target="_blank" href="mailto:muddassir032@gmail.com">Request Demo</a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline">
                  <a target="_blank" href="https://github.com/10mudassir007/Sentinel-AI?tab=readme-ov-file#sentinel-ai">View Documentation</a>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default HowItWorks;