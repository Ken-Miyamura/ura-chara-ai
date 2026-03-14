"use client";

import { motion } from "framer-motion";

interface ShareButtonProps {
  onClick: () => void;
  label: string;
  icon?: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

// シェアボタン (パルスアニメーション付き)
export default function ShareButton({
  onClick,
  label,
  icon = "📤",
  variant = "primary",
  disabled = false,
}: ShareButtonProps) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      animate={
        variant === "primary" && !disabled
          ? {
              boxShadow: [
                "0 0 20px rgba(168, 85, 247, 0.3)",
                "0 0 40px rgba(168, 85, 247, 0.6), 0 0 60px rgba(236, 72, 153, 0.2)",
                "0 0 20px rgba(168, 85, 247, 0.3)",
              ],
            }
          : undefined
      }
      transition={
        variant === "primary"
          ? { boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
          : undefined
      }
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-colors ${
        variant === "primary"
          ? "bg-gradient-to-r from-primary to-accent text-white"
          : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}
