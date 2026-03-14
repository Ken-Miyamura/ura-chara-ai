"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { AnalysisResult } from "@/types/shared";
import { useShareCard } from "@/hooks/useShareCard";
import Header from "@/components/layout/Header";
import ShareButton from "@/components/share/ShareButton";

export default function SharePage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { cardRef, shareToTwitter, downloadCard, isGenerating } =
    useShareCard();

  // sessionStorageから結果読み込み
  useEffect(() => {
    const stored = sessionStorage.getItem("uraCharaResult");
    if (!stored) {
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AnalysisResult;
      setResult(parsed);
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <h2 className="text-center text-xl font-bold">シェアカード</h2>

          {/* シェアカードプレビュー */}
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden border border-zinc-800"
          >
            <div className="bg-gradient-to-r from-surface-bright to-surface-dark">
              <div className="grid grid-cols-2">
                {/* 表の顔（左: 明るい） */}
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-100 text-zinc-800">
                  <p className="text-xs text-amber-600 mb-1 font-medium">
                    表の顔
                  </p>
                  <div className="text-3xl mb-2">
                    {result.surface.emoji}
                  </div>
                  <p className="text-sm font-bold leading-tight">
                    {result.surface.title}
                  </p>
                </div>

                {/* 裏の顔（右: ダーク） */}
                <div className="p-5 bg-gradient-to-br from-zinc-900 to-purple-950 text-zinc-100">
                  <p className="text-xs text-purple-400 mb-1 font-medium">
                    裏の顔
                  </p>
                  <div className="text-3xl mb-2">
                    {result.hidden.emoji}
                  </div>
                  <p className="text-sm font-bold leading-tight">
                    {result.hidden.title}
                  </p>
                </div>
              </div>

              {/* ギャップスコア */}
              <div className="bg-zinc-900 py-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">GAP SCORE</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                  {result.gap.overallGapScore}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {result.gap.gapLevelLabel}
                </p>
              </div>

              {/* キャッチフレーズ */}
              <div className="bg-zinc-950 py-3 px-4 text-center">
                <p className="text-sm text-zinc-300 italic">
                  {result.shareCard.catchphrase}
                </p>
              </div>

              {/* フッター */}
              <div className="bg-zinc-950 py-2 px-4 flex justify-between items-center border-t border-zinc-800">
                <span className="text-xs text-zinc-600">
                  あなたも診断してみる？
                </span>
                <span className="text-xs text-primary-light font-medium">
                  #裏キャラAI
                </span>
              </div>
            </div>
          </div>

          {/* シェアボタン群 */}
          <div className="space-y-3">
            <ShareButton
              onClick={() => shareToTwitter(result.shareCard)}
              label="Twitterでシェア"
              icon="🐦"
              variant="primary"
            />

            <ShareButton
              onClick={downloadCard}
              label={isGenerating ? "画像を生成中..." : "画像を保存"}
              icon="📥"
              variant="secondary"
              disabled={isGenerating}
            />

            <ShareButton
              onClick={() => {
                sessionStorage.removeItem("uraCharaResult");
                sessionStorage.removeItem("uraCharaInput");
                router.push("/input");
              }}
              label="もう一度診断する"
              icon="🔄"
              variant="secondary"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
