import React from "react";
import {
  AlertTriangle,
  Clock,
  Bell,
  CheckCircle2,
  Users,
  MapPin,
  Car,
  Flame,
  PersonStanding,
  Swords,
  HeartPulse,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// --- Sample / Demo Data ---

const sampleIncidents = [
  { id: "INC-001", type: "Vehicle Collision", date: "2026-01-15 14:32", location: "I-95, Mile 142, NY", status: "Resolved", authority: "Police" },
  { id: "INC-002", type: "Fire/Smoke", date: "2026-01-15 13:10", location: "45 Elm St, Apt 3B, NY", status: "Resolved", authority: "Fire" },
  { id: "INC-003", type: "Physical Fall", date: "2026-01-15 11:45", location: "Central Station, Platform 2, NY", status: "Acknowledged", authority: "Medical" },
  { id: "INC-004", type: "Violent Altercation", date: "2026-01-14 22:18", location: "742 Market St, NY", status: "Acknowledged", authority: "Police" },
  { id: "INC-005", type: "Medical Emergency", date: "2026-01-14 19:05", location: "88 Park Ave, Lobby, NY", status: "Dispatched", authority: "Medical" },
  { id: "INC-006", type: "Vehicle Collision", date: "2026-01-14 16:30", location: "Broadway & 42nd St, NY", status: "Resolved", authority: "Police" },
  { id: "INC-007", type: "Intrusion", date: "2026-01-14 08:12", location: "12 Maple Dr, Warehouse B, NY", status: "Resolved", authority: "Police" },
  { id: "INC-008", type: "Fire/Smoke", date: "2026-01-13 21:40", location: "300 Harbor Blvd, NY", status: "Resolved", authority: "Fire" },
];

const incidentTypeBreakdown = [
  { name: "Vehicle Collision", value: 28, color: "#f87171" },
  { name: "Fire/Smoke", value: 18, color: "#fb923c" },
  { name: "Physical Fall", value: 22, color: "#fbbf24" },
  { name: "Altercation", value: 14, color: "#e879f9" },
  { name: "Medical", value: 10, color: "#f472b6" },
  { name: "Intrusion", value: 8, color: "#22d3ee" },
];

const authorityBreakdown = [
  { name: "Police", value: 45, color: "#60a5fa" },
  { name: "Fire", value: 30, color: "#fb923c" },
  { name: "Medical", value: 25, color: "#34d399" },
];

const responseTimeData = [
  { day: "Mon", detection: 4.2, notification: 2.1, response: 6.8 },
  { day: "Tue", detection: 3.8, notification: 1.9, response: 5.9 },
  { day: "Wed", detection: 5.1, notification: 2.4, response: 7.2 },
  { day: "Thu", detection: 3.5, notification: 1.8, response: 5.5 },
  { day: "Fri", detection: 4.0, notification: 2.0, response: 6.1 },
  { day: "Sat", detection: 4.8, notification: 2.3, response: 7.0 },
  { day: "Sun", detection: 3.9, notification: 1.7, response: 5.8 },
];

const sampleMapLocations = [
  { id: 1, lat: "40.7128", lng: "-74.0060", label: "Vehicle Collision - I-95" },
  { id: 2, lat: "40.7580", lng: "-73.9855", label: "Fire - Elm St" },
  { id: 3, lat: "40.7484", lng: "-73.9857", label: "Fall - Central Station" },
  { id: 4, lat: "40.7614", lng: "-73.9776", label: "Altercation - Market St" },
  { id: 5, lat: "40.7527", lng: "-73.9772", label: "Medical - Park Ave" },
];

const statCards = [
  {
    title: "Total Incidents (30d)",
    value: "124",
    change: "+8.7%",
    trending: "up",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
  },
  {
    title: "Avg Detection Time",
    value: "4.2s",
    change: "-0.3s",
    trending: "down",
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    title: "Avg Notification Time",
    value: "2.0s",
    change: "-0.1s",
    trending: "down",
    icon: Bell,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Avg Response Time",
    value: "6.3m",
    change: "+0.5m",
    trending: "up",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-16">
        {/* Demo Data Banner */}
        <div className="container mx-auto px-4 mb-8">
          <div className="max-w-7xl mx-auto p-4 rounded-xl border border-warning/40 bg-warning/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <span className="font-bold text-foreground text-sm">Demo Data - Not Live</span>
                <span className="text-xs text-muted-foreground ml-2">
                  All numbers, names, and timestamps on this page are realistic-looking sample/placeholder data.
                  They do not reflect real incidents, actual authority integrations, or live system metrics.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <section className="container mx-auto px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Zap className="w-3 h-3" />
              <span>Sample Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
              Admin <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Monitoring and analytics overview (sample data for demonstration purposes).
            </p>
          </motion.div>
        </section>

        {/* Stat Cards */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-background border border-border rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {stat.trending === "up" ? (
                      <ArrowUpRight className="w-3 h-3 text-red-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-green-400" />
                    )}
                    <span className={stat.trending === "up" ? "text-red-400" : "text-green-400"}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Charts Row */}
        <section className="container mx-auto px-4 mb-12">
          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Incident Types Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-background border border-border rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold mb-4">Incident Type Breakdown (Sample)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={incidentTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {incidentTypeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 47% 8%)",
                      border: "1px solid hsl(222 30% 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Authorities Notified Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-background border border-border rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold mb-4">Authorities Notified (Sample)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={authorityBreakdown} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 47% 8%)",
                      border: "1px solid hsl(222 30% 18%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {authorityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </section>

        {/* Response Time Line Chart */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-7xl mx-auto bg-background border border-border rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold mb-4">Response Time Metrics (Sample - Past Week)</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-blue-400/5 border border-blue-400/10">
                <span className="text-xs text-muted-foreground">Detection Time</span>
                <p className="text-sm font-bold text-blue-400">Incident → Classification</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-xs text-muted-foreground">Notification Time</span>
                <p className="text-sm font-bold text-primary">Detection → Alert Sent</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/10">
                <span className="text-xs text-muted-foreground">Response Time</span>
                <p className="text-sm font-bold text-emerald-400">Alert → Acknowledgment</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }} axisLine={false} tickLine={false} unit="s" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222 47% 8%)",
                    border: "1px solid hsl(222 30% 18%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="detection" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 4 }} name="Detection (s)" />
                <Line type="monotone" dataKey="notification" stroke="#60a5fa" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: "#60a5fa", r: 3 }} name="Notification (s)" />
                <Line type="monotone" dataKey="response" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 4 }} name="Response (min)" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground/60 mt-3 text-center">
              Detection and notification times in seconds. Response time (authority acknowledgment) in minutes. Sample data only.
            </p>
          </motion.div>
        </section>

        {/* Recent Incidents Table */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-7xl mx-auto bg-background border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold">Recent Incidents (Sample Data)</h3>
              <p className="text-xs text-muted-foreground mt-1">Last 8 recorded incidents in the system.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    <th className="text-left p-4 text-xs text-muted-foreground font-medium">ID</th>
                    <th className="text-left p-4 text-xs text-muted-foreground font-medium">Type</th>
                    <th className="text-left p-4 text-xs text-muted-foreground font-medium">Date/Time</th>
                    <th className="text-left p-4 text-xs text-muted-foreground font-medium">Location</th>
                    <th className="text-left p-4 text-xs text-muted-foreground font-medium">Authority</th>
                    <th className="text-left p-4 text-xs text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleIncidents.map((incident, index) => (
                    <motion.tr
                      key={incident.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-secondary/10 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-muted-foreground">{incident.id}</td>
                      <td className="p-4 font-medium">{incident.type}</td>
                      <td className="p-4 text-muted-foreground">{incident.date}</td>
                      <td className="p-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="text-xs">{incident.location}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            incident.authority === "Police"
                              ? "border-blue-400/30 text-blue-400 bg-blue-400/5"
                              : incident.authority === "Fire"
                              ? "border-orange-400/30 text-orange-400 bg-orange-400/5"
                              : "border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                          }`}
                        >
                          {incident.authority}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            incident.status === "Resolved"
                              ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                              : incident.status === "Acknowledged"
                              ? "border-amber-400/30 text-amber-400 bg-amber-400/5"
                              : "border-primary/30 text-primary bg-primary/5"
                          }`}
                        >
                          {incident.status}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* Map View Placeholder */}
        <section className="container mx-auto px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="max-w-7xl mx-auto bg-background border border-border rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold mb-4">Incident Map View (Sample Locations)</h3>
            <div className="relative w-full h-[300px] rounded-xl bg-gradient-to-br from-secondary/50 to-background border border-border overflow-hidden">
              {/* Grid overlay */}
              <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
              
              {/* Placeholder map */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Map integration placeholder</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Pinned locations shown below (sample)</p>
                </div>
              </div>

              {/* Sample pins overlay */}
              {sampleMapLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="absolute flex items-center gap-1.5 group"
                  style={{
                    left: `${30 + loc.id * 15}%`,
                    top: `${20 + loc.id * 12}%`,
                  }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 rounded-full bg-primary/30 border-2 border-primary animate-pulse" />
                    <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-primary/10 animate-pulse-ring" />
                  </div>
                  <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 px-1.5 py-0.5 rounded whitespace-nowrap">
                    {loc.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              Sample incident locations for demonstration. Map integration is not yet active.
            </p>
          </motion.div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;