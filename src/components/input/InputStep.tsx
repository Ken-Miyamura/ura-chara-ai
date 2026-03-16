"use client";

import { motion } from "framer-motion";
import CharCounter from "@/components/ui/CharCounter";
import TagChips from "@/components/ui/TagChips";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";
import type { InputFieldConfig } from "@/types/shared";

interface InputStepProps {
  config: InputFieldConfig;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isFirst: boolean;
  isLast: boolean;
  selectedChips: string[];
  onChipToggle: (chip: string) => void;
  locale?: Locale;
}

// 入力ウィザードの1ステップ
export default function InputStep({
  config,
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
  isFirst,
  isLast,
  selectedChips,
  onChipToggle,
  locale = "ja",
}: InputStepProps) {
  const dict = getDictionarySync(locale);

  const charCount = value.length;
  const trimmedCharCount = value.trim().length;
  const canProceed = config.required
    ? trimmedCharCount >= config.minChars && charCount <= config.maxChars
    : true;

  // Get localized field config
  const fieldId = config.id;
  const label =
    dict.input.stepLabels[fieldId as keyof typeof dict.input.stepLabels] ?? config.label;
  const prompt = dict.input.prompts[fieldId as keyof typeof dict.input.prompts] ?? config.prompt;
  const placeholder =
    dict.input.placeholders[fieldId as keyof typeof dict.input.placeholders] ?? config.placeholder;
  const helpText =
    dict.input.helpText[fieldId as keyof typeof dict.input.helpText] ?? config.helpText;
  const localizedChips =
    fieldId === "hobbies" || fieldId === "firstImpression"
      ? dict.input.chips[fieldId as keyof typeof dict.input.chips]
      : config.chips;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* タイトルとプロンプト */}
      <div>
        <h2 className="text-xl font-bold mb-2">{label}</h2>
        <p className="text-zinc-400 text-sm">{prompt}</p>
      </div>

      {/* タグチップ (該当ステップのみ) */}
      {localizedChips && localizedChips.length > 0 && (
        <TagChips chips={localizedChips} onChipClick={onChipToggle} selectedChips={selectedChips} />
      )}

      {/* テキストエリア */}
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[160px] bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-foreground placeholder-zinc-600 resize-y focus:outline-none focus:border-primary transition-colors"
          maxLength={config.maxChars + 100}
        />
        <div className="mt-2">
          <CharCounter
            current={charCount}
            min={config.minChars}
            max={config.maxChars}
            locale={locale}
          />
        </div>
      </div>

      {/* ヘルプテキスト */}
      <p className="text-xs text-zinc-500 flex items-start gap-1">
        <span>💡</span>
        <span>{helpText}</span>
      </p>

      {/* ナビゲーションボタン */}
      <div className="flex gap-3">
        {!isFirst && onBack && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {dict.input.buttons.back}
          </motion.button>
        )}

        {!config.required && onSkip && !isLast && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            {dict.input.buttons.skip}
          </motion.button>
        )}

        <motion.button
          whileHover={canProceed ? { scale: 1.02 } : undefined}
          whileTap={canProceed ? { scale: 0.98 } : undefined}
          onClick={onNext}
          disabled={!canProceed}
          className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
            canProceed
              ? "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
              : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isLast ? dict.input.buttons.submit : dict.input.buttons.next}
        </motion.button>
      </div>

      {/* 必須マーク */}
      {config.required && (
        <p className="text-xs text-zinc-600 text-center">{dict.input.requiredMark}</p>
      )}
    </motion.div>
  );
}
