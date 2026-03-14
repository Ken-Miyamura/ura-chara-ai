# UraChara AI - Technical Architecture

## 1. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | Next.js 14 (App Router) | 16.x (installed) | SSR, API routes, streaming support |
| Language | TypeScript (strict mode) | 5.x | Type safety, no `any` allowed |
| Styling | Tailwind CSS | 4.x | Utility-first, rapid UI development |
| Animation | Framer Motion | 12.x | Reveal animations, page transitions |
| AI | Anthropic Claude API | SDK 0.78+ | claude-sonnet-4-6 for analysis, claude-haiku-4-5-20251001 for lightweight tasks |
| Screenshot | html2canvas | latest | Client-side share card image generation |
| State | Client-side only (React state) | — | No DB in MVP |
| Deployment | Vercel | — | Native Next.js support, edge functions |

### Not Used in MVP
- No database (Supabase, Prisma, etc.)
- No ORM
- No SNS API integrations (Instagram, X, etc.)
- No authentication

---

## 2. API Endpoints

### POST `/api/analyze`

Main analysis endpoint. Accepts user input, runs the AI prompt chain, and streams back the result.

**Request Body:**
```typescript
{
  snsContent: string;       // SNS投稿のコピペ — REQUIRED, 50-2000 chars
  hobbies: string;          // 趣味・好きなこと — REQUIRED, 20-1000 chars
  schedule: string;         // 1日のスケジュール — OPTIONAL, 0-1000 chars
  musicTaste: string;       // よく聴く音楽 — OPTIONAL, 0-500 chars
  firstImpression: string;  // 人からよく言われる第一印象 — OPTIONAL, 0-500 chars
}
```

**Input Validation Rules (aligned with product-design.md Section 3):**
| Field | Required | Min chars | Max chars |
|-------|----------|-----------|-----------|
| snsContent | Yes | 50 | 2000 |
| hobbies | Yes | 20 | 1000 |
| schedule | No | — | 1000 |
| musicTaste | No | — | 500 |
| firstImpression | No | — | 500 |

**Response (streamed via SSE):**
```typescript
{
  status: "analyzing" | "complete" | "error";
  phase: 1 | 2 | 3 | 4;            // 現在のフェーズ (aligned with product design)
  phaseLabel: string;                // フェーズの表示名
  result?: AnalysisResult;           // 最終結果 (phase 4完了時)
  partialText?: string;             // ストリーミング中の部分テキスト
  error?: string;
}
```

**Streaming Strategy:**
- Use Server-Sent Events (SSE) via Next.js Route Handlers
- Stream phase progress updates so the UI can show which phase the analysis is in
- Final result delivered as a complete JSON object on completion

**Error Codes:**
| Code | Meaning |
|------|---------|
| 400 | Invalid or missing input fields |
| 429 | Rate limit exceeded |
| 500 | Claude API error or internal failure |

### POST `/api/share`

Generates share text for Twitter/X. MVP scope: returns pre-filled tweet text only (no server-side image generation or URL persistence).

**Request Body:**
```typescript
{
  shareCard: ShareCardData;  // 共有カード用データ
}
```

**Response:**
```typescript
{
  shareText: string;         // Pre-filled tweet text with hashtags
}
```

> MVP note: Share card image generation is handled entirely client-side using `html2canvas`. No server-side image generation. No persistent share URLs (no database). Future versions will use Supabase for persistent share URLs with OGP support.

---

## 3. Data Models (TypeScript Interfaces)

All types live in `src/types/shared.ts` as the single source of truth.

