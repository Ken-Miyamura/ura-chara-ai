"use client";

import { motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { getDictionarySync } from "@/i18n/getDictionary";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  locale?: Locale;
}

export default function ErrorMessage({ message, onRetry, locale = "ja" }: ErrorMessageProps) {
  const dict = getDictionarySync(locale);
  const emoji = "🫠";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 text-center p-6"
    >
      <motion.span
        className="text-5xl"
        animate={{ rotate: [0, -10, 10, -5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {emoji}
      </motion.span>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-red-400">{dict.common.errorTitle}</h3>
        <p className="text-sm text-zinc-400 max-w-sm">{message}</p>
      </div>

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium"
        >
          {dict.common.retryButton}
        </motion.button>
      )}
    </motion.div>
  );
}
