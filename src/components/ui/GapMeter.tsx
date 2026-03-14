"use client";

import { motion, useMotionValue, useTransform, animate, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

interface GapMeterProps {
  score: number;
  delay?: number;
}

// ギャップスコアの大きなカウントアップ表示
export default function GapMeter({ score, delay = 0 }: GapMeterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(rounded, "change", (latest) => {
    setDisplayValue(latest);
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(count, score, {
        duration: 2,
        ease: "easeOut",
      });
      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [count, score, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col items-center"
    >
      <span
        className="text-7xl font-bold bg-gradient-to-r from-primary-light via-accent to-neon-pink bg-clip-text text-transparent"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {displayValue}
      </span>
      <span className="text-sm text-zinc-400 mt-1">/ 100</span>
    </motion.div>
  );
}
