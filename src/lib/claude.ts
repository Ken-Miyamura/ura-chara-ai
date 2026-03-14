// Claude API クライアントラッパー
// See: docs/technical-architecture.md Section 4

import Anthropic from "@anthropic-ai/sdk";
import { API_CONFIG } from "@/lib/constants";
import { parseAnalysisResponse } from "@/lib/parseAnalysis";
import { ANALYSIS_RESULT_TOOL_SCHEMA, buildAnalysisPrompt } from "@/prompts/analysis";
import { SYSTEM_PROMPT } from "@/prompts/system";
import type { AnalysisResult, UserInput } from "@/types/shared";

/** Claude APIクライアント（サーバーサイドのみ） */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** APIパラメータ（constants.ts の API_CONFIG から取得） */
const MODEL = API_CONFIG.claudeModel;
const TEMPERATURE = API_CONFIG.claudeTemperature;
const MAX_TOKENS = API_CONFIG.claudeMaxTokens;

/**
 * ユーザー入力データからペルソナ分析を実行する。
 *
 * Claude APIのtool-useパターンを使って構造化されたJSONレスポンスを保証する。
 * ツールとして AnalysisResult スキーマを定義し、Claudeに「呼び出させる」ことで
 * 有効なJSONを確実に取得する。
 *
 * @param input - ユーザーの入力データ
 * @returns 完全なAnalysisResult（ID・タイムスタンプ付き）
 * @throws Error - API呼び出しまたはレスポンス解析に失敗した場合
 */
export async function analyzePersona(input: UserInput): Promise<AnalysisResult> {
  const userPrompt = buildAnalysisPrompt(input);

  // クライアントサイドUUID生成
  const id = crypto.randomUUID();
  const analyzedAt = new Date().toISOString();

  // タイムアウト用AbortController
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), API_CONFIG.claudeTimeoutMs);

  let response: Anthropic.Message;
  try {
    response = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        tools: [ANALYSIS_RESULT_TOOL_SCHEMA],
        tool_choice: {
          type: "tool",
          name: ANALYSIS_RESULT_TOOL_SCHEMA.name,
        },
      },
      { signal: abortController.signal },
    );
  } catch (err) {
    if (
      (err instanceof Error && err.name === "AbortError") ||
      (err instanceof Error && err.message.includes("aborted"))
    ) {
      throw new Error("分析がタイムアウトしました。もう一度お試しください。");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // レスポンスを解析・バリデーション
  return parseAnalysisResponse(response, id, analyzedAt);
}
