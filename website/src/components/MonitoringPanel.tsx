import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, AlertTriangle, Camera, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type Box = { conf: number; x: number; y: number; w: number; h: number };
type Frame = { person: Box; vehicle: Box; fire: Box };

const FRAMES: Frame[] = [
  {
    person: { conf: 0.94, x: 14, y: 30, w: 14, h: 34 },
    vehicle: { conf: 0.88, x: 50, y: 58, w: 26, h: 24 },
    fire: { conf: 0.81, x: 70, y: 18, w: 12, h: 13 },
  },
  {
    person: { conf: 0.91, x: 28, y: 26, w: 14, h: 34 },
    vehicle: { conf: 0.9, x: 44, y: 60, w: 24, h: 21 },
    fire: { conf: 0.78, x: 64, y: 24, w: 12, h: 13 },
  },
  {
    person: { conf: 0.96, x: 20, y: 32, w: 13, h: 32 },
    vehicle: { conf: 0.92, x: 42, y: 58, w: 27, h: 23 },
    fire: { conf: 0.73, x: 66, y: 20, w: 12, h: 13 },
  },
];

const CAMERAS = ["CAM-04", "CAM-09", "CAM-12"];

function DetectionBox({
  label,
  conf,
  x,
  y,
  w,
  h,
  danger,
}: Box & { label: string; danger: boolean }) {
  return (
    <motion.div
      initial={false}
      aria-hidden="true"
      animate={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "absolute rounded-[3px] border",
        danger
          ? "border-destructive/80 shadow-[0_0_14px_hsl(0_72%_51%/0.35)]"
          : "border-primary/70 shadow-[0_0_12px_hsl(199_89%_48%/0.28)]",
      )}
    >
      <span
        className={cn(
          "absolute -top-5 left-0 flex items-center gap-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[8px] uppercase tracking-wider backdrop-blur-sm",
          danger ? "text-destructive" : "text-primary",
        )}
      >
        <span className={cn("h-1 w-1 rounded-full", danger ? "bg-destructive" : "bg-primary")} />
        {label} {conf.toFixed(2)}
      </span>
      <span
        className={cn(
          "absolute bottom-0 left-0 h-[2px] rounded-full transition-[width] duration-700",
          danger ? "bg-destructive" : "bg-primary",
        )}
        style={{ width: `${conf * 100}%` }}
      />
    </motion.div>
  );
}

function buildingWindows(bx: number, by: number, bw: number, bh: number) {
  const rects: JSX.Element[] = [];
  for (let rx = bx + 6; rx < bx + bw - 6; rx += 14) {
    for (let ry = by + 10; ry < by + bh - 10; ry += 17) {
      const seed = rx * 7 + ry;
      if (seed % 3 === 0) continue;
      if (seed % 19 === 0) {
        rects.push(
          <rect key={`${rx}-${ry}`} x={rx} y={ry} width={4} height={5} rx={1} fill="#0e7490" opacity={0.5} />,
        );
      } else {
        rects.push(
          <rect key={`${rx}-${ry}`} x={rx} y={ry} width={4} height={5} rx={1} fill="#233750" opacity={0.9} />,
        );
      }
    }
  }
  return rects;
}

