"use client";
import { motion } from "framer-motion";
import Image from "next/image";

interface GlobalLoaderProps {
  progress?: number;
  message?: string;
}

export default function GlobalLoader({ progress = 0, message = "CampusLink Investment Acc." }: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative flex flex-col items-center">
        {}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="mb-10"
        >
          <Image 
            src="/images/icon.png" 
            alt="CampusLink" 
            width={120} 
            height={120} 
            className="w-24 h-24 lg:w-28 lg:h-28 object-contain shadow-[0_20px_50px_rgba(245,158,11,0.15)]"
          />
        </motion.div>

        <div className="flex flex-col items-center gap-4">
          {}
          <div className="w-48 lg:w-64 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            />
          </div>
          
          <div className="flex items-center gap-2.5">
            <p className="text-[12px] font-black text-stone-900 tracking-tighter">
              {Math.round(progress)}%
            </p>
            <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
