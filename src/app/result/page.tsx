"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "@/types/shared";
import Header from "@/components/layout/Header";
import PersonaCard from "@/components/result/PersonaCard";
import GapScoreDisplay from "@/components/result/GapScoreDisplay";
import TraitComparisonList from "@/components/result/TraitComparisonList";
import ShareButton from "@/components/share/ShareButton";

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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("dark");

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
      setTimeout(() => setRevealPhase(phase), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500">読み込み中...</div>
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
      <Header />

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
                あなたの診断結果...
              </motion.p>
            </motion.div>
          )}

          {/* Phase 3: Surface persona */}
          {phaseIndex >= 2 && (
            <div className="mb-8">
              <PersonaCard
                type="surface"
                emoji={result.surface.emoji}
                title={result.surface.title}
                traits={result.surface.traits}
                summary={result.surface.summary}
                keywords={result.surface.traits}
                delay={0}
              />
            </div>
          )}

          {/* Phase 4: Transition text */}
          {phaseIndex >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center my-8"
            >
              <p className="text-2xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                でも、本当は...
              </p>
            </motion.div>
          )}

          {/* Phase 5: Hidden persona */}
          {phaseIndex >= 4 && (
            <div className="mb-8">
              <PersonaCard
                type="hidden"
                emoji={result.hidden.emoji}
                title={result.hidden.title}
                traits={result.hidden.traits}
                summary={result.hidden.summary}
                keywords={result.hidden.traits}
                delay={0}
              />

              {/* 根拠 */}
              {result.hidden.evidence.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800"
                >
                  <p className="text-xs text-zinc-500 mb-2">
                    根拠となったデータ:
                  </p>
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
            <div className="my-12">
              <GapScoreDisplay
                score={result.gap.overallGapScore}
                level={result.gap.gapLevel}
                levelLabel={result.gap.gapLevelLabel}
                aiComment={result.gap.aiComment}
                delay={0}
              />
            </div>
          )}

          {/* Phase 7: Trait comparisons */}
          {phaseIndex >= 6 && (
            <div className="my-12">
              <TraitComparisonList
                comparisons={result.gap.traitComparisons}
                delay={0}
              />

              {/* 意外な発見 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="mt-8 p-5 rounded-xl bg-gradient-to-br from-purple-950/50 to-pink-950/50 border border-purple-500/20"
              >
                <h4 className="text-sm text-zinc-400 mb-2">
                  ── 意外な発見 ──
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {result.gap.surprisingFinding}
                </p>
              </motion.div>
            </div>
          )}

          {/* Phase 8: Share button */}
          {phaseIndex >= 7 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <ShareButton
                onClick={() => router.push("/share")}
                label="結果をシェアする"
                icon="📤"
                variant="primary"
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
