"use client";

import { motion } from "framer-motion";

interface PersonaCardProps {
  type: "surface" | "hidden";
  emoji: string;
  title: string;
  traits: string[];
  summary: string;
  keywords: string[];
  delay?: number;
}

// ペルソナカード (表の顔 or 裏の顔)
export default function PersonaCard({
  type,
  emoji,
  title,
  traits,
  summary,
  keywords,
  delay = 0,
}: PersonaCardProps) {
  const isSurface = type === "surface";

  return (
    <motion.div
      initial={{ opacity: 0, x: isSurface ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={`rounded-2xl p-6 border ${
        isSurface
          ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 text-zinc-800"
          : "bg-gradient-to-br from-zinc-900 to-purple-950 border-purple-500/30 text-zinc-100"
      }`}
    >
      {/* ラベル */}
      <div className="mb-3">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isSurface ? "bg-amber-200/50 text-amber-700" : "bg-purple-500/20 text-purple-300"
          }`}
        >
          {isSurface ? "表の顔" : "裏の顔"}
        </span>
      </div>

      {/* 絵文字 + タイトル */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3, type: "spring" }}
          className="text-5xl mb-2"
        >
          {emoji}
        </motion.div>
        <h3 className={`text-lg font-bold ${isSurface ? "text-zinc-800" : "text-white"}`}>
          {title}
        </h3>
      </div>

      {/* サマリー */}
      <p
        className={`text-sm leading-relaxed mb-4 ${isSurface ? "text-zinc-600" : "text-zinc-300"}`}
      >
        {summary}
      </p>

      {/* トレイト */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {traits.map((trait, i) => (
          <span
            key={`${trait}-${i}`}
            className={`text-xs px-2 py-0.5 rounded-full ${
              isSurface ? "bg-amber-100 text-amber-700" : "bg-purple-500/20 text-purple-300"
            }`}
          >
            {trait}
          </span>
        ))}
      </div>

      {/* キーワード */}
      <div className="flex flex-wrap gap-1">
        {keywords.map((kw, i) => (
          <span
            key={`${kw}-${i}`}
            className={`text-xs ${isSurface ? "text-amber-500" : "text-pink-400"}`}
          >
            #{kw}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
