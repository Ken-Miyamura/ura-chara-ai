"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
            裏キャラ AI
          </span>
        </Link>
      </div>
    </header>
  );
}
