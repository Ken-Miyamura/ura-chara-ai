// Claude APIレスポンスの解析・バリデーション
// See: docs/technical-architecture.md Section 4

import type {
  AnalysisResult,
  GapAnalysis,
  GapLevel,
  HiddenPersona,
  Locale,
  PersonaTrait,
  ShareCardData,
  SurfacePersona,
  TraitComparison,
} from "@/types/shared";

/** ギャップスコアからGapLevelへのマッピング（ロケール別ラベル付き） */
const GAP_LEVEL_MAP: ReadonlyArray<{
  max: number;
  level: GapLevel;
  labels: Record<Locale, string>;
}> = [
  {
    max: 20,
    level: "honest",
    labels: { ja: "素直タイプ", en: "What You See Is What You Get", es: "Tipo Auténtico" },
  },
  {
    max: 40,
    level: "slight",
    labels: { ja: "ちょいギャップ", en: "Slight Gap", es: "Pequeña Brecha" },
  },
  { max: 60, level: "dual", labels: { ja: "二面性あり", en: "Two-Faced", es: "Doble Cara" } },
  {
    max: 80,
    level: "moe",
    labels: { ja: "ギャップ萌えタイプ", en: "Charming Gap", es: "Brecha Encantadora" },
  },
  {
    max: 100,
    level: "extreme",
    labels: {
      ja: "完全に別人タイプ",
      en: "Totally Different Person",
      es: "Persona Totalmente Diferente",
    },
  },
];

/** 5つの必須特性軸（ロケール別） */
const REQUIRED_TRAIT_LABELS_BY_LOCALE: Record<Locale, readonly string[]> = {
  ja: ["社交性", "行動力", "感受性", "論理性", "自己主張"],
  en: ["Sociability", "Drive", "Sensitivity", "Logic", "Assertiveness"],
  es: ["Sociabilidad", "Iniciativa", "Sensibilidad", "Lógica", "Asertividad"],
} as const;

/** 後方互換性のためのデフォルト（日本語） */
const REQUIRED_TRAIT_LABELS = REQUIRED_TRAIT_LABELS_BY_LOCALE.ja;

/** 解析エラー用のカスタムエラークラス */
export class AnalysisParseError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly rawData?: unknown,
  ) {
    super(message);
    this.name = "AnalysisParseError";
  }
}

/**
 * ギャップスコアに対応するGapLevelとラベルを返す。
 * スコアは0-100の範囲にクランプされる。
 * @param score - ギャップスコア (0-100)
 * @param locale - ラベルのロケール（デフォルト: "ja"）
 */
export function getGapLevel(
  score: number,
  locale: Locale = "ja",
): {
  level: GapLevel;
  label: string;
} {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const entry = GAP_LEVEL_MAP.find((e) => clampedScore <= e.max);
  // findは必ずヒットする（max: 100があるため）が、型安全のためフォールバック
  return entry
    ? { level: entry.level, label: entry.labels[locale] }
    : { level: "extreme", label: GAP_LEVEL_MAP[4].labels[locale] };
}

/**
 * Claude APIのtool_useレスポンスからAnalysisResultを抽出・バリデーションする。
 *
 * @param response - Anthropic SDK の Message オブジェクト
 * @param id - クライアント生成のUUID
 * @param analyzedAt - ISO 8601 タイムスタンプ
 * @returns バリデーション済みの AnalysisResult
 * @throws AnalysisParseError バリデーション失敗時
 */
