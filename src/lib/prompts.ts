// プロンプト構築ヘルパー関数
// See: docs/technical-architecture.md Section 4

import type { UserInput } from "@/types/shared";

/**
 * UserInput をフォーマットされた文字列に変換する。
 * 空のオプションフィールドは「（未入力）」として表示。
 * 必須フィールド（snsContent, hobbies）は常に含まれる。
 */
export function formatUserInput(input: UserInput): string {
  const lines: string[] = [];

  // 必須フィールド — 常に含める
  lines.push(`【SNS投稿】\n${input.snsContent}`);
  lines.push(`【趣味・好きなこと】\n${input.hobbies}`);

  // オプションフィールド — 入力がある場合のみ内容を、なければ（未入力）を表示
  lines.push(
    `【1日のスケジュール】\n${formatOptionalField(input.schedule)}`
  );
  lines.push(
    `【よく聴く音楽】\n${formatOptionalField(input.musicTaste)}`
  );
  lines.push(
    `【人からよく言われる第一印象】\n${formatOptionalField(input.firstImpression)}`
  );

  return lines.join("\n\n");
}

/**
 * オプションフィールドの値をフォーマットする。
 * 空文字列やホワイトスペースのみの場合は「（未入力）」を返す。
 */
function formatOptionalField(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "（未入力）";
}
