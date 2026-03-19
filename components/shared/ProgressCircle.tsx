// components/shared/ProgressCircle.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ProgressCircleProps {
  percent:   number;  // 0–100
  size?:     number;
  stroke?:   number;
  label?:    string;
  sublabel?: string;
  showEmoji?: boolean;
}

function getEmoji(pct: number): string {
  if (pct >= 100) return "🏆";
  if (pct >= 80)  return "🔥";
  if (pct >= 60)  return "💪";
  if (pct >= 40)  return "📈";
  if (pct >= 20)  return "🌱";
  return "🚀";
}

export default function ProgressCircle({
  percent, size = 160, stroke = 10, label, sublabel, showEmoji = true,
}: ProgressCircleProps) {
  const [displayed, setDisplayed] = useState(0);
  const radius      = (size - stroke) / 2;
  const circumf     = 2 * Math.PI * radius;
  const offset      = circumf - (displayed / 100) * circumf;
  const center      = size / 2;

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayed((prev) => {
        const next = prev + 1;
        if (next >= percent) { clearInterval(timer); return percent; }
        return next;
      });
    }, 12);
    return () => clearInterval(timer);
  }, [percent]);

  const color =
    displayed >= 100 ? "#22c55e" :
    displayed >= 60  ? "#D4A017" :
    displayed >= 30  ? "#f59e0b" :
    "#D4A017";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background track */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke="rgba(255,255,255,0.05)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <motion.circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumf}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
            transition={{ duration: 0 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showEmoji && (
            <span className="text-lg mb-0.5">{getEmoji(displayed)}</span>
          )}
          <span className="text-2xl font-display font-bold text-[#f0e6c8]">
            {displayed}%
          </span>
          {sublabel && (
            <span className="text-xs text-[#9a8a6a] mt-0.5 text-center px-3">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <p className="text-sm text-[#9a8a6a] text-center max-w-[160px]">{label}</p>
      )}
    </div>
  );
}
