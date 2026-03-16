// === POST /api/analyze ===
// メイン分析エンドポイント。ユーザー入力を受け取り、SSEでストリーミング返却。

import { type NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT } from "@/lib/constants";
import { createSSEStream, SSE_HEADERS } from "@/lib/streamHandler";
import { sanitizeUserInput, validateUserInput } from "@/lib/validation";
import type { AnalysisResult, Locale, RateLimitInfo, UserInput } from "@/types/shared";
import { SUPPORTED_LOCALES } from "@/types/shared";

// === In-memory Rate Limiting ===

/** IPごとのリクエストタイムスタンプを保持 */
const rateLimitMap = new Map<string, number[]>();

/** 古いエントリをクリーンアップ */
function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT.windowMs);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}

/** 定期クリーンアップ */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanupTimer(): void {
  if (cleanupTimer === null) {
    cleanupTimer = setInterval(cleanupRateLimitMap, RATE_LIMIT.cleanupIntervalMs);
    // Node.js環境ではプロセス終了を妨げないようにunref
    if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
      cleanupTimer.unref();
    }
  }
}

/** レート制限チェック */
function checkRateLimit(ip: string): RateLimitInfo {
  ensureCleanupTimer();
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];

  // ウィンドウ内のリクエストのみフィルタ
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT.windowMs);

  if (validTimestamps.length >= RATE_LIMIT.maxRequests) {
    // 最も古いリクエストが期限切れになるまでの時間
    const oldestTimestamp = validTimestamps[0];
    const retryAfterMs = RATE_LIMIT.windowMs - (now - oldestTimestamp);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // リクエストを記録
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);

  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - validTimestamps.length,
  };
}

/** クライアントIPを取得 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/** ロケールのバリデーション。無効な値の場合は "ja" にフォールバック */
function validateLocale(value: unknown): Locale {
  if (typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return "ja";
}

// === Route Handler ===

export async function POST(request: NextRequest): Promise<Response> {
  // 1. レート制限チェック
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "混み合っています。しばらく待ってからもう一度お試しください。",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      },
    );
  }

  // 2. リクエストボディの解析
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません。" }, { status: 400 });
  }

  // 3. ロケールの取得・バリデーション
  const locale = validateLocale(rawBody.locale);

  // 4. サニタイズ
  const rawInput = rawBody as Partial<UserInput>;
  const sanitizedInput = sanitizeUserInput(rawInput);

  // 5. バリデーション
  const validation = validateUserInput(sanitizedInput);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: "入力内容に問題があります。",
        validationErrors: validation.errors,
      },
      { status: 400 },
    );
  }

  // 6. SSEストリームを作成して分析開始
  const { stream, writer } = createSSEStream();

  // 非同期で分析実行（ストリームは即座に返す）
  runAnalysis(sanitizedInput, locale, writer).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : "予期しないエラーが発生しました。";
    writer.sendError(message);
    writer.close();
  });

  return new Response(stream, {
    status: 200,
    headers: SSE_HEADERS,
  });
}

/** 分析を非同期で実行 */
async function runAnalysis(
  input: UserInput,
  locale: Locale,
  writer: ReturnType<typeof createSSEStream>["writer"],
): Promise<void> {
  try {
    // Phase 1: データ読み込み
    writer.sendPhase(1);

    // Phase 2: 表の顔を分析
    writer.sendPhase(2);

    // analyzePersona() は src/lib/claude.ts に実装
    // 動的インポートで存在しない場合もエラーにならないように
    let analyzePersona: (input: UserInput, locale: Locale) => Promise<AnalysisResult>;

    try {
      const claudeModule = await import("@/lib/claude");
      analyzePersona = claudeModule.analyzePersona;
    } catch {
      // claude.ts がまだ実装されていない場合のフォールバック
      writer.sendError("分析機能は現在準備中です。もう少しお待ちください。");
      writer.close();
      return;
    }

    // Phase 3: 裏の顔を暴く
    writer.sendPhase(3);

    const result = await analyzePersona(input, locale);

    // Phase 4: ギャップスコア計算 → 結果送信
    writer.sendPhase(4);
    writer.sendResult(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "分析中にエラーが発生しました。";
    writer.sendError(message);
  } finally {
    writer.close();
  }
}
