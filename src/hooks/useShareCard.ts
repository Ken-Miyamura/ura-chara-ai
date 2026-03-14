"use client";

import { useState, useCallback, useRef } from "react";
import type { ShareCardData } from "@/types/shared";

interface UseShareCardReturn {
  cardRef: React.RefObject<HTMLDivElement | null>;
  generateCard: () => Promise<HTMLCanvasElement | null>;
  shareToTwitter: (shareData: ShareCardData) => void;
  downloadCard: () => Promise<void>;
  isGenerating: boolean;
}

export function useShareCard(): UseShareCardReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // html2canvasでカード画像を生成
  const generateCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2, // 高解像度
        useCORS: true,
        logging: false,
      });
      return canvas;
    } catch (err) {
      console.error("カード生成エラー:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Twitter/Xでシェア
  const shareToTwitter = useCallback((shareData: ShareCardData) => {
    const text = shareData.shareText;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // カード画像をPNGとしてダウンロード
  const downloadCard = useCallback(async () => {
    const canvas = await generateCard();
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "ura-chara-result.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [generateCard]);

  return {
    cardRef,
    generateCard,
    shareToTwitter,
    downloadCard,
    isGenerating,
  };
}
