"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import GapScoreDisplay from "@/components/result/GapScoreDisplay";
import PersonaCard from "@/components/result/PersonaCard";
import TraitComparisonList from "@/components/result/TraitComparisonList";
import ShareButton from "@/components/share/ShareButton";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";
import type { AnalysisResult } from "@/types/shared";

// 演出シーケンスの各フェーズ
type RevealPhase =
  | "dark"
  | "intro"
  | "surface"
  | "transition"
  | "hidden"
  | "gap"
  | "traits"
  | "share";

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) ?? "ja";
  const dict = getDictionarySync(locale);

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("dark");

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

  // 演出シーケンス
  useEffect(() => {
    if (!result) return;

    const sequence: { phase: RevealPhase; delay: number }[] = [
      { phase: "intro", delay: 500 },
      { phase: "surface", delay: 2000 },
      { phase: "transition", delay: 4000 },
      { phase: "hidden", delay: 5500 },
      { phase: "gap", delay: 7500 },
      { phase: "traits", delay: 10000 },
      { phase: "share", delay: 13000 },
    ];

    const timers = sequence.map(({ phase, delay }) =>
      setTimeout(() => setRevealPhase(phase), delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">{dict.result.loading}</div>
      </div>
    );
  }

  const phaseIndex = [
    "dark",
    "intro",
    "surface",
    "transition",
    "hidden",
    "gap",
    "traits",
    "share",
  ].indexOf(revealPhase);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header locale={locale} />

      <main className="max-w-lg mx-auto px-4 pt-20 pb-32">
        <AnimatePresence>
          {/* Phase 1: Dark screen */}
          {revealPhase === "dark" && (
            <motion.div
              key="dark"
              className="fixed inset-0 bg-background z-50"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Phase 2: Intro text */}
          {phaseIndex >= 1 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-12"
            >
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-lg text-zinc-400"
              >
                {dict.result.introText}
              </motion.p>
            </motion.div>
          )}

          {/* Phase 3: Surface persona */}
          {phaseIndex >= 2 && (
            <div key="surface" className="mb-8">
              <PersonaCard
                type="surface"
                emoji={result.surface.emoji}
                title={result.surface.title}
                traits={result.surface.traits}
                summary={result.surface.summary}
                keywords={[]}
                delay={0}
                locale={locale}
              />
            </div>
          )}

          {/* Phase 4: Transition text */}
          {phaseIndex >= 3 && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center my-8"
            >
              <p className="text-2xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                {dict.result.transitionText}
              </p>
            </motion.div>
          )}

          {/* Phase 5: Hidden persona */}
          {phaseIndex >= 4 && (
            <div key="hidden" className="mb-8">
              <PersonaCard
                type="hidden"
                emoji={result.hidden.emoji}
                title={result.hidden.title}
                traits={result.hidden.traits}
                summary={result.hidden.summary}
                keywords={[]}
                delay={0}
                locale={locale}
              />

              {/* 根拠 */}
              {result.hidden.evidence.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
                >
                  <p className="text-xs text-zinc-500 mb-2">{dict.result.evidenceTitle}</p>
                  <ul className="space-y-1">
                    {result.hidden.evidence.map((ev, i) => (
                      <li key={i} className="text-xs text-zinc-400">
                        &quot;{ev}&quot;
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          )}

          {/* Phase 6: Gap score */}
          {phaseIndex >= 5 && (
            <div key="gap" className="my-12">
              <GapScoreDisplay
                score={result.gap.overallGapScore}
                level={result.gap.gapLevel}
                levelLabel={result.gap.gapLevelLabel}
                aiComment={result.gap.aiComment}
                delay={0}
                locale={locale}
              />
            </div>
          )}

          {/* Phase 7: Trait comparisons */}
          {phaseIndex >= 6 && (
            <div key="traits" className="my-12">
              <TraitComparisonList
                comparisons={result.gap.traitComparisons}
                delay={0}
                locale={locale}
              />

              {/* 意外な発見 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 p-5 rounded-xl bg-gradient-to-br from-purple-950/50 to-pink-950/50 border border-purple-500/20"
              >
                <h4 className="text-sm text-zinc-400 mb-2">{dict.result.surprisingFindingTitle}</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {result.gap.surprisingFinding}
                </p>
              </motion.div>
            </div>
          )}

          {/* Phase 8: Share button */}
          {phaseIndex >= 7 && (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <ShareButton
                onClick={() => router.push(`/${locale}/share`)}
                label={dict.result.shareButton}
                icon="📤"
                variant="primary"
              />

              <ShareButton
                onClick={() => {
                  sessionStorage.removeItem("uraCharaResult");
                  sessionStorage.removeItem("uraCharaInput");
                  router.push(`/${locale}/input`);
                }}
                label={dict.result.retryButton}
                icon="🔄"
                variant="secondary"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
