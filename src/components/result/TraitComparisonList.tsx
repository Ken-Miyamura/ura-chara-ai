"use client";

import { motion } from "framer-motion";
import TraitBar from "@/components/ui/TraitBar";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";
import type { TraitComparison } from "@/types/shared";

interface TraitComparisonListProps {
  comparisons: TraitComparison[];
  delay?: number;
  locale?: Locale;
}

export default function TraitComparisonList({
  comparisons,
  delay = 0,
  locale = "ja",
}: TraitComparisonListProps) {
  const dict = getDictionarySync(locale);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-6"
    >
      <h3 className="text-center text-sm text-zinc-400 tracking-wider">
        {dict.result.gapDetailTitle}
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
                {dict.result.gapLabel}: {comparison.gap}pt
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