```typescript
// === User Input ===

interface InputFieldConfig {
  id: InputCategory;
  label: string;           // 日本語ラベル
  prompt: string;          // 入力画面のプロンプト文
  placeholder: string;     // プレースホルダーテキスト
  helpText: string;        // ヘルプテキスト
  required: boolean;
  minChars: number;        // 0 if optional
  maxChars: number;
  chips?: string[];        // タップ可能なタグチップ (Steps 2, 5)
}

type InputCategory =
  | "snsContent"
  | "hobbies"
  | "schedule"
  | "musicTaste"
  | "firstImpression";

interface UserInput {
  snsContent: string;
  hobbies: string;
  schedule: string;
  musicTaste: string;
  firstImpression: string;
}

// === Persona Types ===

interface PersonaTrait {
  label: string;            // e.g., "社交性" (sociability)
  score: number;            // 0-100 (internal, used for gap calculation)
  description: string;      // 1-2 sentence explanation
}

interface SurfacePersona {
  title: string;            // e.g., "意識高い系カフェワーカー" (persona name)
  emoji: string;            // Representative emoji
  summary: string;          // 2-3 sentence description
  traits: string[];         // 3-5 display trait labels, e.g., ["社交的", "ポジティブ", "アクティブ"]
  scoredTraits: PersonaTrait[];  // 5 scored traits (for gap calculation)
  confidence: number;       // 0-100, how strongly this persona shows
}

interface HiddenPersona {
  title: string;            // e.g., "布団から出たくないインドア廃人"
  emoji: string;
  summary: string;          // 2-3 sentence description
  traits: string[];         // 3-5 display trait labels
  scoredTraits: PersonaTrait[];  // 5 scored traits (same categories as surface)
  confidence: number;       // 0-100
  evidence: string[];       // データから読み取れた根拠 (3-5 items)
}

// === Gap Analysis ===

interface TraitComparison {
  category: string;         // e.g., "社交性"
  icon: string;             // e.g., "🎭"
  surfaceLabel: string;     // e.g., "みんなでワイワイ派" (display text)
  hiddenLabel: string;      // e.g., "実は一人が好き" (display text)
  surfaceScore: number;     // 0-100 (internal)
  hiddenScore: number;      // 0-100 (internal)
  gap: number;              // absolute difference
}

interface GapAnalysis {
  overallGapScore: number;  // 0-100
  gapLevel: GapLevel;
  gapLevelLabel: string;    // 日本語ラベル (e.g., "ギャップ萌え")
  traitComparisons: TraitComparison[];  // 5 comparisons (top 3 shown, 2 expandable)
  aiComment: string;        // AIのコメント (fun summary paragraph)
  surprisingFinding: string; // 意外な発見
}

type GapLevel =
  | "honest"     // 0-20:  素直タイプ
  | "slight"     // 21-40: ちょいギャップ
  | "dual"       // 41-60: 二面性あり
  | "moe"        // 61-80: ギャップ萌え
  | "extreme";   // 81-100: 完全に別人

// === Final Result ===

interface AnalysisResult {
  id: string;               // Client-generated UUID
  surface: SurfacePersona;
  hidden: HiddenPersona;
  gap: GapAnalysis;
  shareCard: ShareCardData;
  analyzedAt: string;       // ISO 8601 timestamp
}

// === Share Card ===

interface ShareCardData {
  surfaceTitle: string;
  hiddenTitle: string;
  surfaceEmoji: string;
  hiddenEmoji: string;
  gapScore: number;
  gapLevel: GapLevel;
  gapLevelLabel: string;
  catchphrase: string;      // e.g., "見た目は天使、中身は魔王"
  shareText: string;        // Pre-filled tweet: "[表キャラ名]だと思ってたら、中身は[裏キャラ名]でした。ギャップスコア: [XX]点 #裏キャラAI"
}

// === Streaming State ===

type AnalysisPhase = 1 | 2 | 3 | 4;

interface StreamEvent {
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
```

---

## 4. AI Prompt Chain Design

### Architecture Decision: Single Call with Structured Output

We use **one Claude API call** with a sophisticated system prompt that produces all analysis steps in a single structured JSON response. Rationale:

- **Latency**: Multiple sequential API calls would take 15-30s total. A single call with streaming takes 5-15s.
- **Context coherence**: One call keeps the full context available for all analysis steps. Multi-call chains risk losing nuance between steps.
- **Cost**: One call is cheaper than five.
- **Streaming UX**: We stream the single response and use time-based phase animation on the client to create an engaging loading experience.

### System Prompt Structure

