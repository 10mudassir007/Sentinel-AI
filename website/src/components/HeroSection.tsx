import { Ambulance, ArrowRight, Flame, Play, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DotGrid } from "@/components/ui/dot-grid";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShineBorder } from "@/components/ui/shine-border";
import BlurText from "@/components/ui/blur-text";
import MonitoringPanel from "@/components/MonitoringPanel";

const dispatch = [
  { value: 1122, label: "Ambulance", icon: Ambulance },
  { value: 15, label: "Police", icon: Shield },
  { value: 16, label: "Fire Brigade", icon: Flame },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Interactive dot-grid background (ReactBits) — fades out at the bottom edge
          so the hero blends into the pipeline section without a hard seam */}
      <div
        className="absolute inset-0 z-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
        }}
      >
        <DotGrid
          dotSize={2}
          gap={26}
          baseColor="#2b3d4a"
          activeColor="#38bdf8"
          proximity={150}
          strength={0.5}
          bounce={0.5}
          tension={0.32}
          returnDuration={0.8}
          shockRadius={320}
          shockStrength={5}
          swell={0.6}
          stretch={0.45}
          glow={0.45}
          shape="circle"
          fade={0.5}
          opacity={0.6}
          intro
          mouseInteraction
          clickShock={false}
        />
      </div>

      {/* Soft central glow to keep focus on the headline */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.10),transparent_55%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — messaging, CTAs, dispatch stats */}
          <div className="text-center">
          {/* Badge */}
          <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary/50 mb-8 opacity-0 animate-fade-in-up">
            <ShineBorder
              shineColor={["hsl(199 89% 48%)", "hsl(199 89% 72%)"]}
              duration={6}
              borderWidth={1}
              className="rounded-full"
            />
            <span className="relative z-10 w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="relative z-10 text-xs text-muted-foreground font-medium">
              Production-Ready AI Infrastructure
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <BlurText
              text="AI That Detects Emergencies"
              animateBy="words"
              direction="top"
              delay={120}
              className="justify-center text-foreground"
            />
            <span className="block mt-1">
              <AnimatedGradientText
                speed={1.2}
                colorFrom="hsl(199 89% 55%)"
                colorTo="hsl(199 89% 80%)"
              >
                Before Humans Can
              </AnimatedGradientText>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up stagger-2">
            Analyze video footage, verify real-world incidents, and automatically alert emergency services.
            Built for smart cities, security systems, and critical infrastructure.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 opacity-0 animate-fade-in-up stagger-3">
            <Link to="/demo">
              <ShimmerButton
                background="hsl(199 89% 44%)"
                shimmerColor="#ffffff"
                borderRadius="0.5rem"
                className="h-11 gap-2 px-8 text-sm font-medium"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Try Live Demo
                </span>
              </ShimmerButton>
            </Link>
            <Link to="/use-cases">
              <Button size="lg" variant="outline" className="gap-2">
                <ArrowRight className="w-4 h-4" />
                Explore Use Cases
              </Button>
            </Link>
          </div>

          {/* Emergency dispatch numbers */}
          <div className="mx-auto grid max-w-xs grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-3 sm:gap-5 opacity-0 animate-fade-in-up stagger-4">
            {dispatch.map((item) => (
              <div
                key={item.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-secondary/40 px-3 py-4 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_0_28px_hsl(199_89%_48%/0.14)]"
              >
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <NumberTicker
                  value={item.value}
                  className="text-2xl sm:text-3xl font-bold text-primary"
                />
                <p className="mt-1 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          </div>

          {/* Right — simulated monitoring feed */}
          <div className="mx-auto w-full max-w-xl lg:max-w-none">
            <MonitoringPanel />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