export function parseAnalysisResponse(
  response: { content: ReadonlyArray<{ type: string; input?: unknown }> },
  id: string,
  analyzedAt: string,
): AnalysisResult {
  // tool_use ブロックを全て取得し、inputをマージ
  // Haikuは surface/hidden/gap/shareCard を別々の tool_use ブロックで返すことがある
  const toolUseBlocks = response.content.filter((block) => block.type === "tool_use");

  if (toolUseBlocks.length === 0) {
    throw new AnalysisParseError(
      "Claude APIレスポンスにtool_useブロックが見つかりません。",
      "content",
      response.content,
    );
  }

  // 全 tool_use ブロックの input をマージ
  const data: Record<string, unknown> = {};
  for (const block of toolUseBlocks) {
    const rawInput = block.input;
    if (rawInput && typeof rawInput === "object") {
      Object.assign(data, rawInput as Record<string, unknown>);
    }
  }

  // 各セクションの解析・バリデーション
  const surface = parseSurfacePersona(data.surface);
  const hidden = parseHiddenPersona(data.hidden);
  const gap = parseGapAnalysis(data.gap, surface, hidden);
  const shareCard = parseShareCard(data.shareCard, surface, hidden, gap);

  return {
    id,
    surface,
    hidden,
    gap,
    shareCard,
    analyzedAt,
  };
}

/** 表の顔データの解析・バリデーション */
function parseSurfacePersona(raw: unknown): SurfacePersona {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisParseError(
      "表の顔（surface）データが不正または欠落しています。",
      "surface",
      raw,
    );
  }

  const data = raw as Record<string, unknown>;

  validateRequiredString(data, "title", "surface.title");
  validateRequiredString(data, "emoji", "surface.emoji");
  validateRequiredString(data, "summary", "surface.summary");
  validateStringArray(data, "traits", "surface.traits");
  const scoredTraits = parseScoredTraits(data.scoredTraits, "surface.scoredTraits");
  const confidence = validateNumber(data.confidence, "surface.confidence", 0, 100);

  return {
    title: data.title as string,
    emoji: data.emoji as string,
    summary: data.summary as string,
    traits: data.traits as string[],
    scoredTraits,
    confidence,
  };
}

/** 裏の顔データの解析・バリデーション */
function parseHiddenPersona(raw: unknown): HiddenPersona {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisParseError(
      "裏の顔（hidden）データが不正または欠落しています。",
      "hidden",
      raw,
    );
  }

  const data = raw as Record<string, unknown>;

  validateRequiredString(data, "title", "hidden.title");
  validateRequiredString(data, "emoji", "hidden.emoji");
  validateRequiredString(data, "summary", "hidden.summary");
  validateStringArray(data, "traits", "hidden.traits");
  const scoredTraits = parseScoredTraits(data.scoredTraits, "hidden.scoredTraits");
  const confidence = validateNumber(data.confidence, "hidden.confidence", 0, 100);
  validateStringArray(data, "evidence", "hidden.evidence");

  return {
    title: data.title as string,
    emoji: data.emoji as string,
    summary: data.summary as string,
    traits: data.traits as string[],
    scoredTraits,
    confidence,
    evidence: data.evidence as string[],
  };
}

/** ギャップ分析データの解析・バリデーション */
function parseGapAnalysis(
  raw: unknown,
  surface: SurfacePersona,
  hidden: HiddenPersona,
): GapAnalysis {
  if (!raw || typeof raw !== "object") {
    throw new AnalysisParseError(
      "ギャップ分析（gap）データが不正または欠落しています。",
      "gap",
      raw,
    );
  }

  const data = raw as Record<string, unknown>;

  const overallGapScore = validateNumber(data.overallGapScore, "gap.overallGapScore", 0, 100);

  // GapLevel をスコアから正しく算出（Claudeの出力よりスコアベースのマッピングを優先）
  const { level: gapLevel, label: gapLevelLabel } = getGapLevel(overallGapScore);

  const traitComparisons = parseTraitComparisons(data.traitComparisons, surface, hidden);

  validateRequiredString(data, "aiComment", "gap.aiComment");
  validateRequiredString(data, "surprisingFinding", "gap.surprisingFinding");

  return {
    overallGapScore,
    gapLevel,
    gapLevelLabel,
    traitComparisons,
    aiComment: data.aiComment as string,
    surprisingFinding: data.surprisingFinding as string,
  };
}