const MonitoringPanel = () => {
  const [frame, setFrame] = useState(0);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) return;
    let timer: number | null = null;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (timer === null) {
            timer = window.setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 3600);
          }
        } else if (timer !== null) {
          window.clearInterval(timer);
          timer = null;
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer !== null) window.clearInterval(timer);
    };
  }, [reduced]);

  const f = FRAMES[frame];
  const slots = [
    { label: "person", box: f.person, danger: false },
    { label: "vehicle", box: f.vehicle, danger: false },
    { label: "fire", box: f.fire, danger: true },
  ];

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/80 shadow-2xl shadow-black/50 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate font-mono text-[10px] uppercase tracking-wider text-foreground">
            CAM-04 · Street Junction
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-warning">
          <span className="h-1 w-1 rounded-full bg-warning animate-pulse" />
          Simulated
        </span>
      </div>

      {/* Feed */}
      <div className="relative aspect-video overflow-hidden bg-[#0a1018]">
        {/* Illustrative synthetic scene */}
        <svg
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="mon-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1220" />
              <stop offset="55%" stopColor="#0e1a2c" />
              <stop offset="100%" stopColor="#132238" />
            </linearGradient>
            <radialGradient id="mon-halo" cx="0.5" cy="0.42" r="0.55">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#132238" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="mon-ground" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c1420" />
              <stop offset="100%" stopColor="#090f16" />
            </linearGradient>
          </defs>

          <rect width="800" height="450" fill="url(#mon-sky)" />
          <rect width="800" height="450" fill="url(#mon-halo)" />

          {/* Skyline silhouettes */}
          <g fill="#0c1524">
            <rect x="0" y="118" width="70" height="210" />
            <rect x="58" y="150" width="62" height="178" />
            <rect x="128" y="98" width="84" height="230" />
            <rect x="212" y="142" width="56" height="186" />
            <rect x="558" y="130" width="72" height="198" />
            <rect x="640" y="172" width="90" height="156" />
            <rect x="722" y="118" width="78" height="210" />
          </g>

          {/* Building windows */}
          <g>
            {buildingWindows(0, 118, 70, 210)}
            {buildingWindows(58, 150, 62, 178)}
            {buildingWindows(128, 98, 84, 230)}
            {buildingWindows(212, 142, 56, 186)}
            {buildingWindows(558, 130, 72, 198)}
            {buildingWindows(640, 172, 90, 156)}
            {buildingWindows(722, 118, 78, 210)}
          </g>

          {/* Ground + road */}
          <polygon points="400,150 800,450 0,450" fill="url(#mon-ground)" />
          <polygon points="400,150 520,450 280,450" fill="#0a111a" />

          {/* Perspective tracking grid */}
          <g stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.07" fill="none">
            {[190, 240, 300, 370].map((yy) => (
              <polygon key={yy} points={`440,${yy} 360,${yy} 0,450 800,450`} />
            ))}
            {[0, 100, 200, 300, 500, 600, 700, 800].map((xx) => (
              <line key={xx} x1="400" y1="150" x2={xx} y2="450" />
            ))}
          </g>

          {/* Lane markings */}
          <g stroke="#1b3347" strokeWidth="2" strokeDasharray="14 16">
            <line x1="340" y1="186" x2="250" y2="450" />
            <line x1="460" y1="186" x2="550" y2="450" />
          </g>

          {/* Street lamp */}
          <g>
            <line x1="136" y1="450" x2="150" y2="292" stroke="#22313f" strokeWidth="3" />
            <path d="M150 292 q18 0 20 16" stroke="#22313f" strokeWidth="3" fill="none" />
            <circle cx="172" cy="308" r="7" fill="#0e7490" opacity="0.8" />
            <circle cx="172" cy="308" r="18" fill="#0e7490" opacity="0.12" />
            <circle cx="172" cy="308" r="38" fill="#0e7490" opacity="0.05" />
          </g>

          {/* Illustrative pedestrian */}
          <g transform="translate(300 322)">
            <circle cx="8" cy="0" r="6" fill="#1c2c3c" />
            <rect x="2" y="9" width="12" height="30" rx="6" fill="#1c2c3c" />
            <rect x="6" y="12" width="4" height="12" rx="2" fill="#2b4157" />
          </g>

          {/* Illustrative vehicle */}
          <g transform="translate(470 338)">
            <rect x="0" y="26" width="150" height="30" rx="10" fill="#15212f" />
            <rect x="26" y="16" width="42" height="16" rx="6" fill="#172536" />
            <rect x="82" y="16" width="42" height="16" rx="6" fill="#172536" />
            <rect x="10" y="46" width="130" height="6" rx="3" fill="#1b2b3c" />
            <circle cx="26" cy="56" r="9" fill="#0d1420" />
            <circle cx="124" cy="56" r="9" fill="#0d1420" />
            <circle cx="18" cy="27" r="2.5" fill="#0e7490" opacity="0.8" />
            <circle cx="132" cy="27" r="2.5" fill="#0e7490" opacity="0.8" />
          </g>
        </svg>

        {/* Crosshair reticle */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/10" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-primary/10" />
        </div>

        {/* Corner brackets */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-1.5 h-[calc(100%-0.75rem)] w-[calc(100%-0.75rem)] text-primary opacity-30"
        >
          <path
            d="M0 10V0H10 M90 0H100V10 M100 90V100H90 M10 100H0V90"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* Scan line */}
        <div className="pointer-events-none absolute left-0 right-0 z-10 h-[2px] animate-scan bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* OSD */}
        <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary backdrop-blur-sm">
          <Activity className="h-3 w-3" />
          ai · yolo11m
        </div>

        {/* Detection boxes */}
        <div className="absolute inset-2 z-20">
          {slots.map(({ label, box, danger }) => (
            <DetectionBox key={label} label={label} danger={danger} {...box} />
          ))}
        </div>
      </div>

      {/* Incident notification */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-destructive/5 px-3 py-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            Possible fire detected — escalation recommended
          </p>
          <p className="font-mono text-[10px] text-muted-foreground">simulated · for demonstration</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-destructive">
          High
        </span>
      </div>

      {/* Footer meta */}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Radio className="h-3 w-3" />
          Preview mode
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          {CAMERAS.map((cam, i) => (
            <span
              key={cam}
              className={cn(
                "flex items-center gap-1 rounded border px-1 py-0.5",
                i === 0 ? "border-primary/30 text-primary" : "border-white/10 text-muted-foreground",
              )}
            >
              <span className={cn("h-1 w-1 rounded-full", i === 0 ? "bg-primary" : "bg-muted-foreground/60")} />
              {cam}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-primary" />
          Detection loop
        </span>
      </div>
    </div>
  );
};

export default MonitoringPanel;