```
Role: You are UraChara AI (裏キャラAI), a charismatic and slightly
mischievous personality gap analyst. You speak like a fun friend who
knows the user a little too well — playful, slightly provocative,
but always affectionate. Never clinical or mean-spirited.

Tone: Casual Japanese (です/ます minimal). Vivid and specific persona
names — avoid generic descriptions. Think TikTok personality commentator
meets festival fortune teller.

Task: Analyze the user's data and produce a JSON response with the
exact schema provided. Your analysis must follow these internal steps:

STEP 1 - DATA PARSING:
  Read all input categories. Identify key signals:
  - Tone and language patterns in SNS posts
  - Frequency and type of hobbies (solo vs group, active vs passive)
  - Time allocation patterns in schedule
  - Music genre preferences and what they suggest
  - Gap between self-reported first impression and actual data signals

STEP 2 - SURFACE PERSONA (表の顔):
  Construct the public-facing personality.
  Base this on: what the data explicitly shows, the first impression
  others report, the social media persona they project.
  Generate a vivid, specific persona name (see examples below).
  Assign scores (0-100) for 5 traits:
  - 社交性 (Sociability)
  - 行動力 (Drive/Action)
  - 感受性 (Sensitivity)
  - 論理性 (Logic)
  - 自己主張 (Assertiveness)

STEP 3 - HIDDEN PERSONA (裏の顔):
  Construct the hidden personality.
  Look for: contradictions, what they do alone vs in groups,
  music taste vs public image gaps, schedule patterns that
  reveal private priorities, subtle linguistic cues in posts.
  Generate a vivid persona name that contrasts with the surface.
  Assign scores for the same 5 traits.

STEP 4 - GAP ANALYSIS:
  Calculate trait-by-trait gaps. Compute overall gap score (0-100).
  For each trait comparison, generate a short descriptive label for
  both the surface and hidden side (e.g., "みんなでワイワイ派" → "実は一人が好き").
  Write a fun AI comment summarizing the gap.
  Identify the most surprising finding.

STEP 5 - SHAREABLE SUMMARY:
  Generate a fun, slightly provocative catchphrase for the share card.
  Generate pre-filled tweet text.

Persona name examples (be this vivid and specific):
  表: 意識高い系カフェワーカー, 笑顔のムードメーカー, ストイック筋トレマン
  裏: 布団から出たくないインドア廃人, 深夜のWikipedia探検家, 推しのことしか考えてない人

IMPORTANT:
- Do NOT diagnose mental health conditions.
- Keep analysis fun and lighthearted. The "exposure" is always affectionate.
- If input data is insufficient for some fields, still produce a result but lower the confidence score.
- Results must feel tailored and specific, never generic.

Output the result as valid JSON matching the AnalysisResult schema.
```

### User Prompt Template

```
以下のデータから、この人の「表の顔」と「裏の顔」を分析してください。

【SNS投稿】
{snsContent}

【趣味・好きなこと】
{hobbies}

【1日のスケジュール】
{schedule || "（未入力）"}

【よく聴く音楽】
{musicTaste || "（未入力）"}

【人からよく言われる第一印象】
{firstImpression || "（未入力）"}
```

### Prompt Engineering Notes

1. **Temperature**: Set to `0.8` for creative but coherent personality descriptions.
2. **Max tokens**: `4096` - enough for the full structured response.
3. **Model selection**: Use `claude-sonnet-4-6` for the main analysis (better nuance). Reserve `claude-haiku-4-5-20251001` for potential future lightweight endpoints (e.g., re-generating just the catchphrase).
4. **JSON mode**: Use Claude's structured output / tool-use pattern to guarantee valid JSON. Define the `AnalysisResult` schema as a tool parameter.
5. **Streaming**: Enable streaming to parse the response progressively. Emit phase-change events to the client based on detecting each section being generated.
6. **Tone alignment**: System prompt incorporates tone guidelines from product-design.md Section 6 — playful, slightly provocative, empathetic, pop-culture aware, casual.
7. **Guardrails**:
   - System prompt includes: "Do not diagnose mental health conditions. Keep analysis fun and lighthearted."
   - System prompt includes: "If input data is insufficient, still produce a result but lower the confidence score."
   - Input validation rejects submissions that don't meet minimum requirements.
   - Optional fields submitted as "（未入力）" so Claude can acknowledge missing data gracefully.

### Client-Side Phase Animation

Since we use a single API call, we simulate phase progression on the client with time-based animation. This aligns with product-design.md Section 2.3:

| Time Window | UI Phase | Label | Visual Effect |
|-------------|----------|-------|---------------|
| 0-3s | Phase 1 | "データを読み込み中..." | Scanning animation |
| 3-6s | Phase 2 | "表の顔を分析中..." | Text fragments from input flash on screen |
| 6-10s | Phase 3 | "裏の顔を暴き中..." | Screen glitch/crack effect |
| 10-15s | Phase 4 | "ギャップスコアを計算中..." | Number counter rapidly cycling |

**Overflow behavior**: If the API call takes longer than 15s, loop phases 2-4 with variations. Never show a generic spinner.

**Design notes**: Dark background with neon/glitch aesthetic during loading. Rotating teaser messages build anticipation (e.g., "あなたの投稿から意外な一面が見えてきました...").

---