/** 特性比較データの解析 */
function parseTraitComparisons(
  raw: unknown,
  surface: SurfacePersona,
  hidden: HiddenPersona,
): TraitComparison[] {
  if (!Array.isArray(raw)) {
    // ClaudeがtraitComparisonsを返さなかった場合、scoredTraitsから生成
    return buildTraitComparisonsFromPersonas(surface, hidden);
  }

  const comparisons: TraitComparison[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const comp = item as Record<string, unknown>;

    comparisons.push({
      category: (comp.category as string) || "",
      icon: (comp.icon as string) || "",
      surfaceLabel: (comp.surfaceLabel as string) || "",
      hiddenLabel: (comp.hiddenLabel as string) || "",
      surfaceScore: validateNumber(comp.surfaceScore, "surfaceScore", 0, 100),
      hiddenScore: validateNumber(comp.hiddenScore, "hiddenScore", 0, 100),
      gap: validateNumber(comp.gap, "gap", 0, 100),
    });
  }

  if (comparisons.length < 5) {
    // 不足分をペルソナデータから補完
    const existing = new Set(comparisons.map((c) => c.category));
    const fallback = buildTraitComparisonsFromPersonas(surface, hidden);
    for (const fb of fallback) {
      if (!existing.has(fb.category)) {
        comparisons.push(fb);
      }
    }
  }

  return comparisons.slice(0, 5);
}

/** 特性名からアイコンへのマッピング（全ロケール対応） */
const TRAIT_ICON_MAP: Record<string, string> = {
  // Japanese
  社交性: "🎭",
  行動力: "⚡",
  感受性: "💖",
  論理性: "🧠",
  自己主張: "💬",
  // English
  Sociability: "🎭",
  Drive: "⚡",
  Sensitivity: "💖",
  Logic: "🧠",
  Assertiveness: "💬",
  // Spanish
  Sociabilidad: "🎭",
  Iniciativa: "⚡",
  Sensibilidad: "💖",
  Lógica: "🧠",
  Asertividad: "💬",
};

/** ペルソナのscoredTraitsから特性比較を生成するフォールバック */
function buildTraitComparisonsFromPersonas(
  surface: SurfacePersona,
  hidden: HiddenPersona,
): TraitComparison[] {
  // scoredTraitsから実際のラベルを使用（ロケールに依存しない）
  // scoredTraitsが空の場合のフォールバックとして日本語ラベルを使用
  const traitLabels =
    surface.scoredTraits.length > 0
      ? surface.scoredTraits.map((t) => t.label)
      : [...REQUIRED_TRAIT_LABELS];

  return traitLabels.slice(0, 5).map((label) => {
    const surfaceTrait = surface.scoredTraits.find((t) => t.label === label);
    const hiddenTrait = hidden.scoredTraits.find((t) => t.label === label);
    const sScore = surfaceTrait?.score ?? 50;
    const hScore = hiddenTrait?.score ?? 50;

    return {
      category: label,
      icon: TRAIT_ICON_MAP[label] || "📊",
      surfaceLabel: surfaceTrait?.description ?? "",
      hiddenLabel: hiddenTrait?.description ?? "",
      surfaceScore: sScore,
      hiddenScore: hScore,
      gap: Math.abs(sScore - hScore),
    };
  });
}

