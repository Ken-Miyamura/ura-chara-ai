// === UraChara AI - App-wide Constants ===

import type { AnalysisPhase, GapLevel, InputCategory, InputFieldConfig } from "@/types/shared";

// === Gap Level Configuration ===

export interface GapLevelConfig {
  level: GapLevel;
  label: string; // 日本語ラベル
  minScore: number; // 下限スコア（含む）
  maxScore: number; // 上限スコア（含む）
  description: string; // 説明文
}

export const GAP_LEVEL_CONFIGS: readonly GapLevelConfig[] = [
  {
    level: "honest",
    label: "素直タイプ",
    minScore: 0,
    maxScore: 20,
    description: "表も裏もほぼ同じ。What you see is what you get.",
  },
  {
    level: "slight",
    label: "ちょいギャップ",
    minScore: 21,
    maxScore: 40,
    description: "ちょっとだけ裏がある。場に合わせて微妙に変わるタイプ。",
  },
  {
    level: "dual",
    label: "二面性あり",
    minScore: 41,
    maxScore: 60,
    description: "空気を読むのが得意。2つの顔を使い分けてる。",
  },
  {
    level: "moe",
    label: "ギャップ萌えタイプ",
    minScore: 61,
    maxScore: 80,
    description: "表と裏の差がすごい。そのギャップが魅力になってる。",
  },
  {
    level: "extreme",
    label: "完全に別人タイプ",
    minScore: 81,
    maxScore: 100,
    description: "表の自分と裏の自分、もはや別人。二重人格レベル。",
  },
] as const;

/** スコアからギャップレベル設定を取得 */
export function getGapLevelConfig(score: number): GapLevelConfig {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const config = GAP_LEVEL_CONFIGS.find((c) => clamped >= c.minScore && clamped <= c.maxScore);
  // フォールバック（到達不可能だが型安全のため）
  return config ?? GAP_LEVEL_CONFIGS[0];
}

// === Validation Rules ===

export interface FieldValidationRule {
  field: InputCategory;
  required: boolean;
  minChars: number; // 0 = no minimum
  maxChars: number;
}

export const VALIDATION_RULES: Record<InputCategory, FieldValidationRule> = {
  snsContent: {
    field: "snsContent",
    required: true,
    minChars: 50,
    maxChars: 2000,
  },
  hobbies: {
    field: "hobbies",
    required: true,
    minChars: 20,
    maxChars: 1000,
  },
  schedule: {
    field: "schedule",
    required: false,
    minChars: 0,
    maxChars: 1000,
  },
  musicTaste: {
    field: "musicTaste",
    required: false,
    minChars: 0,
    maxChars: 500,
  },
  firstImpression: {
    field: "firstImpression",
    required: false,
    minChars: 0,
    maxChars: 500,
  },
} as const;

// === Input Field Configurations (UI用) ===

export const INPUT_FIELD_CONFIGS: readonly InputFieldConfig[] = [
  {
    id: "snsContent",
    label: "📱 SNS投稿・発信スタイル",
    prompt:
      "最近のSNS投稿をコピペしてください。SNSをやっていない場合は、その理由を教えてください！",
    placeholder:
      "例：今日もカフェで仕事なう☕ / 週末は友達と渋谷で飲み🍻\n\nSNSやってない場合 → 例：人に見られるのが苦手で…/ 時間の無駄だと思ってやめた / 昔はやってたけど疲れた",
    helpText: "SNS投稿は5〜10投稿分がベスト。やっていない人は理由を書くだけでもOK！",
    required: true,
    minChars: 50,
    maxChars: 2000,
  },
  {
    id: "hobbies",
    label: "🎯 趣味・興味",
    prompt: "ハマっていること、好きなこと、教えてください！",
    placeholder: "例：最近はソロキャンプにハマってる。あとNetflixで韓ドラ見まくり。週末は筋トレ。",
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
    placeholder: "例：7時起床→満員電車→9-18時仕事→ジム→帰宅→YouTube見ながら寝落ち",
    helpText: "リアルな過ごし方でOK。「理想の1日」じゃなくて「実際の1日」を！",
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
    placeholder: "例：よく「しっかりしてるね」って言われるけど、実は毎朝ギリギリで家出てる。",
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
] as const;

// === Rate Limit Configuration ===

export const RATE_LIMIT = {
  /** 最大リクエスト数 */
  maxRequests: 5,
  /** ウィンドウ期間（ミリ秒） — 10分 */
  windowMs: 10 * 60 * 1000,
  /** クリーンアップ間隔（ミリ秒） — 5分 */
  cleanupIntervalMs: 5 * 60 * 1000,
} as const;

// === Phase Labels ===

export const PHASE_LABELS: Record<AnalysisPhase, string> = {
  1: "データを読み込み中...",
  2: "表の顔を分析中...",
  3: "裏の顔を暴き中...",
  4: "ギャップスコアを計算中...",
} as const;

// === Trait Axes ===

export const TRAIT_AXES = [
  { key: "sociability", label: "社交性", icon: "🎭" },
  { key: "drive", label: "行動力", icon: "⚡" },
  { key: "sensitivity", label: "感受性", icon: "💖" },
  { key: "logic", label: "論理性", icon: "🧠" },
  { key: "assertiveness", label: "自己主張", icon: "💬" },
] as const;

// === API Configuration ===

export const API_CONFIG = {
  /** Claude API タイムアウト（ミリ秒） */
  claudeTimeoutMs: 60_000,
  /** Claude モデル（メイン分析用） */
  claudeModel: "claude-sonnet-4-6" as const,
  /** Claude 最大トークン数 */
  claudeMaxTokens: 4096,
  /** Claude Temperature */
  claudeTemperature: 0.8,
} as const;

// === App Metadata ===

export const APP_META = {
  name: "裏キャラAI",
  tagline: "あなたの裏キャラ、暴いちゃいます。",
  url: "https://ura-chara.ai",
  hashtags: ["裏キャラAI", "裏キャラ診断"],
} as const;
