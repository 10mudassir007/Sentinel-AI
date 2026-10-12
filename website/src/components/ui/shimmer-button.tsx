import React, { type ComponentPropsWithoutRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [border-radius:var(--radius)] [background:var(--bg)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className,
        )}
        {...props}
      >
        {/* spark container */}
        <div className="-z-30 absolute inset-0 overflow-hidden blur-[2px] [border-radius:var(--radius)]">
          {/* spark */}
          <div className="absolute -inset-[100%] animate-spin-around">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "conic-gradient(from 90deg, transparent 0deg, var(--shimmer-color) var(--spread), transparent calc(var(--spread) * 2))",
              }}
            />
          </div>
        </div>
        {children}

        {/* highlight */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]",
            "transform-gpu transition-all duration-300 ease-in-out",
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]",
          )}
        />

        {/* backdrop */}
        <div className="absolute inset-[var(--cut)] -z-20 [border-radius:var(--radius)] [background:var(--bg)]" />
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
