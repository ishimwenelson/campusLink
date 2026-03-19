"use client";
import { motion } from "framer-motion";

interface ProgressCircleProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  emoji?: string;
}

export function ProgressCircle({
  percent, size = 160, strokeWidth = 12, label, sublabel, emoji,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
  const center = size / 2;

  const color = percent >= 100 ? "#16a34a" : percent >= 60 ? "#d97706" : percent >= 30 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="#f5e6c8" strokeWidth={strokeWidth}
        />
        {}
        <motion.circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {emoji && <span className="text-xl mb-0.5">{emoji}</span>}
        <span className="font-display text-2xl font-bold text-stone-900">
          {Math.round(percent)}%
        </span>
        {label && <span className="text-xs font-semibold text-stone-600 mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-stone-400">{sublabel}</span>}
      </div>
    </div>
  );
}
