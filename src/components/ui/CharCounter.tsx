"use client";

import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";

interface CharCounterProps {
  current: number;
  min: number;
  max: number;
  locale?: Locale;
}

export default function CharCounter({ current, min, max, locale = "ja" }: CharCounterProps) {
  const dict = getDictionarySync(locale);
  const isBelowMin = min > 0 && current < min && current > 0;
  const isOverMax = current > max;
  const isValid = (min === 0 || current >= min) && current <= max;

  const belowMinText = dict.input.charCounter.belowMin.replace(
    "{remaining}",
    String(min - current),
  );

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={
          isOverMax
            ? "text-red-400"
            : isBelowMin
              ? "text-amber-400"
              : isValid && current > 0
                ? "text-green-400"
                : "text-zinc-500"
        }
      >
        {current}/{max} {dict.input.charCounter.unit}
      </span>
      {isBelowMin && <span className="text-amber-400 text-xs">{belowMinText}</span>}
      {isOverMax && <span className="text-red-400 text-xs">{dict.input.charCounter.overMax}</span>}
    </div>
  );
}
