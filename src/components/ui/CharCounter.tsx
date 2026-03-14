"use client";

interface CharCounterProps {
  current: number;
  min: number;
  max: number;
}

export default function CharCounter({ current, min, max }: CharCounterProps) {
  const isBelowMin = min > 0 && current < min && current > 0;
  const isOverMax = current > max;
  const isValid = (min === 0 || current >= min) && current <= max;

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
        {current}/{max} 文字
      </span>
      {isBelowMin && (
        <span className="text-amber-400 text-xs">
          あと{min - current}文字以上書いてね
        </span>
      )}
      {isOverMax && (
        <span className="text-red-400 text-xs">
          文字数オーバー！
        </span>
      )}
    </div>
  );
}
