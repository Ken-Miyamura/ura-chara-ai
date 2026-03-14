"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  AnalysisResult,
  AnalysisPhase,
  UserInput,
  StreamEvent,
} from "@/types/shared";

// フェーズラベル (product-design.md Section 2.3 aligned)
const PHASE_LABELS: Record<AnalysisPhase, string> = {
  1: "データを読み込み中...",
  2: "表の顔を分析中...",
  3: "裏の顔を探索中...",
  4: "ギャップスコアを計算中...",
};

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

export function useAnalysis(): UseAnalysisReturn {
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
      // Phase 4以降はループ（15秒超の場合）
      if (phaseIndex >= PHASE_TIMINGS.length) {
        phaseTimerRef.current = setTimeout(() => {
          phaseIndex = 1; // Phase 2に戻る
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

      // フェーズタイマー開始
      startPhaseTimer();

      // APIリクエスト
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
          const errorData = await response.json().catch(() => ({ error: "不明なエラーが発生しました" }));
          throw new Error(
            (errorData as { error?: string }).error || `HTTP ${response.status}`
          );
        }

        // SSEストリーム処理
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("ストリームの読み取りに失敗しました");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let analysisComplete = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data) as StreamEvent;

                if (event.status === "complete" && event.result) {
                  // フェーズタイマー停止
                  if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
                  setResult(event.result);
                  setStatus("complete");
                  analysisComplete = true;
                  return;
                }

                if (event.status === "error") {
                  throw new Error(event.error || "分析中にエラーが発生しました");
                }
              } catch (parseError) {
                // JSONパースエラーは無視（部分データの可能性）
                if (parseError instanceof Error && parseError.message.includes("分析中")) {
                  throw parseError;
                }
              }
            }
          }
        }

        // ストリーム完了したが結果が取得できなかった場合
        if (!analysisComplete) {
          throw new Error("分析結果が見つかりませんでした。もう一度お試しください。");
        }
      } catch (err) {
        if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);

        if (err instanceof Error && err.name === "AbortError") {
          return; // キャンセルは無視
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : "裏キャラの探索中に迷子になっちゃった...もう一回やってみて！";
        setError(errorMessage);
        setStatus("error");
      }
    },
    [startPhaseTimer]
  );

  return {
    startAnalysis,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    result,
    error,
    status,
    isAnalyzing: status === "analyzing",
  };
}