## 5. File / Folder Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout with fonts, metadata, global providers
│   ├── page.tsx                    # Landing page (hero + CTA)
│   ├── input/
│   │   └── page.tsx                # 5-step input wizard page
│   ├── analyzing/
│   │   └── page.tsx                # Analysis-in-progress page (loading animation)
│   ├── result/
│   │   └── page.tsx                # Result display page with reveal sequence
│   ├── share/
│   │   └── page.tsx                # Share card view (OGP target)
│   └── api/
│       ├── analyze/
│       │   └── route.ts            # POST /api/analyze - main analysis endpoint (SSE)
│       └── share/
│           └── route.ts            # POST /api/share - share text generator
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx              # Reusable button with variants (pulse animation for CTA)
│   │   ├── Card.tsx                # Card container component
│   │   ├── ProgressBar.tsx         # Step progress indicator (1/5, 2/5, etc.)
│   │   ├── TagChips.tsx            # Tappable tag chip selector (for hobbies, first impression)
│   │   ├── TraitBar.tsx            # Horizontal bar for gap score visualization
│   │   └── GapMeter.tsx            # Large gap score number display with count-up animation
│   ├── input/
│   │   ├── InputForm.tsx           # Main form orchestrator (stepped wizard)
│   │   ├── InputField.tsx          # Single textarea input with char count + help text
│   │   ├── InputStepper.tsx        # Step indicator and navigation (1/5 progress)
│   │   └── WhyTooltip.tsx          # "なぜ必要？" tooltip component
│   ├── analysis/
│   │   ├── AnalysisLoader.tsx      # Full-screen dark loading with glitch aesthetic
│   │   ├── PhaseIndicator.tsx      # Shows current analysis phase with label
│   │   └── TeaserMessage.tsx       # Rotating teaser messages during loading
│   ├── result/
│   │   ├── ResultView.tsx          # Full result layout with reveal sequence orchestration
│   │   ├── PersonaCard.tsx         # Displays one persona (surface=bright / hidden=dark+neon)
│   │   ├── TraitComparison.tsx     # "surface → hidden" text comparison with icon
│   │   ├── GapScoreDisplay.tsx     # Gap score number + level label + AI comment
│   │   └── InsightSection.tsx      # Surprising findings section
│   └── share/
│       ├── ShareCard.tsx           # Visual share card (split design: bright left / dark right)
│       ├── ShareButtons.tsx        # Twitter/X share button + screenshot download (MVP scope)
│       └── CatchphraseDisplay.tsx  # Large animated catchphrase text
│
├── lib/
│   ├── claude.ts                   # Claude API client wrapper
│   ├── prompts.ts                  # Prompt builder (system + user prompts)
│   ├── parseAnalysis.ts            # Parse and validate Claude JSON response
│   ├── streamHandler.ts            # SSE stream creation and event formatting
│   ├── validation.ts               # Input validation and sanitization (per-field rules)
│   └── constants.ts                # App-wide constants (phase labels, gap levels, tag chips)
│
├── types/
│   └── shared.ts                   # All TypeScript interfaces (source of truth)
│
├── prompts/
│   ├── system.ts                   # System prompt template (with tone guidelines)
│   └── analysis.ts                 # User prompt template with variable injection
│
└── hooks/
    ├── useAnalysis.ts              # Hook: triggers analysis, manages stream + phase state
    └── useShareCard.ts             # Hook: generates screenshot via html2canvas, Twitter share
```

### File Count Summary
- **Pages**: 5 (landing, input, analyzing, result, share)
- **API Routes**: 2 (analyze, share)
- **Components**: 18
- **Lib utilities**: 6
- **Types**: 1 (single source of truth)
- **Prompts**: 2
- **Hooks**: 2
- **Total planned files**: ~36

---

## 6. Performance & UX Considerations

### Streaming Response
- Use `ReadableStream` in Next.js Route Handlers to stream SSE events
- Client subscribes via `fetch` with `ReadableStream` reader
- UI shows time-based phase animation during the 5-15 second analysis window
- The structured JSON isn't human-readable mid-stream, so phase progression is purely animated (not data-driven)

### Loading States (aligned with product-design.md Section 2.3)
| State | UI Treatment |
|-------|-------------|
| Form submission | Button disabled + spinner, transition to analyzing page |
| Analysis in progress | Full-screen dark mode with glitch/matrix aesthetic, 4-phase animation |
| Phase transitions | Framer Motion `AnimatePresence` with scanning/glitch/crack effects |
| Result ready | Cinematic reveal sequence per product-design.md Section 2.4 |

### Result Reveal Sequence (aligned with product-design.md Section 2.4)
1. Screen goes dark
2. "あなたの診断結果..." fades in
3. Surface persona card slides in from left (bright/clean design)
4. "でも、本当は..." text appears
5. Hidden persona card slides in from right with crack effect (dark/neon design)
6. Gap score counter animates from 0 to final number
7. Trait comparison list fades in (top 3 shown, 2 expandable)
8. Share button pulses

### Animations (Framer Motion)
- **Landing page**: Hero text fade-in + slide-up, example cards auto-scroll, CTA pulse
- **Input form**: Horizontal slide transitions between steps, smooth progress bar fill
- **Analysis loader**: Dark background, glitch/scanning effects, text fragment flashes, rotating teasers
- **Result reveal**: Staggered cinematic sequence (see above)
- **Gap score**: Count-up animation (0 to final score)
- **Persona cards**: Slide-in from left (surface) and right (hidden)
- **Share card**: Split design with visual contrast (bright vs dark/neon)

### Error Handling Strategy
```
Layer 1: Input Validation (client-side)
  → Required: snsContent (min 50 chars), hobbies (min 20 chars)
  → Optional fields: no minimum, enforced maximums
  → Sanitize HTML/script tags
  → Fun error messages per product-design.md tone
    (e.g., "もうちょっと書いてくれないと、裏キャラ見つけられないよ！")

