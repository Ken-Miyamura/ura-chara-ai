// === POST /api/share ===
// シェアテキスト生成エンドポイント

import { type NextRequest, NextResponse } from "next/server";
import { APP_META } from "@/lib/constants";
import type { ShareCardData, ShareRequest, ShareResponse } from "@/types/shared";

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

/** シェアテキストを生成 */
function generateShareText(shareCard: ShareCardData): string {
  const hashtags = APP_META.hashtags.map((tag) => `#${tag}`).join(" ");
  return `私の裏キャラは「${shareCard.hiddenTitle}」でした！ギャップスコア: ${shareCard.gapScore}点 ${hashtags}`;
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

  // 3. シェアテキスト生成
  const shareText = generateShareText(body.shareCard);
  const shareUrl = generateShareUrl(shareText);

  const response: ShareResponse & { shareUrl: string } = {
    shareText,
    shareUrl,
  };

  return NextResponse.json(response, { status: 200 });
}
