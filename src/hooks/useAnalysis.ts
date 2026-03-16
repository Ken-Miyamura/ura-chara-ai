"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";
import { readSSEStream } from "@/lib/streamHandler";
import type { AnalysisPhase, AnalysisResult, TypedStreamEvent, UserInput } from "@/types/shared";

// フェーズの時間設定 (秒)
const PHASE_TIMINGS: { phase: AnalysisPhase; at: number }[] = [
  { phase: 1, at: 0 },
  { phase: 2, at: 3 },
  { phase: 3, at: 6 },
  { phase: 4, at: 10 },
];

type AnalysisStatus = "idle" | "analyzing" | "complete" | "error";

interface UseAnalysisReturn {
  startAnalysis: (input: UserInput) => void;
  phase: AnalysisPhase;
  phaseLabel: string;
  result: AnalysisResult | null;
  error: string | null;
  status: AnalysisStatus;
  isAnalyzing: boolean;
}

export function useAnalysis(locale: Locale = "ja"): UseAnalysisReturn {
  const dict = getDictionarySync(locale);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [phase, setPhase] = useState<AnalysisPhase>(1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Get phase label from dictionary
  const getPhaseLabel = useCallback(
    (p: AnalysisPhase): string => {
      const key = String(p) as keyof typeof dict.analyzing.phaseLabels;
      return dict.analyzing.phaseLabels[key] ?? "";
    },
    [dict],
  );

  // 時間ベースのフェーズ進行
  const startPhaseTimer = useCallback(() => {
    let phaseIndex = 0;

    const advancePhase = () => {
      phaseIndex++;
      if (phaseIndex < PHASE_TIMINGS.length) {
        const nextTiming = PHASE_TIMINGS[phaseIndex];
        const currentTiming = PHASE_TIMINGS[phaseIndex - 1];
        const delay = (nextTiming.at - currentTiming.at) * 1000;

        phaseTimerRef.current = setTimeout(() => {
          setPhase(nextTiming.phase);
          advancePhase();
        }, delay);
      }
      if (phaseIndex >= PHASE_TIMINGS.length) {
        phaseTimerRef.current = setTimeout(() => {
          phaseIndex = 1;
          setPhase(2);
          advancePhase();
        }, 5000);
      }
    };

    setPhase(1);
    advancePhase();
  }, []);

  const startAnalysis = useCallback(
    async (input: UserInput) => {
      setStatus("analyzing");
      setError(null);
      setResult(null);
      setPhase(1);

      startPhaseTimer();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: dict.common.apiErrors.unknown }));
          throw new Error((errorData as { error?: string }).error || `HTTP ${response.status}`);
        }

        let analysisHandled = false;

        await readSSEStream(response, (typed: TypedStreamEvent) => {
          if (analysisHandled) return;
          const event = typed.data;

          if (event.status === "complete" && event.result) {
            analysisHandled = true;
            if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
            setResult(event.result);
            setStatus("complete");
            return;
          }

          if (event.status === "error") {
            analysisHandled = true;
            if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
            setError(event.error || dict.common.apiErrors.analysisFailed);
            setStatus("error");
          }
        });

        if (!analysisHandled) {
          throw new Error(dict.common.apiErrors.resultNotFound);
        }
      } catch (err) {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);

        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : dict.common.apiErrors.lostInSearch;
        setError(errorMessage);
        setStatus("error");
      }
    },
    [startPhaseTimer, dict],
  );

  return {
    startAnalysis,
    phase,
    phaseLabel: getPhaseLabel(phase),
    result,
    error,
    status,
    isAnalyzing: status === "analyzing",
  };
}
