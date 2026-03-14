"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { UserInput } from "@/types/shared";
import { useAnalysis } from "@/hooks/useAnalysis";
import LoadingPhase from "@/components/analysis/LoadingPhase";
import ErrorMessage from "@/components/ui/ErrorMessage";

// パーティクルの固定位置（ハイドレーションエラー回避）
const PARTICLE_POSITIONS = [
  { x: 10, y: 15, duration: 3, delay: 0.2 },
  { x: 25, y: 80, duration: 4, delay: 0.5 },
  { x: 45, y: 30, duration: 2.5, delay: 1.0 },
  { x: 60, y: 70, duration: 3.5, delay: 0.3 },
  { x: 80, y: 20, duration: 4.5, delay: 0.8 },
  { x: 15, y: 55, duration: 3, delay: 1.5 },
  { x: 35, y: 90, duration: 2.8, delay: 0.1 },
  { x: 70, y: 45, duration: 3.2, delay: 1.2 },
  { x: 90, y: 60, duration: 4, delay: 0.7 },
  { x: 50, y: 10, duration: 3.8, delay: 1.8 },
  { x: 5, y: 40, duration: 2.5, delay: 0.4 },
  { x: 75, y: 85, duration: 3.5, delay: 1.1 },
  { x: 40, y: 50, duration: 4.2, delay: 0.6 },
  { x: 55, y: 25, duration: 3, delay: 1.4 },
  { x: 85, y: 75, duration: 2.8, delay: 0.9 },
];

export default function AnalyzingPage() {
  const router = useRouter();
  const { startAnalysis, phase, phaseLabel, result, error, status } =
    useAnalysis();
  const hasStarted = useRef(false);

  // マウント時にsessionStorageからデータ取得して分析開始
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const stored = sessionStorage.getItem("uraCharaInput");
    if (!stored) {
      router.push("/input");
      return;
    }

    try {
      const input = JSON.parse(stored) as UserInput;
      startAnalysis(input);
    } catch {
      router.push("/input");
    }

    // Strict Mode の再マウント時に再実行できるようにリセット
    return () => {
      hasStarted.current = false;
    };
  }, [startAnalysis, router]);

  // 分析完了時に結果ページへ遷移
  useEffect(() => {
    if (status === "complete" && result) {
      sessionStorage.setItem("uraCharaResult", JSON.stringify(result));
      // 少し待ってから遷移（最後のフェーズを見せるため）
      const timeout = setTimeout(() => {
        router.push("/result");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [status, result, router]);

  // リトライ
  const handleRetry = () => {
    hasStarted.current = false;
    const stored = sessionStorage.getItem("uraCharaInput");
    if (stored) {
      try {
        const input = JSON.parse(stored) as UserInput;
        startAnalysis(input);
      } catch {
        router.push("/input");
      }
    } else {
      router.push("/input");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* ダーク背景 + グリッチ風エフェクト */}
      <div className="fixed inset-0 pointer-events-none">
        {/* グラデーション背景 */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-background to-background" />

        {/* スキャンライン */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-primary/20"
          animate={{ top: ["-5%", "105%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* グリッチパーティクル（固定位置で配置） */}
        {PARTICLE_POSITIONS.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: pos.duration,
              repeat: Infinity,
              delay: pos.delay,
            }}
          />
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10">
        {status === "error" && error ? (
          <ErrorMessage
            message={error}
            onRetry={handleRetry}
          />
        ) : (
          <LoadingPhase phase={phase} label={phaseLabel} />
        )}
      </div>

      {/* フェイクプログレスバー */}
      {status === "analyzing" && (
        <motion.div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-900">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: ["0%", "90%"] }}
            transition={{ duration: 15, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </div>
  );
}
