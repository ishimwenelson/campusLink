
"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title:     string;
  value:     number | string;
  subtitle?: string;
  icon:      React.ReactNode;
  trend?:    { value: number; label: string };
  prefix?:   string;
  suffix?:   string;
  animate?:  boolean;
  color?:    "gold" | "green" | "blue" | "red" | "purple";
  delay?:    number;
}

const COLOR_MAP = {
  gold:   { bg: "from-[#D4A017]/10 to-transparent", border: "border-[#D4A017]/20", icon: "bg-[#D4A017]/10 text-[#D4A017]" },
  green:  { bg: "from-emerald-500/10 to-transparent", border: "border-emerald-500/20", icon: "bg-emerald-500/10 text-emerald-400" },
  blue:   { bg: "from-blue-500/10 to-transparent", border: "border-blue-500/20", icon: "bg-blue-500/10 text-blue-400" },
  red:    { bg: "from-red-500/10 to-transparent", border: "border-red-500/20", icon: "bg-red-500/10 text-red-400" },
  purple: { bg: "from-purple-500/10 to-transparent", border: "border-purple-500/20", icon: "bg-purple-500/10 text-purple-400" },
};

function AnimatedNumber({
  value, prefix = "", suffix = "",
}: { value: number; prefix?: string; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const displayRef  = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease:     "easeOut",
      onUpdate: (v) => {
        if (displayRef.current) {
          displayRef.current.textContent =
            prefix +
            new Intl.NumberFormat("fr-RW").format(Math.round(v)) +
            suffix;
        }
      },
    });
    return controls.stop;
  }, [value, motionValue, prefix, suffix]);

  return (
    <span ref={displayRef}>
      {prefix}0{suffix}
    </span>
  );
}

export default function StatCard({
  title, value, subtitle, icon,
  trend, prefix = "", suffix = "",
  animate: shouldAnimate = true,
  color = "gold",
  delay = 0,
}: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "stat-card bg-gradient-to-br",
        colors.bg,
        "border",
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", colors.icon)}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            trend.value >= 0
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}>
            <span>{trend.value >= 0 ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="text-2xl font-display font-bold text-[#f0e6c8] mb-1">
        {shouldAnimate && typeof value === "number" ? (
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        ) : (
          <span>{prefix}{typeof value === "number" ? new Intl.NumberFormat("fr-RW").format(value) : value}{suffix}</span>
        )}
      </div>

      <p className="text-sm font-medium text-[#9a8a6a]">{title}</p>
      {subtitle && (
        <p className="text-xs text-[#5a5040] mt-1">{subtitle}</p>
      )}
      {trend && (
        <p className="text-xs text-[#5a5040] mt-1">{trend.label}</p>
      )}
    </motion.div>
  );
}
