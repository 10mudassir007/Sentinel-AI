import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedGrid from "./AnimatedGrid";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <AnimatedGrid />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary/50 mb-8 opacity-0 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium">Production-Ready AI Infrastructure</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 opacity-0 animate-fade-in-up stagger-1">
            <span className="text-foreground">AI That Detects Emergencies</span>
            <br />
            <span className="text-gradient-primary">Before Humans Can</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up stagger-2">
            Analyze video footage, verify real-world incidents, and automatically alert emergency services. 
            Built for smart cities, security systems, and critical infrastructure.
          </p>
          
          {/* CTAs */}
          
          {/* Stats */}
          
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
