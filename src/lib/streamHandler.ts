// === UraChara AI - SSE Stream Utilities ===
// Server-Sent Events のストリーム作成・エンコード・デコード

import type {
  StreamEvent,
  StreamEventType,
  TypedStreamEvent,
  AnalysisPhase,
  AnalysisResult,
} from "@/types/shared";
import { PHASE_LABELS } from "./constants";

// === SSE Encoder ===

/** StreamEventをSSE形式の文字列にエンコード */
export function encodeStreamEvent(
  type: StreamEventType,
  data: StreamEvent
): string {
  const event: TypedStreamEvent = { type, data };
  return `event: ${type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/** フェーズ更新イベントを作成 */
export function createPhaseEvent(phase: AnalysisPhase): string {
  const event: StreamEvent = {
    status: "analyzing",
    phase,
    phaseLabel: PHASE_LABELS[phase],
  };
  return encodeStreamEvent("phase", event);
}

/** 部分テキストイベントを作成 */
export function createPartialEvent(
  phase: AnalysisPhase,
  partialText: string
): string {
  const event: StreamEvent = {
    status: "analyzing",
    phase,
    phaseLabel: PHASE_LABELS[phase],
    partialText,
  };
  return encodeStreamEvent("partial", event);
}

/** 完了イベントを作成 */
export function createResultEvent(result: AnalysisResult): string {
  const event: StreamEvent = {
    status: "complete",
    phase: 4,
    phaseLabel: PHASE_LABELS[4],
    result,
  };
  return encodeStreamEvent("result", event);
}

/** エラーイベントを作成 */
export function createErrorEvent(error: string): string {
  const event: StreamEvent = {
    status: "error",
    phase: 1,
    phaseLabel: "",
    error,
  };
  return encodeStreamEvent("error", event);
}

// === SSE Response Helper ===

/** SSEレスポンス用のヘッダー */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Content-Type-Options": "nosniff",
} as const;

/** SSEストリームを作成するヘルパー */
export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>;
  writer: {
    sendPhase: (phase: AnalysisPhase) => void;
    sendPartial: (phase: AnalysisPhase, text: string) => void;
    sendResult: (result: AnalysisResult) => void;
    sendError: (error: string) => void;
    close: () => void;
  };
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  let closed = false;

  function enqueue(text: string): void {
    if (controller && !closed) {
      controller.enqueue(encoder.encode(text));
    }
  }

  const writer = {
    sendPhase(phase: AnalysisPhase): void {
      enqueue(createPhaseEvent(phase));
    },
    sendPartial(phase: AnalysisPhase, text: string): void {
      enqueue(createPartialEvent(phase, text));
    },
    sendResult(result: AnalysisResult): void {
      enqueue(createResultEvent(result));
    },
    sendError(error: string): void {
      enqueue(createErrorEvent(error));
    },
    close(): void {
      if (controller && !closed) {
        closed = true;
        controller.close();
      }
    },
  };

  return { stream, writer };
}

// === SSE Decoder (Client-side) ===

/** SSEイベント文字列をパース */
export function decodeStreamEvent(
  eventString: string
): TypedStreamEvent | null {
  const lines = eventString.split("\n");
  let eventType: string | null = null;
  let dataStr: string | null = null;

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      eventType = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      dataStr = line.slice(6);
    }
  }

  if (!eventType || !dataStr) {
    return null;
  }

  try {
    const parsed = JSON.parse(dataStr) as TypedStreamEvent;
    return parsed;
  } catch {
    return null;
  }
}

/** SSEストリームを読み取るユーティリティ */
export async function readSSEStream(
  response: Response,
  onEvent: (event: TypedStreamEvent) => void
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSEイベントは "\n\n" で区切られる
      const events = buffer.split("\n\n");
      // 最後の要素は不完全な可能性があるのでバッファに残す
      buffer = events.pop() ?? "";

      for (const eventStr of events) {
        if (eventStr.trim()) {
          const parsed = decodeStreamEvent(eventStr);
          if (parsed) {
            onEvent(parsed);
          }
        }
      }
    }

    // 残りのバッファを処理
    if (buffer.trim()) {
      const parsed = decodeStreamEvent(buffer);
      if (parsed) {
        onEvent(parsed);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
