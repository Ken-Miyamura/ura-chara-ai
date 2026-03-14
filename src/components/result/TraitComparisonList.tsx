"use client";

import { motion } from "framer-motion";
import TraitBar from "@/components/ui/TraitBar";
import type { TraitComparison } from "@/types/shared";

interface TraitComparisonListProps {
  comparisons: TraitComparison[];
  delay?: number;
}

// 5つのトレイト比較リスト
export default function TraitComparisonList({
  comparisons,
  delay = 0,
}: TraitComparisonListProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-6"
    >
      <h3 className="text-center text-sm text-zinc-400 tracking-wider">
        ── ギャップ詳細 ──
      </h3>

      <div className="space-y-5">
        {comparisons.map((comparison, index) => (
          <div key={`${comparison.category}-${index}`} className="space-y-1">
            <TraitBar
              icon={comparison.icon}
              label={comparison.category}
              surfaceScore={comparison.surfaceScore}
              hiddenScore={comparison.hiddenScore}
              surfaceLabel={comparison.surfaceLabel}
              hiddenLabel={comparison.hiddenLabel}
              delay={delay + 0.2 + index * 0.15}
            />
            {comparison.gap > 20 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.8 + index * 0.15 }}
                className="text-xs text-zinc-500 ml-7"
              >
                ギャップ: {comparison.gap}pt
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
