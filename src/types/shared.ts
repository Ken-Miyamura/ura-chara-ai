// === UraChara AI - Shared Type Definitions ===
// Single source of truth for all data structures.
// See: docs/technical-architecture.md Section 3

// === Locale ===

/** サポートされるロケール */
export type Locale = "ja" | "en" | "es";

// === User Input ===

/** 入力カテゴリの識別子 */
export type InputCategory =
  | "snsContent"
  | "hobbies"
  | "schedule"
  | "musicTaste"
  | "firstImpression";

/** 各入力フィールドの設定 */
export interface InputFieldConfig {
  id: InputCategory;
  label: string; // 日本語ラベル
  prompt: string; // 入力画面のプロンプト文
  placeholder: string; // プレースホルダーテキスト
  helpText: string; // ヘルプテキスト
  required: boolean;
  minChars: number; // 0 if optional
  maxChars: number;
  chips?: string[]; // タップ可能なタグチップ (Steps 2, 5)
}

/** ユーザー入力データ */
export interface UserInput {
  snsContent: string; // SNS投稿のコピペ — REQUIRED, 50-2000 chars
  hobbies: string; // 趣味・好きなこと — REQUIRED, 20-1000 chars
  schedule: string; // 1日のスケジュール — OPTIONAL, 0-1000 chars
  musicTaste: string; // よく聴く音楽 — OPTIONAL, 0-500 chars
  firstImpression: string; // 人からよく言われる第一印象 — OPTIONAL, 0-500 chars
}

// === Persona Types ===

/** 性格特性（スコア付き） */
export interface PersonaTrait {
  label: string; // e.g., "社交性" (sociability)
  score: number; // 0-100 (internal, used for gap calculation)
  description: string; // 1-2 sentence explanation
}

/** 表の顔（パブリックペルソナ） */
export interface SurfacePersona {
  title: string; // e.g., "意識高い系カフェワーカー" (persona name)
  emoji: string; // Representative emoji
  summary: string; // 2-3 sentence description
  traits: string[]; // 3-5 display trait labels, e.g., ["社交的", "ポジティブ", "アクティブ"]
  scoredTraits: PersonaTrait[]; // 5 scored traits (for gap calculation)
  confidence: number; // 0-100, how strongly this persona shows
}

/** 裏の顔（隠れたペルソナ） */
export interface HiddenPersona {
  title: string; // e.g., "布団から出たくないインドア廃人"
  emoji: string;
  summary: string; // 2-3 sentence description
  traits: string[]; // 3-5 display trait labels
  scoredTraits: PersonaTrait[]; // 5 scored traits (same categories as surface)
  confidence: number; // 0-100
  evidence: string[]; // データから読み取れた根拠 (3-5 items)
}

// === Gap Analysis ===

/** 特性比較データ */
export interface TraitComparison {
  category: string; // e.g., "社交性"
  icon: string; // e.g., "🎭"
  surfaceLabel: string; // e.g., "みんなでワイワイ派" (display text)
  hiddenLabel: string; // e.g., "実は一人が好き" (display text)
  surfaceScore: number; // 0-100 (internal)
  hiddenScore: number; // 0-100 (internal)
  gap: number; // absolute difference
}

/** ギャップレベル */
export type GapLevel =
  | "honest" // 0-20:  素直タイプ
  | "slight" // 21-40: ちょいギャップ
  | "dual" // 41-60: 二面性あり
  | "moe" // 61-80: ギャップ萌え
  | "extreme"; // 81-100: 完全に別人

/** ギャップ分析結果 */
export interface GapAnalysis {
  overallGapScore: number; // 0-100
  gapLevel: GapLevel;
  gapLevelLabel: string; // 日本語ラベル (e.g., "ギャップ萌え")
  traitComparisons: TraitComparison[]; // 5 comparisons
  aiComment: string; // AIのコメント (fun summary paragraph)
  surprisingFinding: string; // 意外な発見
}

// === Final Result ===

/** 分析結果 */
export interface AnalysisResult {
  id: string; // Client-generated UUID
  surface: SurfacePersona;
  hidden: HiddenPersona;
  gap: GapAnalysis;
  shareCard: ShareCardData;
  analyzedAt: string; // ISO 8601 timestamp
}

// === Share Card ===

/** シェアカード用データ */
export interface ShareCardData {
  surfaceTitle: string;
  hiddenTitle: string;
  surfaceEmoji: string;
  hiddenEmoji: string;
  gapScore: number;
  gapLevel: GapLevel;
  gapLevelLabel: string;
  catchphrase: string; // e.g., "見た目は天使、中身は魔王"
  shareText: string; // Pre-filled tweet text
}

// === Streaming State ===

/** 分析フェーズ番号 */
export type AnalysisPhase = 1 | 2 | 3 | 4;

/** SSEストリームイベント */
export interface StreamEvent {
  status: "analyzing" | "complete" | "error";
  phase: AnalysisPhase;
  phaseLabel: string;
  result?: AnalysisResult;
  partialText?: string;
  error?: string;
}

// === Phase Labels (aligned with product-design.md Section 2.3) ===
// Phase 1: "データを読み込み中..." (Loading data)
// Phase 2: "表の顔を分析中..." (Analyzing surface persona)
// Phase 3: "裏の顔を暴き中..." (Exposing hidden persona)
// Phase 4: "ギャップスコアを計算中..." (Calculating gap score)

// === SSE Event Types ===

/** SSEイベントの種類 */
export type StreamEventType = "phase" | "partial" | "result" | "error";

/** 型付きSSEイベント */
export interface TypedStreamEvent {
  type: StreamEventType;
  data: StreamEvent;
}

// === API Request/Response Types ===

/** POST /api/analyze リクエスト */
export interface AnalyzeRequest {
  snsContent: string;
  hobbies: string;
  schedule: string;
  musicTaste: string;
  firstImpression: string;
  locale?: Locale;
}

/** POST /api/analyze レスポンス (non-streaming fallback) */
export interface AnalyzeResponse {
  result?: AnalysisResult;
  error?: string;
}

/** POST /api/share リクエスト */
export interface ShareRequest {
  shareCard: ShareCardData;
}

/** POST /api/share レスポンス */
export interface ShareResponse {
  shareText: string;
}

// === Validation Error Types ===

/** フィールドごとのバリデーションエラー */
export interface FieldValidationError {
  field: InputCategory;
  message: string;
  type: "required" | "min_length" | "max_length";
}

/** バリデーション結果 */
export interface ValidationResult {
  valid: boolean;
  errors: FieldValidationError[];
}

// === Rate Limit Types ===

/** レート制限情報 */
export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}
