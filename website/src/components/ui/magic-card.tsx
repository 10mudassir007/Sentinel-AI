import React, { useCallback, useEffect, useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

import { cn } from "@/lib/utils";

interface MagicCardProps {
  children?: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientFrom?: string;
  gradientTo?: string;
  gradientColor?: string;
  gradientOpacity?: number;
}

export function MagicCard({
  children,
  className,
  gradientSize = 220,
  gradientFrom = "hsl(var(--primary))",
  gradientTo = "hsl(199 89% 65%)",
  gradientColor = "hsl(var(--primary) / 0.12)",
  gradientOpacity = 1,
}: MagicCardProps) {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);
  const gradientSizeRef = useRef(gradientSize);
  gradientSizeRef.current = gradientSize;

  const reset = useCallback(() => {
    const off = -gradientSizeRef.current;
    mouseX.set(off);
    mouseY.set(off);
  }, [mouseX, mouseY]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    reset();
  }, [reset]);

  const background = useMotionTemplate`
    linear-gradient(hsl(var(--card)) 0 0) padding-box,
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientFrom},
      ${gradientTo},
      hsl(var(--border)) 100%
    ) border-box
  `;

  const spotlight = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientColor},
      transparent 100%
    )
  `;

  return (
    <motion.div
      className={cn(
        "group relative isolate overflow-hidden rounded-[inherit] border border-transparent",
        className,
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      style={{ background }}
    >
      <div className="absolute inset-px z-20 rounded-[inherit] bg-card" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-px z-30 rounded-[inherit] transition-opacity duration-300"
        style={{ background: spotlight, opacity: gradientOpacity }}
      />

      <div className="relative z-40">{children}</div>
    </motion.div>
  );
}
