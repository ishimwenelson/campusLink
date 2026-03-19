"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "gold" | "green" | "blue" | "red" | "purple";
  delay?: number;
  onClick?: () => void;
  isActive?: boolean;
}

const colors = {
  gold:   "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-amber-500/20",
  green:  "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-500/20",
  blue:   "bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600 shadow-sky-500/20",
  red:    "bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 shadow-rose-500/20",
  purple: "bg-gradient-to-br from-violet-400 via-violet-500 to-violet-600 shadow-violet-500/20",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = "gold", delay = 0, onClick, isActive }: StatCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative group p-5 rounded-[1.5rem] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.15)] transition-all duration-700 overflow-hidden cursor-pointer",
        colors[color],
        isActive && "ring-4 ring-white/80 ring-offset-2 scale-[1.03] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] ring-offset-stone-100"
      )}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0, scale: isActive ? 1.03 : 1 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {}
      <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />
      
      {}
      <img 
        src="/assets/cards design.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-20 mix-blend-overlay pointer-events-none"
      />
      
      <div className="relative flex items-center justify-between">
        {}
        <div className="flex flex-col gap-0.5">
          <h3 className="font-display text-2xl font-black text-white leading-none tracking-tight">
            {value}
          </h3>
          <p className="text-white/80 font-medium tracking-tight group-hover:text-white transition-colors text-xs">
            {title}
          </p>
          
          {trend && (
            <div className="flex items-center gap-1 mt-2 bg-white/15 w-fit px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
              {trend.value >= 0 ? <TrendingUp size={10} className="text-white" /> : <TrendingDown size={10} className="text-white/80" />}
              <span className="text-[10px] font-black text-white">
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-[9px] text-white/60 font-medium ml-0.5 tracking-tight group-hover:text-white/80 transition-colors">
                {trend.label}
              </span>
            </div>
          )}

          {subtitle && !trend && (
            <p className="text-white/50 text-[9px] font-medium tracking-wide mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {}
        <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 backdrop-blur-sm border border-white/10 shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
          <Icon size={22} strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
}
