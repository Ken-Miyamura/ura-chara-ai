"use client";

import { AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import InputStep from "@/components/input/InputStep";
import Header from "@/components/layout/Header";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Locale } from "@/i18n/config";
import { INPUT_FIELD_CONFIGS } from "@/lib/constants";
import type { InputCategory, UserInput } from "@/types/shared";

export default function InputPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) ?? "ja";

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

  const config = INPUT_FIELD_CONFIGS[currentStep];

  // テキスト変更
  const handleChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({
        ...prev,
        [config.id]: value,
      }));
    },
    [config.id],
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
        const separator = locale === "ja" ? "\u3001" : ", ";
        if (isSelected) {
          // チップ削除: テキストからも削除
          const escapedChip = chip.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const sepPattern = locale === "ja" ? "\u3001" : ",\\s*";
          const newText = currentText
            .replace(
              new RegExp(`(${sepPattern})?${escapedChip}(${sepPattern})?`),
              (_, before, after) => {
                if (before && after) return separator;
                return "";
              },
            )
            .trim();
          setFormData((prev) => ({ ...prev, [fieldId]: newText }));
        } else {
          // チップ追加: テキストに追加
          const sep = currentText.length > 0 ? separator : "";
          setFormData((prev) => ({
            ...prev,
            [fieldId]: currentText + sep + chip,
          }));
        }

        return { ...prev, [fieldId]: newChips };
      });
    },
    [config.id, formData, locale],
  );

  // 次へ
  const handleNext = useCallback(() => {
    if (currentStep < INPUT_FIELD_CONFIGS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // 最終ステップ: sessionStorageに保存して分析ページへ
      sessionStorage.setItem("uraCharaInput", JSON.stringify(formData));
      router.push(`/${locale}/analyzing`);
    }
  }, [currentStep, formData, router, locale]);

  // 戻る
  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // スキップ
  const handleSkip = useCallback(() => {
    if (currentStep < INPUT_FIELD_CONFIGS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} />

      <main className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pt-20 pb-8">
        {/* プログレスバー */}
        <div className="mb-8">
          <ProgressBar currentStep={currentStep + 1} totalSteps={INPUT_FIELD_CONFIGS.length} />
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
            isLast={currentStep === INPUT_FIELD_CONFIGS.length - 1}
            selectedChips={selectedChips[config.id] || []}
            onChipToggle={handleChipToggle}
            locale={locale}
          />
        </AnimatePresence>
      </main>
    </div>
  );
}
