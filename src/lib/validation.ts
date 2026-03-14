// === UraChara AI - Input Validation ===
// クライアント・サーバー両方で使える共通バリデーション

import type {
  UserInput,
  InputCategory,
  FieldValidationError,
  ValidationResult,
} from "@/types/shared";
import { VALIDATION_RULES } from "./constants";

/** HTMLタグを除去 */
function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** 入力フィールドの文字数を取得（トリム済み） */
function getCharCount(value: string | undefined | null): number {
  if (!value) return 0;
  return value.trim().length;
}

/** 単一フィールドのバリデーション */
function validateField(
  field: InputCategory,
  value: string | undefined | null
): FieldValidationError | null {
  const rule = VALIDATION_RULES[field];
  const charCount = getCharCount(value);

  // 必須チェック
  if (rule.required && charCount === 0) {
    return {
      field,
      message: getRequiredErrorMessage(field),
      type: "required",
    };
  }

  // 任意フィールドで未入力の場合はOK
  if (!rule.required && charCount === 0) {
    return null;
  }

  // 最小文字数チェック
  if (rule.minChars > 0 && charCount < rule.minChars) {
    return {
      field,
      message: getMinLengthErrorMessage(field, rule.minChars, charCount),
      type: "min_length",
    };
  }

  // 最大文字数チェック
  if (charCount > rule.maxChars) {
    return {
      field,
      message: getMaxLengthErrorMessage(field, rule.maxChars, charCount),
      type: "max_length",
    };
  }

  return null;
}

/** ユーザー入力全体のバリデーション */
export function validateUserInput(input: Partial<UserInput>): ValidationResult {
  const errors: FieldValidationError[] = [];

  const fields: InputCategory[] = [
    "snsContent",
    "hobbies",
    "schedule",
    "musicTaste",
    "firstImpression",
  ];

  for (const field of fields) {
    const error = validateField(field, input[field]);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** 入力データをサニタイズ（HTMLタグ除去 + トリム） */
export function sanitizeUserInput(input: Partial<UserInput>): UserInput {
  return {
    snsContent: stripHtmlTags(input.snsContent ?? "").trim(),
    hobbies: stripHtmlTags(input.hobbies ?? "").trim(),
    schedule: stripHtmlTags(input.schedule ?? "").trim(),
    musicTaste: stripHtmlTags(input.musicTaste ?? "").trim(),
    firstImpression: stripHtmlTags(input.firstImpression ?? "").trim(),
  };
}

// === エラーメッセージ（プロダクトデザインのトーンに合わせてカジュアルに） ===

function getRequiredErrorMessage(field: InputCategory): string {
  switch (field) {
    case "snsContent":
      return "SNS投稿は必須だよ！裏キャラを見つけるための大事なデータ！";
    case "hobbies":
      return "趣味・興味は必須！好きなことを教えてくれないと裏キャラが見つけられないよ！";
    default:
      return "この項目は必須です。";
  }
}

function getMinLengthErrorMessage(
  field: InputCategory,
  minChars: number,
  currentChars: number
): string {
  switch (field) {
    case "snsContent":
      return `もうちょっと書いてくれないと、裏キャラ見つけられないよ！（あと${minChars - currentChars}文字）`;
    case "hobbies":
      return `もう少し趣味を教えて！（あと${minChars - currentChars}文字）`;
    default:
      return `最低${minChars}文字必要です。（現在${currentChars}文字）`;
  }
}

function getMaxLengthErrorMessage(
  field: InputCategory,
  maxChars: number,
  currentChars: number
): string {
  return `${maxChars}文字以内にしてね！（現在${currentChars}文字）`;
}