/** シェアカードデータの解析・バリデーション */
function parseShareCard(
  raw: unknown,
  surface: SurfacePersona,
  hidden: HiddenPersona,
  gap: GapAnalysis,
): ShareCardData {
  // shareCardデータが不正の場合、他のデータから自動生成
  if (!raw || typeof raw !== "object") {
    return buildShareCardFallback(surface, hidden, gap);
  }

  const data = raw as Record<string, unknown>;

  return {
    surfaceTitle: typeof data.surfaceTitle === "string" ? data.surfaceTitle : surface.title,
    hiddenTitle: typeof data.hiddenTitle === "string" ? data.hiddenTitle : hidden.title,
    surfaceEmoji: typeof data.surfaceEmoji === "string" ? data.surfaceEmoji : surface.emoji,
    hiddenEmoji: typeof data.hiddenEmoji === "string" ? data.hiddenEmoji : hidden.emoji,
    gapScore: gap.overallGapScore,
    gapLevel: gap.gapLevel,
    gapLevelLabel: gap.gapLevelLabel,
    catchphrase:
      typeof data.catchphrase === "string"
        ? data.catchphrase
        : `${surface.title} × ${hidden.title}`,
    shareText:
      typeof data.shareText === "string"
        ? data.shareText
        : `${surface.title}だと思ってたら、中身は${hidden.title}でした。ギャップスコア: ${gap.overallGapScore}点 #裏キャラAI`,
  };
}

/** シェアカードデータのフォールバック生成 */
function buildShareCardFallback(
  surface: SurfacePersona,
  hidden: HiddenPersona,
  gap: GapAnalysis,
): ShareCardData {
  return {
    surfaceTitle: surface.title,
    hiddenTitle: hidden.title,
    surfaceEmoji: surface.emoji,
    hiddenEmoji: hidden.emoji,
    gapScore: gap.overallGapScore,
    gapLevel: gap.gapLevel,
    gapLevelLabel: gap.gapLevelLabel,
    catchphrase: `${surface.title} × ${hidden.title}`,
    shareText: `${surface.title}だと思ってたら、中身は${hidden.title}でした。ギャップスコア: ${gap.overallGapScore}点 #裏キャラAI`,
  };
}

/** スコア付き特性の解析（ロケールに依存しない検証） */
function parseScoredTraits(raw: unknown, fieldPath: string): PersonaTrait[] {
  if (!Array.isArray(raw)) {
    throw new AnalysisParseError(`${fieldPath}は配列である必要があります。`, fieldPath, raw);
  }

  const traits: PersonaTrait[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const trait = item as Record<string, unknown>;

    traits.push({
      label: typeof trait.label === "string" ? trait.label : "",
      score: validateNumber(trait.score, `${fieldPath}[].score`, 0, 100),
      description: typeof trait.description === "string" ? trait.description : "",
    });
  }

  // 5つの特性が含まれているか検証（ロケールに依存しない — どのロケールのラベルでもOK）
  // 全ロケールの有効なラベルセットを作成
  const allValidLabels = new Set(Object.values(REQUIRED_TRAIT_LABELS_BY_LOCALE).flat());

  const existingLabels = traits.map((t) => t.label);
  const validTraitCount = existingLabels.filter((l) => allValidLabels.has(l)).length;

  if (validTraitCount < 5) {
    // どのロケールで返ってきたか特定して、不足分を報告
    throw new AnalysisParseError(
      `${fieldPath}には5つの特性軸が必要ですが、${validTraitCount}個しか有効な特性がありません。`,
      fieldPath,
      raw,
    );
  }

  return traits;
}

// === バリデーションヘルパー ===

function validateRequiredString(
  data: Record<string, unknown>,
  key: string,
  fieldPath: string,
): void {
  if (typeof data[key] !== "string" || (data[key] as string).trim() === "") {
    throw new AnalysisParseError(
      `${fieldPath}は空でない文字列である必要があります。`,
      fieldPath,
      data[key],
    );
  }
}

function validateStringArray(data: Record<string, unknown>, key: string, fieldPath: string): void {
  if (!Array.isArray(data[key])) {
    throw new AnalysisParseError(`${fieldPath}は配列である必要があります。`, fieldPath, data[key]);
  }
}

function validateNumber(value: unknown, fieldPath: string, min: number, max: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    // 文字列で数値が入っている場合の対応
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new AnalysisParseError(`${fieldPath}は数値である必要があります。`, fieldPath, value);
    }
    return Math.max(min, Math.min(max, Math.round(parsed)));
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}
