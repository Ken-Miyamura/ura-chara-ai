"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

// サンプル結果カード（ランディングページ用ティーザー）
const sampleCards = [
  {
    surface: { emoji: "✨", title: "意識高い系カフェワーカー" },
    hidden: { emoji: "🛋️", title: "布団から出たくないインドア廃人" },
    score: 74,
  },
  {
    surface: { emoji: "😊", title: "笑顔のムードメーカー" },
    hidden: { emoji: "🌙", title: "深夜のWikipedia探検家" },
    score: 68,
  },
  {
    surface: { emoji: "💪", title: "ストイック筋トレマン" },
    hidden: { emoji: "🍜", title: "3日に1回しか料理しないズボラ飯民" },
    score: 82,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 背景エフェクト */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-background to-background" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-8 relative z-10">
        {/* ヒーローセクション */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-lg mx-auto"
        >
          {/* アプリタイトル（グリッチ風グラデーション） */}
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-light via-accent to-neon-pink bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 200%" }}
          >
            裏キャラ AI
          </motion.h1>

          {/* キャッチコピー */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl md:text-2xl font-medium mb-4 text-foreground"
          >
            あなたの「裏の顔」、暴いてみない？
          </motion.p>

          {/* サブヘッドライン */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm md:text-base text-zinc-400 mb-8 leading-relaxed"
          >
            SNSの投稿、趣味、音楽の好み...
            <br />
            AIがあなたの「表の顔」と「裏の顔」のギャップを暴きます。
          </motion.p>

          {/* CTAボタン */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Link href="/input">
              <motion.button
                className="px-10 py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-accent text-white relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(168, 85, 247, 0.4)",
                    "0 0 40px rgba(168, 85, 247, 0.7), 0 0 60px rgba(236, 72, 153, 0.3)",
                    "0 0 20px rgba(168, 85, 247, 0.4)",
                  ],
                }}
                transition={{
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                裏キャラ診断スタート 👉
              </motion.button>
            </Link>
          </motion.div>

          {/* 所要時間 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-xs text-zinc-500 mt-4"
          >
            所要時間：約3分
          </motion.p>
        </motion.div>

        {/* サンプル結果カード（ティーザー） */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-12 w-full max-w-lg overflow-x-auto"
        >
          <div className="flex gap-4 px-4 pb-4 snap-x snap-mandatory overflow-x-auto">
            {sampleCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + index * 0.2 }}
                className="flex-shrink-0 w-72 snap-center"
              >
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs text-amber-400">表の顔</span>
                      <p className="text-sm font-medium">
                        {card.surface.emoji} {card.surface.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-purple-400">裏の顔</span>
                      <p className="text-sm font-medium">
                        {card.hidden.emoji} {card.hidden.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                      GAP {card.score}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 信頼性シグナル */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="text-xs text-zinc-600 mt-8 text-center"
        >
          🔒 データは保存されません。診断後に自動削除。
        </motion.p>
      </main>

      <Footer />
    </div>
  );
}