Layer 2: API Route Validation (server-side)
  → Re-validate all inputs with same rules
  → Reject payloads exceeding per-field max chars

Layer 3: Claude API Error Handling
  → Timeout: 30 second limit, show retry option
  → Rate limit (429): Show "混み合っています" message with countdown
  → Invalid response: Retry once, then show error with retry button
  → Network error: Show offline message

Layer 4: Response Parsing
  → Validate JSON structure against AnalysisResult schema
  → Fill defaults for any missing optional fields
  → If parsing fails: retry the API call once
```

### Rate Limiting
- Implement simple in-memory rate limiting in the API route (no Redis in MVP)
- Limit: 5 requests per IP per 10-minute window
- Use `Map<string, number[]>` to track request timestamps per IP
- Return 429 with `retryAfter` header when exceeded
- Future: Move to Vercel KV or Upstash Redis for distributed rate limiting

---

## 7. Security

### API Key Management
- Claude API key stored in `.env.local` as `ANTHROPIC_API_KEY`
- Never exposed to the client (API calls happen server-side in Route Handlers)
- `.env.local` is in `.gitignore`
- Vercel environment variables for production

### Input Sanitization
- Strip HTML tags from all user input before sending to Claude
- Enforce per-field maximum character limits (2000, 1000, 1000, 500, 500)
- Reject inputs containing potential injection patterns
- No user input is ever rendered as raw HTML (`dangerouslySetInnerHTML` is forbidden)

### No PII Storage (aligned with product-design.md Section 7)
- No database means no persistent storage of user data
- Analysis results exist only in client-side React state
- Refreshing the page clears all data
- Claude API calls are stateless (no conversation history stored)
- Landing page displays trust signal: "データは保存されません。診断後に自動削除。"
- No cookies beyond essential session management
- No analytics tracking in MVP

### Content Safety
- System prompt instructs Claude to avoid medical/psychological diagnoses
- System prompt instructs Claude to keep analysis lighthearted and fun
- System prompt specifies: the app is NOT a therapist, NOT a serious psychological assessment, NOT judgmental
- No storage of user data means no data breach risk
- CORS headers restricted to same-origin in production

### Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`: restrict to self and Vercel analytics
- Next.js security headers configured in `next.config.ts`

---

## 8. Future Considerations (Post-MVP)

These are out of scope for MVP but inform architectural decisions:

1. **Instagram Graph API Integration**: The `UserInput` type should be extensible to accept structured API data alongside text input. Instagram is the most promising for persona data.
2. **Supabase Integration**: Share cards will need persistent storage for shareable URLs with OGP support. The `ShareCardData` type is already designed to be database-friendly.
3. **Spotify API Integration**: Direct music data analysis instead of text-based music taste input.
4. **Additional Share Platforms**: LINE share, Instagram Stories (vertical 1080x1920 card format), copy link with OGP preview.
5. **Analytics**: Track gap score distribution, most common persona types, share rates, completion rates. Anonymous aggregate only.
6. **Multi-language**: Architecture supports i18n but MVP is Japanese-only.
7. **History / Comparison**: Allow users to save and compare multiple analyses, or compare with friends (requires auth + DB).
8. **Backend Share URLs**: Persistent share URLs with unique IDs, OGP meta tags for link previews.
