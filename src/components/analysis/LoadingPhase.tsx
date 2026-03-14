"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingPhaseProps {
  phase: number;
  label: string;
}

// ローディングフェーズの表示 (アイコン + メッセージ + アニメーション)
const phaseIcons = ["📡", "🎭", "🔍", "⚡"];

const teaserMessages = [
  "データの中に何かが見えてきた...",
  "あなたの投稿から意外な一面が見えてきました...",
  "表と裏のギャップ、思ったより大きいかも...？",
  "もうすぐあなたの裏キャラが明らかに...",
];

export default function LoadingPhase({ phase, label }: LoadingPhaseProps) {
  const icon = phaseIcons[phase - 1] || "📡";
  const teaser = teaserMessages[phase - 1] || teaserMessages[0];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* フェーズアイコン */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
          transition={{ duration: 0.4 }}
          className="text-6xl"
        >
          {icon}
        </motion.div>
      </AnimatePresence>

      {/* フェーズラベル */}
      <AnimatePresence mode="wait">
        <motion.h2
          key={label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-center"
        >
          {label}
        </motion.h2>
      </AnimatePresence>

      {/* プログレスドット */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((p) => (
          <motion.div
            key={p}
            className={`w-2.5 h-2.5 rounded-full ${
              p <= phase ? "bg-primary" : "bg-zinc-700"
            }`}
            animate={
              p === phase
                ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
                : undefined
            }
            transition={
              p === phase
                ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
          />
        ))}
      </div>

      {/* ティーザーメッセージ */}
      <AnimatePresence mode="wait">
        <motion.p
          key={teaser}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-sm text-zinc-500 text-center italic"
        >
          {teaser}
        </motion.p>
      </AnimatePresence>

      {/* スキャンラインエフェクト */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(transparent 50%, rgba(168, 85, 247, 0.03) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}
