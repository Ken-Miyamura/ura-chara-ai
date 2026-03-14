"use client";

import { useCallback, useRef, useState } from "react";
import type { ShareCardData } from "@/types/shared";

interface UseShareCardReturn {
  cardRef: React.RefObject<HTMLDivElement | null>;
  generateCard: () => Promise<string | null>;
  shareToTwitter: (shareData: ShareCardData) => void;
  downloadCard: () => Promise<void>;
  isGenerating: boolean;
}

export function useShareCard(): UseShareCardReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // html-to-imageでカード画像を生成
  const generateCard = useCallback(async (): Promise<string | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 2, // 高解像度
      });
      return dataUrl;
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
    const dataUrl = await generateCard();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = "ura-chara-result.png";
    link.href = dataUrl;
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
