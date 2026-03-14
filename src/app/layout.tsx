import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "裏キャラ AI - あなたの裏の顔、暴いてみない？",
  description:
    "SNSの投稿、趣味、音楽の好み...AIがあなたの「表の顔」と「裏の顔」のギャップを暴きます。",
  openGraph: {
    title: "裏キャラ AI",
    description: "あなたの裏の顔、暴いてみない？",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "裏キャラ AI",
    description: "あなたの裏の顔、暴いてみない？",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
