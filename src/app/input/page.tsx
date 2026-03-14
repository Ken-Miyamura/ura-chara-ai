"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import type { InputFieldConfig, InputCategory, UserInput } from "@/types/shared";
import Header from "@/components/layout/Header";
import ProgressBar from "@/components/ui/ProgressBar";
import InputStep from "@/components/input/InputStep";

// 各ステップの設定 (product-design.md Section 3)
const INPUT_STEPS: InputFieldConfig[] = [
  {
    id: "snsContent",
    label: "📱 SNS投稿",
    prompt: "最近のSNS投稿をコピペしてください。Twitter、Instagram、なんでもOK！",
    placeholder:
      "例：今日もカフェで仕事なう☕ / 週末は友達と渋谷で飲み🍻 / この映画マジで泣いた😭",
    helpText: "5〜10投稿分くらいがベスト。多いほど精度UP！",
    required: true,
    minChars: 50,
    maxChars: 2000,
  },
  {
    id: "hobbies",
    label: "🎯 趣味・興味",
    prompt: "ハマっていること、好きなこと、教えてください！",
    placeholder:
      "例：最近はソロキャンプにハマってる。あとNetflixで韓ドラ見まくり。週末は筋トレ。",
    helpText: "人に言う趣味も、こっそりな趣味も、全部書いてOK！",
    required: true,
    minChars: 20,
    maxChars: 1000,
    chips: [
      "アニメ",
      "ゲーム",
      "読書",
      "筋トレ",
      "料理",
      "旅行",
      "カメラ",
      "推し活",
      "DIY",
      "投資",
    ],
  },
  {
    id: "schedule",
    label: "🕐 1日のスケジュール",
    prompt: "典型的な1日の過ごし方を教えてください。",
    placeholder:
      "例：7時起床→満員電車→9-18時仕事→ジム→帰宅→YouTube見ながら寝落ち",
    helpText:
      "リアルな過ごし方でOK。「理想の1日」じゃなくて「実際の1日」を！",
    required: false,
    minChars: 0,
    maxChars: 1000,
  },
  {
    id: "musicTaste",
    label: "🎵 音楽の好み",
    prompt: "よく聴くアーティストや曲を教えてください！",
    placeholder:
      "例：YOASOBI、King Gnu、藤井風。深夜はCity Popとか聴いてる。Spotifyのプレイリストはほぼアニソン。",
    helpText: "ジャンル、アーティスト名、プレイリストの雰囲気、なんでもOK",
    required: false,
    minChars: 0,
    maxChars: 500,
  },
  {
    id: "firstImpression",
    label: "👤 第一印象",
    prompt: "周りの人にどう思われてると感じますか？",
    placeholder:
      "例：よく「しっかりしてるね」って言われるけど、実は毎朝ギリギリで家出てる。",
    helpText: "よく言われること、よく使われるあだ名、第一印象で言われたことなど",
    required: false,
    minChars: 0,
    maxChars: 500,
    chips: [
      "しっかり者",
      "天然",
      "明るい",
      "クール",
      "真面目",
      "不思議ちゃん",
      "いじられキャラ",
      "聞き上手",
    ],
  },
];

export default function InputPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<UserInput>({
    snsContent: "",
    hobbies: "",
    schedule: "",
    musicTaste: "",
    firstImpression: "",
  });
  const [selectedChips, setSelectedChips] = useState<Record<string, string[]>>({
    hobbies: [],
    firstImpression: [],
  });

  const config = INPUT_STEPS[currentStep];

  // テキスト変更
  const handleChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [config.id]: value,
      }));
    },
    [config.id]
  );

  // チップのトグル（テキストに追加/削除）
  const handleChipToggle = useCallback(
    (chip: string) => {
      const fieldId = config.id;
      setSelectedChips((prev) => {
        const currentChips = prev[fieldId] || [];
        const isSelected = currentChips.includes(chip);
        const newChips = isSelected
          ? currentChips.filter((c) => c !== chip)
          : [...currentChips, chip];

        // テキストにも反映
        const currentText = formData[fieldId as keyof UserInput];
        if (isSelected) {
          // チップ削除: テキストからも削除
          const newText = currentText
            .replace(new RegExp(`(、)?${chip}(、)?`), (_, before, after) => {
              if (before && after) return "、";
              return "";
            })
            .trim();
          setFormData((prev) => ({ ...prev, [fieldId]: newText }));
        } else {
          // チップ追加: テキストに追加
          const separator = currentText.length > 0 ? "、" : "";
          setFormData((prev) => ({
            ...prev,
            [fieldId]: currentText + separator + chip,
          }));
        }

        return { ...prev, [fieldId]: newChips };
      });
    },
    [config.id, formData]
  );

  // 次へ
  const handleNext = useCallback(() => {
    if (currentStep < INPUT_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // 最終ステップ: sessionStorageに保存して分析ページへ
      sessionStorage.setItem("uraCharaInput", JSON.stringify(formData));
      router.push("/analyzing");
    }
  }, [currentStep, formData, router]);

  // 戻る
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // スキップ
  const handleSkip = useCallback(() => {
    if (currentStep < INPUT_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-20 pb-8">
        {/* プログレスバー */}
        <div className="mb-8">
          <ProgressBar
            currentStep={currentStep + 1}
            totalSteps={INPUT_STEPS.length}
          />
        </div>

        {/* 入力ステップ */}
        <AnimatePresence mode="wait">
          <InputStep
            key={config.id}
            config={config}
            value={formData[config.id as InputCategory]}
            onChange={handleChange}
            onNext={handleNext}
            onBack={currentStep > 0 ? handleBack : undefined}
            onSkip={!config.required ? handleSkip : undefined}
            isFirst={currentStep === 0}
            isLast={currentStep === INPUT_STEPS.length - 1}
            selectedChips={selectedChips[config.id] || []}
            onChipToggle={handleChipToggle}
          />
        </AnimatePresence>
      </main>
    </div>
  );
}
