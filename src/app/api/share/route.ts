// === POST /api/share ===
// シェアテキスト生成エンドポイント (i18n対応)

import { type NextRequest, NextResponse } from "next/server";
import type { Locale, ShareCardData, ShareRequest, ShareResponse } from "@/types/shared";
import { SUPPORTED_LOCALES } from "@/types/shared";

// === ロケール別ハッシュタグ定義 ===

const HASHTAGS_BY_LOCALE: Record<Locale, readonly string[]> = {
  ja: ["裏キャラAI", "裏キャラ診断"],
  en: ["UraCharaAI", "PersonalityGap"],
  es: ["UraCharaAI", "BrechaDePersonalidad"],
} as const;

// === ロケール別シェアテキストテンプレート ===

type ShareTextGenerator = (shareCard: ShareCardData, hashtags: string) => string;

const SHARE_TEXT_GENERATORS: Record<Locale, ShareTextGenerator> = {
  ja: (shareCard, hashtags) =>
    `私の裏キャラは「${shareCard.hiddenTitle}」でした！ギャップスコア: ${shareCard.gapScore}点 ${hashtags}`,
  en: (shareCard, hashtags) =>
    `Everyone thinks I'm "${shareCard.surfaceTitle}", but I'm really "${shareCard.hiddenTitle}". Gap Score: ${shareCard.gapScore} ${hashtags}`,
  es: (shareCard, hashtags) =>
    `Todos creen que soy "${shareCard.surfaceTitle}", pero en realidad soy "${shareCard.hiddenTitle}". Puntuación: ${shareCard.gapScore} ${hashtags}`,
};

/** ShareCardDataの簡易バリデーション */
function isValidShareCard(data: unknown): data is ShareCardData {
  if (typeof data !== "object" || data === null) return false;
  const card = data as Record<string, unknown>;
  return (
    typeof card.surfaceTitle === "string" &&
    typeof card.hiddenTitle === "string" &&
    typeof card.gapScore === "number" &&
    typeof card.gapLevel === "string" &&
    typeof card.gapLevelLabel === "string"
  );
}

/** ロケールのバリデーション。無効な値の場合は "ja" にフォールバック */
function validateLocale(value: unknown): Locale {
  if (typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return "ja";
}

/** シェアテキストを生成 */
function generateShareText(shareCard: ShareCardData, locale: Locale): string {
  const hashtags = HASHTAGS_BY_LOCALE[locale].map((tag) => `#${tag}`).join(" ");
  return SHARE_TEXT_GENERATORS[locale](shareCard, hashtags);
}

/** Twitter/X シェアURLを生成 */
function generateShareUrl(shareText: string): string {
  const encoded = encodeURIComponent(shareText);
  return `https://twitter.com/intent/tweet?text=${encoded}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. リクエストボディの解析
  let body: ShareRequest;
  try {
    body = (await request.json()) as ShareRequest;
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  // 2. バリデーション
  if (!body.shareCard || !isValidShareCard(body.shareCard)) {
    return NextResponse.json({ error: "シェアカードのデータが不正です。" }, { status: 400 });
  }

  // 3. ロケールの取得・バリデーション
  const locale = validateLocale(body.locale);

  // 4. シェアテキスト生成
  const shareText = generateShareText(body.shareCard, locale);
  const shareUrl = generateShareUrl(shareText);

  const response: ShareResponse & { shareUrl: string } = {
    shareText,
    shareUrl,
  };

  return NextResponse.json(response, { status: 200 });
}
