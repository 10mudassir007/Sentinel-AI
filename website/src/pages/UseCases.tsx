import { 
  User, 
  Truck, 
  Building2, 
  Landmark, 
  FileCheck,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { containerVariants, itemVariants } from "@/lib/utils";

const useCases = [
  {
    icon: User,
    title: "Personal Safety",
    description:
      "Individual users can leverage the Sentinel AI mobile app as a personal safety tool. In the event of an accident, medical emergency, or altercation, the app autonomously detects the incident, captures evidence, and notifies emergency services with precise location data — even if the user is unable to call for help.",
    benefits: [
      "Automatic incident detection without user action",
      "GPS-accurate location sharing with responders",
      "Works when the user cannot speak or dial",
    ],
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
  },
  {
    icon: Truck,
    title: "Fleet & Transport Monitoring",
    description:
      "Fleet operators can integrate Sentinel AI into vehicle camera systems for real-time collision detection, cargo theft alerting, and driver safety monitoring. Detected incidents are immediately reported with dashcam footage and telemetry data, enabling faster insurance claims and safety reviews.",
    benefits: [
      "Real-time collision and incident detection",
      "Dashcam footage auto-captured and classified",
      "Reduced claims processing time with verified evidence",
    ],
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  {
    icon: Building2,
    title: "Campus & Institutional Security",
    description:
      "Schools, universities, and corporate campuses can deploy Sentinel AI across their existing security camera infrastructure. The system monitors for violent altercations, unauthorized access, fire/smoke, and medical emergencies — alerting campus security and local authorities with verified incident details.",
    benefits: [
      "Integration with existing CCTV infrastructure",
      "Multi-incident type monitoring (violence, fire, intrusion)",
      "Tiered alerting: campus security first, then local authorities",
    ],
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  {
    icon: Landmark,
    title: "Smart City Integration",
    description:
      "Municipalities can embed Sentinel AI into smart city infrastructure — public transit hubs, traffic intersections, pedestrian zones, and public parks. The system provides centralized incident monitoring, automated emergency dispatch, and city-wide analytics for safety planning and resource allocation.",
    benefits: [
      "City-wide incident monitoring and aggregation",
      "Automated dispatch to municipal emergency services",
      "Data-driven safety planning with incident analytics",
    ],
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    borderColor: "border-violet-400/20",
  },
  {
    icon: FileCheck,
    title: "Insurance & Claims Verification",
    description:
      "Insurance providers can use Sentinel AI's verified detection pipeline to validate claims involving vehicle collisions, property damage, personal injury, or theft. The system provides an auditable chain of evidence — from the moment of detection through classification and notification — reducing fraud and accelerating claim resolution.",
    benefits: [
      "Tamper-evident incident timeline and evidence chain",
      "AI-verified classification reduces fraudulent claims",
      "Faster claim resolution with objective detection data",
    ],
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/20",
  },
];

const UseCases = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24">
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6"
          >
            <Zap className="w-3 h-3" />
            <span>Applications Across Industries</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
          >
            Use <span className="text-primary">Cases</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed"
          >
            Sentinel AI's detection-to-response pipeline is designed to adapt across multiple environments — from individual personal safety to city-wide smart infrastructure.
          </motion.p>
        </section>

        {/* Use Case Cards */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="space-y-12 max-w-5xl mx-auto"
            >
              {useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  className="bg-background border border-border rounded-2xl p-8 shadow-lg"
                >
                  <div className="grid md:grid-cols-[auto_1fr] gap-6">
                    {/* Icon */}
                    <div className="flex flex-col items-center md:items-start">
                      <div
                        className={`w-16 h-16 rounded-2xl ${useCase.bgColor} border ${useCase.borderColor} flex items-center justify-center mb-3`}
                      >
                        <useCase.icon className={`w-8 h-8 ${useCase.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {useCase.description}
                      </p>

                      <div className="grid sm:grid-cols-3 gap-3">
                        {useCase.benefits.map((benefit, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="gradient-card p-12 rounded-3xl text-center max-w-4xl mx-auto border border-primary/20 bg-primary/5"
          >
            <h2 className="text-3xl font-bold mb-6">
              See Sentinel AI in Your Environment
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Whether you are an individual, a fleet operator, or a city planner — we want to understand your safety needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="glow-primary" asChild>
                <a target="_blank" href="mailto:muddassir032@gmail.com">
                  Discuss Your Use Case
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/how-it-works">
                  View the Pipeline
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default UseCases;