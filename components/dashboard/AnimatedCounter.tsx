"use client";
import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({
  from = 0, to, duration = 1.5, className = "", formatter,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = formatter ? formatter(value) : Math.round(value).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [from, to, duration, formatter]);

  return <span ref={ref} className={className}>{formatter ? formatter(from) : from.toLocaleString()}</span>;
}
