"use client";

import { motion } from "framer-motion";

interface TagChipsProps {
  chips: string[];
  onChipClick: (chip: string) => void;
  selectedChips?: string[];
}

export default function TagChips({ chips, onChipClick, selectedChips = [] }: TagChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isSelected = selectedChips.includes(chip);
        return (
          <motion.button
            key={chip}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChipClick(chip)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              isSelected
                ? "bg-primary/20 border-primary text-primary-light"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {chip}
          </motion.button>
        );
      })}
    </div>
  );
}
