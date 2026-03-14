"use client";

import { motion } from "framer-motion";
import GapMeter from "@/components/ui/GapMeter";
import type { GapLevel } from "@/types/shared";

interface GapScoreDisplayProps {
  score: number;
  level: GapLevel;
  levelLabel: string;
  aiComment: string;
  delay?: number;
}

// ギャップスコア表示 (スコア + レベルラベル + AIコメント)
export default function GapScoreDisplay({
  score,
  level,
  levelLabel,
  aiComment,
  delay = 0,
}: GapScoreDisplayProps) {
  const levelColorMap: Record<GapLevel, string> = {
    honest: "text-green-400",
    slight: "text-blue-400",
    dual: "text-yellow-400",
    moe: "text-pink-400",
    extreme: "text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="text-center space-y-4"
    >
      <h3 className="text-sm text-zinc-400 tracking-wider uppercase">ギャップスコア</h3>

      <GapMeter score={score} delay={delay + 0.2} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 1.5, duration: 0.5 }}
      >
        <span className={`text-lg font-bold ${levelColorMap[level]}`}>{levelLabel}</span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 2, duration: 0.5 }}
        className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto"
      >
        {aiComment}
      </motion.p>
    </motion.div>
  );
}
