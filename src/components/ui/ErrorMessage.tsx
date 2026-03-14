"use client";

import { motion } from "framer-motion";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

// 面白いエラーメッセージ (product-design.md のトーンに合わせて)
export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
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
        <h3 className="text-lg font-bold text-red-400">あれ、エラーだ...</h3>
        <p className="text-sm text-zinc-400 max-w-sm">{message}</p>
      </div>

      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium"
        >
          もう一回やってみる 🔄
        </motion.button>
      )}
    </motion.div>
  );
}
