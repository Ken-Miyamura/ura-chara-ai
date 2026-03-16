"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import ShareButton from "@/components/share/ShareButton";
import { useShareCard } from "@/hooks/useShareCard";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";
import type { AnalysisResult } from "@/types/shared";

export default function SharePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) ?? "ja";
  const dict = getDictionarySync(locale);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { cardRef, shareToTwitter, downloadCard, isGenerating } = useShareCard();

  // sessionStorageから結果読み込み
  useEffect(() => {
    const stored = sessionStorage.getItem("uraCharaResult");
    if (!stored) {
      router.push(`/${locale}`);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AnalysisResult;
      setResult(parsed);
    } catch {
      router.push(`/${locale}`);
    }
  }, [router, locale]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">{dict.result.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <h2 className="text-center text-xl font-bold">{dict.share.title}</h2>

          {/* シェアカードプレビュー */}
          <div ref={cardRef} className="rounded-2xl overflow-hidden border border-zinc-800">
            <div className="bg-gradient-to-r from-surface-bright to-surface-dark">
              <div className="grid grid-cols-2">
                {/* 表の顔（左: 明るい） */}
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-100 text-zinc-800">
                  <p className="text-xs text-amber-600 mb-1 font-medium">
                    {dict.share.surfaceLabel}
                  </p>
                  <div className="text-3xl mb-2">{result.surface.emoji}</div>
                  <p className="text-sm font-bold leading-tight">{result.surface.title}</p>
                </div>

                {/* 裏の顔（右: ダーク） */}
                <div className="p-5 bg-gradient-to-br from-zinc-900 to-purple-950 text-zinc-100">
                  <p className="text-xs text-purple-400 mb-1 font-medium">
                    {dict.share.hiddenLabel}
                  </p>
                  <div className="text-3xl mb-2">{result.hidden.emoji}</div>
                  <p className="text-sm font-bold leading-tight">{result.hidden.title}</p>
                </div>
              </div>

              {/* ギャップスコア */}
              <div className="bg-zinc-900 py-4 text-center">
                <p className="text-xs text-zinc-500 mb-1">{dict.share.gapScoreLabel}</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                  {result.gap.overallGapScore}
                </p>
                <p className="text-xs text-zinc-400 mt-1">{result.gap.gapLevelLabel}</p>
              </div>

              {/* キャッチフレーズ */}
              <div className="bg-zinc-950 py-3 px-4 text-center">
                <p className="text-sm text-zinc-300 italic">{result.shareCard.catchphrase}</p>
              </div>

              {/* フッター */}
              <div className="bg-zinc-950 py-2 px-4 flex justify-between items-center border-t border-zinc-800">
                <span className="text-xs text-zinc-600">{dict.share.footerCta}</span>
                <span className="text-xs text-primary-light font-medium">{dict.share.hashtag}</span>
              </div>
            </div>
          </div>

          {/* シェアボタン群 */}
          <div className="space-y-3">
            <ShareButton
              onClick={() => shareToTwitter(result.shareCard)}
              label={dict.share.twitterButton}
              icon="🐦"
              variant="primary"
            />

            <ShareButton
              onClick={downloadCard}
              label={isGenerating ? dict.share.downloadingButton : dict.share.downloadButton}
              icon="📥"
              variant="secondary"
              disabled={isGenerating}
            />

            <ShareButton
              onClick={() => {
                sessionStorage.removeItem("uraCharaResult");
                sessionStorage.removeItem("uraCharaInput");
                router.push(`/${locale}/input`);
              }}
              label={dict.share.retryButton}
              icon="🔄"
              variant="secondary"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
