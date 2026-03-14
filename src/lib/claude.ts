// Claude API クライアントラッパー
// See: docs/technical-architecture.md Section 4

import Anthropic from "@anthropic-ai/sdk";
import type { UserInput, AnalysisResult } from "@/types/shared";
import { SYSTEM_PROMPT } from "@/prompts/system";
import { buildAnalysisPrompt, ANALYSIS_RESULT_TOOL_SCHEMA } from "@/prompts/analysis";
import { parseAnalysisResponse } from "@/lib/parseAnalysis";

/** Claude APIクライアント（サーバーサイドのみ） */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** 使用モデル */
const MODEL = "claude-sonnet-4-6" as const;

/** APIパラメータ */
const TEMPERATURE = 0.8;
const MAX_TOKENS = 4096;

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
export async function analyzePersona(
  input: UserInput
): Promise<AnalysisResult> {
  const userPrompt = buildAnalysisPrompt(input);

  // クライアントサイドUUID生成
  const id = crypto.randomUUID();
  const analyzedAt = new Date().toISOString();

  const response = await anthropic.messages.create({
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
  });

  // レスポンスを解析・バリデーション
  return parseAnalysisResponse(response, id, analyzedAt);
}
