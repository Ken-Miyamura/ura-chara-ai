"use client";

import { motion } from "framer-motion";

interface TraitBarProps {
  icon: string;
  label: string;
  surfaceScore: number;
  hiddenScore: number;
  surfaceLabel: string;
  hiddenLabel: string;
  delay?: number;
}

export default function TraitBar({
  icon,
  label,
  surfaceScore,
  hiddenScore,
  surfaceLabel,
  hiddenLabel,
  delay = 0,
}: TraitBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      {/* 表の顔スコア */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400 w-8 text-right">{surfaceScore}</span>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${surfaceScore}%` }}
            transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs text-amber-300 min-w-[100px]">{surfaceLabel}</span>
      </div>

      {/* 裏の顔スコア */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400 w-8 text-right">{hiddenScore}</span>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${hiddenScore}%` }}
            transition={{ duration: 1, delay: delay + 0.4, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs text-purple-300 min-w-[100px]">{hiddenLabel}</span>
      </div>
    </motion.div>
  );
}
