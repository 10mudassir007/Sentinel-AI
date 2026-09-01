import React from "react";
import {
  Car,
  Flame,
  PersonStanding,
  Swords,
  Crosshair,
  HeartPulse,
  Hammer,
  DoorOpen,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const incidentTypes = [
  {
    icon: Car,
    title: "Vehicle Collisions",
    description:
      "Detection of multi-vehicle and single-vehicle collisions, including rear-end, T-bone, and rollover events. The model identifies vehicle deformation, airbag deployment, and sudden deceleration patterns to classify collision severity.",
    severity: "High",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/20",
  },
  {
    icon: Flame,
    title: "Fire & Smoke Detection",
    description:
      "Identification of open flames, smoke plumes, and fire-related visual indicators across indoor and outdoor environments. Designed to detect structure fires, vehicle fires, and wildfire encroachment in monitored zones.",
    severity: "Critical",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
  },
  {
    icon: PersonStanding,
    title: "Physical Falls",
    description:
      "Detection of individuals falling from standing, walking, or elevated positions. The model distinguishes between intentional floor contact (e.g., sitting, lying down) and uncontrolled falls indicative of medical emergencies or hazardous conditions.",
    severity: "High",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  {
    icon: Swords,
    title: "Violent Altercations",
    description:
      "Recognition of physical confrontations, fights, and aggressive physical interactions between individuals. The model analyzes motion patterns, pose dynamics, and contact events to differentiate altercations from non-violent interactions.",
    severity: "High",
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
  },
  {
    icon: Crosshair,
    title: "Gunshots & Weapons",
    description:
      "Detection of firearm discharge events through visual cues including muzzle flash, weapon presence, and associated crowd reactions. Functions as a supplementary detection layer for weapons-related incidents.",
    severity: "Critical",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    icon: HeartPulse,
    title: "Medical Emergencies",
    description:
      "Identification of medical distress events including individuals collapsing, convulsing, or exhibiting signs of cardiac or respiratory distress. Supports faster dispatch of emergency medical services with precise location data.",
    severity: "Critical",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    borderColor: "border-pink-400/20",
  },
  {
    icon: Hammer,
    title: "Vandalism & Property Damage",
    description:
      "Detection of property destruction events including window breaking, graffiti application, equipment tampering, and structural damage. Useful for security monitoring in commercial, industrial, and public spaces.",
    severity: "Medium",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/20",
  },
  {
    icon: DoorOpen,
    title: "Intrusion & Trespassing",
    description:
      "Identification of unauthorized entry into restricted areas, including perimeter breaches, door/window forced entry, and individuals in off-limits zones after hours. Supports campus and facility security operations.",
    severity: "Medium",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

const DetectionCapabilities = () => {
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
            <span>Incident Classification Model</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6"
          >
            Detection <span className="text-primary">Capabilities</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed"
          >
            The YOLO11m-based detection model (base COCO-pretrained weights, not custom-trained) is designed to detect a wide range of incident types, and can be further trained on incident-specific data as the system evolves. Below are the primary detection categories.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30"
          >
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">
              Detection capabilities shown are based on the base model's object classes and intended detection targets. Accuracy varies by environment, lighting, and incident conditions. This list is a placeholder and will evolve with model iteration.
            </span>
          </motion.div>
        </section>

        {/* Incident Type Cards */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
            >
              {incidentTypes.map((incident, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="bg-background border border-border rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl ${incident.bgColor} border ${incident.borderColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <incident.icon className={`w-7 h-7 ${incident.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-xl font-bold">{incident.title}</h3>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            incident.severity === "Critical"
                              ? "bg-red-400/10 text-red-400 border border-red-400/20"
                              : incident.severity === "High"
                              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                              : "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                          }`}
                        >
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {incident.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Additional Info */}
        <section className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="gradient-card rounded-2xl border border-primary/20 p-8 bg-primary/5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Model Evolution</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sentinel AI currently runs on the <span className="text-foreground font-medium">base YOLO11m model</span> with its
                    standard COCO-pretrained weights — it has not been custom-trained. The incident taxonomy listed here represents
                    the intended detection targets the base model is evaluated against. As the project evolves, the model can be
                    trained or fine-tuned on incident-specific data (based on the incidents it is asked to detect) to improve
                    classification accuracy and coverage.
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                    The detection model can be fine-tuned with incident-specific training data — enabling deployment teams to
                    tailor detection to their unique operational context as incidents are identified and labeled in the field.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default DetectionCapabilities;