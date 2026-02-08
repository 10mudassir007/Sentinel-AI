import React from "react";
import { Brain, Upload, Shield, Zap, CheckCircle, ArrowRight, Eye, MapPin, Clock } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TechnologyStack = () => {
 const stackItems = [
  { name: "Python", icon: Brain },
  { name: "YOLO", icon: Eye },
  { name: "Groq", icon: Zap },
  { name: "OpenCV", icon: CheckCircle },
  { name: "LangChain", icon: Zap },
  
];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background pt-24">
        <section className="container mx-auto px-4 py-24 text-center">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Technology Stack
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
              The frameworks and tools that power Sentinel AI’s core video analysis and AI pipeline.
            </p>
          </motion.div>

          {/* Grid */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10 max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stackItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-secondary/20 border border-border shadow-md hover:shadow-lg transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-sm md:text-base font-semibold text-foreground text-center">
                    {item.name}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default TechnologyStack;
