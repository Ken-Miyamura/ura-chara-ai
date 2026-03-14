# UraChara AI - Product Design Document

> "本当の自分、バレちゃうかも。" (Your true self might just get exposed.)

> **Related documents:**
> - [Technical Architecture](./technical-architecture.md) - TypeScript interfaces, API design, prompt chain
> - [Shared Types](../src/types/shared.ts) - Single source of truth for all data structures

---

## 1. Product Overview

### What is UraChara AI?

UraChara AI (裏キャラ AI) is a web app that analyzes a user's self-reported data — SNS posts, hobbies, daily routine, music taste, and how others perceive them — to reveal the **gap between their public persona and their hidden personality**.

Every person has an **表キャラ (omote-chara)** — the character they show the world — and an **裏キャラ (ura-chara)** — the version of themselves that only comes out at 3 AM, in their browser history, or in their Spotify Wrapped. This app exposes that gap in a fun, shareable way.

### Target Audience

- **Primary:** Japanese young adults, ages 20-35
- **Psychographic:** Active SNS users (Twitter/X, Instagram, TikTok), interested in self-discovery and personality diagnostics (MBTI, 16personalities, etc.)
- **Behavior:** Shares personality quiz results on social media, enjoys "当たってる！" (so accurate!) moments
- **Platform:** Mobile-first (80%+ expected mobile traffic)

### Value Proposition

| For the user | For virality |
|---|---|
| Discover a side of yourself you didn't know existed | Gap Score creates a "bragging" mechanic ("My gap is 87!") |
| Fun, low-effort personality analysis | Result cards are designed to be screenshot-shared |
| No sign-up, no login, instant results | Provocative persona names encourage sharing |

### Competitive Landscape

- **MBTI / 16personalities:** Serious, questionnaire-based. UraChara is playful and uses real behavioral data.
- **Personality AI apps (Crystal, etc.):** Professional / LinkedIn-focused. UraChara targets casual social use.
- **BuzzFeed quizzes:** Fun but shallow. UraChara uses AI for genuinely surprising insights.

---

## 2. User Flow

### Overview

```
Landing → Input (5 steps) → Loading/Analysis → Result → Share
```

### 2.1 Landing Page (ランディングページ)

**Goal:** Hook the user in 3 seconds and get them to tap "Start."

- **Headline (キャッチコピー):** "あなたの裏キャラ、暴いちゃいます。" (We're going to expose your hidden character.)
- **Sub-headline:** "SNSの投稿、趣味、音楽の好み... AIがあなたの「表の顔」と「裏の顔」のギャップを暴きます。"
- **CTA button:** "裏キャラ診断スタート" (Start UraChara Diagnosis) — large, centered, pulsing animation
- **Social proof:** Example result cards scrolling in background (anonymized/fictional)
- **Trust signal:** "データは保存されません。診断後に自動削除。" (Data is not saved. Automatically deleted after diagnosis.)
- **Time estimate:** "所要時間：約3分" (Estimated time: about 3 minutes)

### 2.2 Input Phase (データ入力フェーズ)

The input phase is a **stepped wizard** — one category per screen to reduce cognitive load. Each step has:
- A playful prompt/question
- An input area
- A skip button (for optional fields)
- A progress indicator (1/5, 2/5, etc.)

Steps are detailed in Section 3.

**Key UX decisions:**
- Steps can be completed in any order (but default order is optimized for engagement)
- Minimum 2 categories must be filled to proceed (to ensure quality output)
- Each step shows a "なぜ必要？" (Why do we need this?) tooltip
- Character count / minimum guidance shown per field

### 2.3 Loading / Analysis Phase (分析中画面)

**Goal:** Build anticipation and prevent abandonment during API call (~5-15 seconds).

**Sequence of events** (aligned with streaming step labels in technical architecture):

| Time | Step | Label | Visual Effect |
|---|---|---|---|
| 0-1s | Step 1 | "データを読み込み中..." | Scanning animation, data fragments appear |
| 1-3s | Step 2 | "表の顔を分析中..." | Text fragments from user input flash across screen |
| 3-5s | Step 3 | "裏の顔を探索中..." | Screen glitches/cracks effect, darker palette |
| 5-7s | Step 4 | "ギャップを計算中..." | Number counter rapidly cycling |
| 7s+ | Step 5 | "結果を生成中..." | Final compilation visual, anticipation builds |

Note: These steps are time-based animations (not tied to actual API progress). The API uses a single call with streaming; step progression is simulated client-side.

**Design notes:**
- Dark background with neon/glitch aesthetic during this phase
- Use Framer Motion for all transitions
- If API takes longer than 10s, loop steps 2-5 with variation messages
- Never show a generic spinner
- API timeout at 30 seconds; show retry option if exceeded

### 2.4 Result Phase (結果表示)

**Goal:** Deliver the "wow" moment. Make it feel like a dramatic reveal.

**Reveal sequence (animated):**
1. Screen goes dark
2. "あなたの診断結果..." (Your diagnosis result...) fades in
3. Surface persona card slides in from left
4. "でも、本当は..." (But in reality...) text appears
5. Hidden persona card slides in from right with a "crack" effect
6. Gap Score counter animates from 0 to final number
7. Trait comparison list fades in
8. Share button pulses

Result structure is detailed in Section 4.

### 2.5 Share Phase (シェア機能)

**Goal:** Maximize viral distribution.

**Share options:**
- **Screenshot card:** Pre-designed OGP-style image card with persona names + gap score (generated client-side using html2canvas or similar)
- **Twitter/X share:** Pre-filled tweet text — "私の裏キャラは「[裏キャラ名]」でした！ギャップスコア: [XX]点 #裏キャラAI #裏キャラ診断"
- **Instagram Stories:** Vertical card format optimized for Stories sharing
- **LINE share:** URL with OGP preview
- **Copy link:** (MVP: not functional without backend, but UI placeholder present)

**MVP scope:** Twitter share button + screenshot card download. Other platforms as future enhancement.

---

## 3. Data Input Format (データ入力仕様)

### Step 1: SNS投稿 (SNS Posts) — REQUIRED

**Prompt:** "最近のSNS投稿をコピペしてください。Twitter、Instagram、なんでもOK！"
(Copy-paste your recent SNS posts. Twitter, Instagram, anything goes!)

| Property | Value |
|---|---|
| UI Element | `<textarea>` with large tap target |
| Placeholder | "例：今日もカフェで仕事なう☕ / 週末は友達と渋谷で飲み🍻 / この映画マジで泣いた😭" |
| Minimum | 50 characters |
| Maximum | 2000 characters |
| Required | Yes |
| Help text | "5〜10投稿分くらいがベスト。多いほど精度UP！" (5-10 posts is ideal. More = better accuracy!) |

**Why this matters:** SNS posts reveal the curated, public-facing persona. They're the raw material for 表の顔.

### Step 2: 趣味・興味 (Hobbies & Interests) — REQUIRED

**Prompt:** "ハマっていること、好きなこと、教えてください！"
(Tell us what you're into, what you love!)

| Property | Value |
|---|---|
| UI Element | `<textarea>` (free text) + optional tag chips for common categories |
| Tag chips | アニメ, ゲーム, 読書, 筋トレ, 料理, 旅行, カメラ, 推し活, DIY, 投資 |
| Placeholder | "例：最近はソロキャンプにハマってる。あとNetflixで韓ドラ見まくり。週末は筋トレ。" |
| Minimum | 20 characters |
| Maximum | 1000 characters |
| Required | Yes |
| Help text | "人に言う趣味も、こっそりな趣味も、全部書いてOK！" (Public hobbies AND secret hobbies — write them all!) |

**Why this matters:** The gap between publicly stated hobbies and actual interests is a rich signal for ura-chara analysis.

### Step 3: 1日のスケジュール (Daily Schedule) — OPTIONAL

**Prompt:** "典型的な1日の過ごし方を教えてください。"
(Tell us how you typically spend your day.)

| Property | Value |
|---|---|
| UI Element | `<textarea>` (free text) |
| Placeholder | "例：7時起床→満員電車→9-18時仕事→ジム→帰宅→YouTube見ながら寝落ち" |
| Minimum | None (optional) |
| Maximum | 1000 characters |
| Required | No (skip button available) |
| Help text | "リアルな過ごし方でOK。「理想の1日」じゃなくて「実際の1日」を！" (Your real day, not your ideal day!) |

**Why this matters:** Schedule reveals unconscious priorities. What someone actually spends time on vs. what they say they care about.

### Step 4: 音楽の好み (Music Taste) — OPTIONAL

**Prompt:** "よく聴くアーティストや曲を教えてください！"
(Tell us what artists/songs you listen to!)

| Property | Value |
|---|---|
| UI Element | `<textarea>` (free text) |
| Placeholder | "例：YOASOBI、King Gnu、藤井風。深夜はCity Popとか聴いてる。Spotifyのプレイリストはほぼアニソン。" |
| Minimum | None (optional) |
| Maximum | 500 characters |
| Required | No (skip button available) |
| Help text | "ジャンル、アーティスト名、プレイリストの雰囲気、なんでもOK" |

**Why this matters:** Music taste is a strong personality signal and often reveals emotional states the user doesn't express publicly.

### Step 5: 第一印象 (First Impressions) — OPTIONAL

**Prompt:** "周りの人にどう思われてると感じますか？"
(How do you think people around you perceive you?)

| Property | Value |
|---|---|
| UI Element | `<textarea>` + optional preset chips |
| Preset chips | しっかり者, 天然, 明るい, クール, 真面目, 不思議ちゃん, いじられキャラ, 聞き上手 |
| Placeholder | "例：よく「しっかりしてるね」って言われるけど、実は毎朝ギリギリで家出てる。" |
| Minimum | None (optional) |
| Maximum | 500 characters |
| Required | No (skip button available) |
| Help text | "よく言われること、よく使われるあだ名、第一印象で言われたことなど" |

**Why this matters:** Self-awareness of public perception creates the baseline for measuring the gap.

### Input Validation Summary

| Step | Category | Required | Min chars | Max chars |
|---|---|---|---|---|
| 1 | SNS投稿 | Yes | 50 | 2000 |
| 2 | 趣味・興味 | Yes | 20 | 1000 |
| 3 | 1日のスケジュール | No | — | 1000 |
| 4 | 音楽の好み | No | — | 500 |
| 5 | 第一印象 | No | — | 500 |

**Total minimum input to proceed:** Steps 1 + 2 completed (at least 70 characters total).

---

## 4. Output Format (結果の構造)

### 4.1 表の顔 (Surface Persona / Omote no Kao)

The public-facing personality that the user presents to the world.

**Data structure** (aligned with `SurfacePersona` in `src/types/shared.ts`):
```
{
  title: string,            // e.g., "意識高い系カフェワーカー"
  emoji: string,            // e.g., "✨"
  traits: PersonaTrait[],   // 5 key traits scored on fixed axes (see below)
  summary: string,          // 2-3 sentence overview
  keywords: string[]        // 3-5 keywords, e.g., ["社交的", "ポジティブ", "アクティブ"]
}
```

**The 5 Trait Axes** (same for both personas, enabling direct comparison):

| Axis | Japanese | What it measures |
|---|---|---|
| Sociability | 社交性 | Group-oriented vs. solitary |
| Drive | 行動力 | Active/ambitious vs. laid-back |
| Sensitivity | 感受性 | Emotionally expressive vs. reserved |
| Logic | 論理性 | Analytical vs. intuitive |
| Assertiveness | 自己主張 | Outspoken vs. agreeable/accommodating |

Each trait has a `label`, `score` (0-100), and `description` (1-2 sentence explanation).

**Example:**
> **✨ 意識高い系カフェワーカー**
> SNSではおしゃれカフェでの作業風景を投稿し、週末はジムで自分磨き。周りからは「しっかりしてる」と言われるタイプ。トレンドにも敏感で、新しいものにはすぐ飛びつく行動派。
>
> Traits: 社交性 82, 行動力 78, 感受性 45, 論理性 60, 自己主張 71

### 4.2 裏の顔 (Hidden Persona / Ura no Kao)

The hidden personality lurking beneath the surface.

**Data structure** (aligned with `HiddenPersona` in `src/types/shared.ts`):
```
{
  title: string,            // e.g., "布団から出たくないインドア廃人"
  emoji: string,            // e.g., "🛋️"
  traits: PersonaTrait[],   // 5 key traits (same axes as surface)
  summary: string,          // 2-3 sentence overview
  keywords: string[],       // 3-5 keywords
  evidence: string[]        // 3-5 data points from input that support this persona
}
```

**Example:**
> **🛋️ 布団から出たくないインドア廃人**
> カフェで仕事してる風だけど、実はYouTube見てる時間の方が長い。筋トレも最近サボり気味で、本当の週末は布団の中。深夜にアニソン聴きながらWikipediaの沼にハマるのが至福の時間。
>
> Traits: 社交性 35, 行動力 28, 感受性 72, 論理性 55, 自己主張 30
> Evidence: "深夜にCity Pop聴いてる", "スケジュールの帰宅後がYouTube→寝落ち", "投稿頻度より閲覧時間の方が長そう"

### 4.3 ギャップスコア (Gap Score)

A numerical score (0-100) representing the magnitude of the gap between the two personas. Calculated from the average absolute difference across all 5 trait axes.

**Gap Level Tiers** (aligned with `GapLevel` type in `src/types/shared.ts`):

| Score Range | GapLevel | User-facing Label | Description |
|---|---|---|---|
| 0-20 | `honest` | "素直タイプ" | What you see is what you get. Barely any gap. |
| 21-40 | `slight` | "ちょいギャップ" | A small gap — you adapt subtly to your surroundings. |
| 41-60 | `dual` | "二面性あり" | You know how to read the room. Two distinct sides. |
| 61-80 | `moe` | "ギャップ萌えタイプ" | Major gap. The contrast is charming. |
| 81-100 | `extreme` | "完全に別人タイプ" | Your public and private selves are strangers. |

**Additional gap data** (aligned with `GapAnalysis` in `src/types/shared.ts`):
- `biggestGap`: Summary of the single largest trait gap (e.g., "社交性のギャップが最大！表では82なのに裏では35")
- `surprisingFinding`: An unexpected insight the AI discovered (e.g., "音楽の好みが一番本音を表してました")

**Display:** Large number with animated counter + gap level label + one-line commentary from the AI.

### 4.4 Trait Comparisons (ギャップ詳細)

All 5 trait axes compared side-by-side with scores and insight text.

**Data structure** (aligned with `TraitComparison` in `src/types/shared.ts`):
```
{
  traitComparisons: [
    {
      traitLabel: string,       // e.g., "社交性"
      surfaceScore: number,     // 0-100
      hiddenScore: number,      // 0-100
      gap: number,              // absolute difference
      insight: string           // playful explanation of this gap
    }
  ]
}
```

**Display format** (scores shown as visual bars + playful insight text):
```
🎭 社交性  [████████░░] 82 → [███░░░░░░░] 35
  みんなでワイワイ派 → 実は一人が好き

⚡ 行動力  [███████░░░] 78 → [██░░░░░░░░] 28
  アクティブ派 → 実はインドア廃人

💖 感受性  [████░░░░░░] 45 → [███████░░░] 72
  クールに見えて → 実は涙もろい

🧠 論理性  [██████░░░░] 60 → [█████░░░░░] 55
  ほぼ同じ → 表も裏もちゃんと考えてる

💬 自己主張 [███████░░░] 71 → [███░░░░░░░] 30
  意見はっきり → 実は空気読みすぎ
```

### 4.5 Shareable Summary (シェア用テキスト)

Two shareable text elements:

**Catchphrase (キャッチフレーズ):** A short, punchy phrase summarizing the gap. Used on the share card.
- Format: "[表の印象] × [裏の印象]" or a creative contrast phrase
- Example: "見た目は天使、中身は魔王"
- Example: "キラキラの裏にゴロゴロ"
- Stored as `catchphrase` in `ShareCardData`

**Share text (シェア文):** Pre-filled text for Twitter/X sharing.
- Format: "[表キャラ名]だと思ってたら、中身は[裏キャラ名]でした。ギャップスコア: [XX]点"
- Example: "意識高い系カフェワーカーだと思ってたら、中身は布団から出たくないインドア廃人でした。ギャップスコア: 74点 #裏キャラAI"

### 4.6 Visual Representation

**Result card design concept:**
- Split card: left half = surface persona (bright, clean colors), right half = hidden persona (dark, neon/glitch aesthetic)
- Persona names in bold, stylized Japanese typography
- Gap score displayed as a large centered number bridging the two halves
- Card dimensions: 1200x630 (OGP standard) for link previews, 1080x1920 (9:16) for Stories

**Color scheme:**
- Surface side: White background, soft pastels, clean sans-serif
- Hidden side: Dark/black background, neon accents (electric purple, hot pink), slightly distorted text
- The visual contrast itself communicates the concept

---

## 5. Wireframes (テキストワイヤーフレーム)

### 5.1 Landing Page

```
┌─────────────────────────────────┐
│         [Logo: 裏キャラAI]        │
│                                 │
│    あなたの裏キャラ、暴いちゃいます。   │
│                                 │
│   SNSの投稿、趣味、音楽の好み...    │
│   AIが「表の顔」と「裏の顔」の      │
│   ギャップを暴きます。              │
│                                 │
│  ┌─────────────────────────┐    │
│  │  裏キャラ診断スタート 👉       │    │
│  └─────────────────────────┘    │
│                                 │
│       所要時間：約3分              │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │ Example   │ │ Example   │   │
│  │ Result    │ │ Result    │   │
│  │ Card 1    │ │ Card 2    │   │
│  └───────────┘ └───────────┘   │
│       ← scroll →               │
│                                 │
│  データは保存されません。           │
│  診断後に自動削除。               │
└─────────────────────────────────┘
```

**Notes:**
- Background: subtle animated gradient or particle effect
- Example cards auto-scroll horizontally
- CTA button has a gentle pulse animation (Framer Motion)
- Mobile: full viewport height, no scroll needed for core content

### 5.2 Input Form — Step 1 (SNS投稿)

```
┌─────────────────────────────────┐
│  ← 戻る          STEP 1/5       │
│  ■□□□□ (progress bar)           │
│                                 │
│  📱 SNS投稿                     │
│                                 │
│  最近のSNS投稿をコピペして         │
│  ください。Twitter、Instagram、    │
│  なんでもOK！                    │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  (textarea)             │    │
│  │                         │    │
│  │                         │    │
│  │                         │    │
│  └─────────────────────────┘    │
│  52/2000 文字                   │
│                                 │
│  💡 5〜10投稿分がベスト！          │
│                                 │
│  ┌─────────────────────────┐    │
│  │       次へ →                │    │
│  └─────────────────────────┘    │
│                                 │
│  [なぜ必要？]                    │
└─────────────────────────────────┘
```

**Notes:**
- Progress bar fills proportionally (20% per step)
- Character count updates in real-time
- "次へ" (Next) button is disabled until minimum characters met
- Required steps show no "Skip" button
- Smooth slide transition between steps (Framer Motion)

### 5.3 Input Form — Step 2 (趣味・興味)

```
┌─────────────────────────────────┐
│  ← 戻る          STEP 2/5       │
│  ■■□□□                          │
│                                 │
│  🎯 趣味・興味                   │
│                                 │
│  ハマっていること、好きなこと、      │
│  教えてください！                  │
│                                 │
│  [アニメ] [ゲーム] [読書] [筋トレ]  │
│  [料理] [旅行] [カメラ] [推し活]   │
│  [DIY] [投資]                    │
│  (tappable chips, multi-select)  │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  (textarea for details) │    │
│  │                         │    │
│  └─────────────────────────┘    │
│  24/1000 文字                   │
│                                 │
│  ┌─────────────────────────┐    │
│  │       次へ →                │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 5.4 Input Form — Steps 3-5 (Optional Steps)

Same layout as Steps 1-2 but with a "スキップ →" (Skip) button alongside "次へ →".

Step 5 shows "診断する！" (Run Diagnosis!) instead of "次へ →".

### 5.5 Loading / Analysis Screen

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         (dark background)       │
│                                 │
│     ┌───────────────────┐       │
│     │  glitch animation │       │
│     │    / scanning      │       │
│     │     effect         │       │
│     └───────────────────┘       │
│                                 │
│     裏の顔を暴き中...             │
│                                 │
│     ▓▓▓▓▓▓▓▓░░░░ 67%           │
│                                 │
│   "あなたの投稿から                │
│    意外な一面が見えてきました..."    │
│   (rotating hint messages)       │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Full-screen dark mode with glitch/matrix aesthetic
- Text fragments from user input briefly flash on screen
- Progress bar is fake (timed animation, not actual progress)
- Rotating teaser messages build anticipation
- Background audio-visual effects optional (subtle)

### 5.6 Result Page

```
┌─────────────────────────────────┐
│     あなたの診断結果               │
│                                 │
│  ┌──────────┬──────────┐        │
│  │ 表の顔    │ 裏の顔   │        │
│  │ (bright) │ (dark)   │        │
│  │          │          │        │
│  │ ✨       │ 🛋️      │        │
│  │意識高い系  │布団から    │        │
│  │カフェ     │出たくない  │        │
│  │ワーカー   │インドア廃人│        │
│  │          │          │        │
│  └──────────┴──────────┘        │
│                                 │
│     ギャップスコア                 │
│        ┌────┐                   │
│        │ 74 │                   │
│        └────┘                   │
│     "ギャップ萌え"                │
│                                 │
│  ── ギャップ詳細 (5 Traits) ──    │
│                                 │
│  🎭 社交性  82 → 35             │
│  [████████░░] → [███░░░░░░░]    │
│  みんなでワイワイ → 実は一人が好き   │
│                                 │
│  ⚡ 行動力  78 → 28             │
│  [███████░░░] → [██░░░░░░░░]    │
│  アクティブ派 → インドア廃人        │
│                                 │
│  💖 感受性  45 → 72             │
│  [████░░░░░░] → [███████░░░]    │
│  クールに見えて → 実は涙もろい      │
│                                 │
│  (+ 論理性, 自己主張)             │
│                                 │
│  ── 意外な発見 ──                 │
│  "音楽の好みが一番本音を             │
│   表してました。深夜のCity Popに     │
│   あなたの本当の感受性が出てる。"    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    結果をシェアする 📤        │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    もう一度診断する 🔄        │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Notes:**
- Result page scrolls vertically
- Each section animates in on scroll (Framer Motion stagger)
- Gap score number has a counting-up animation
- Share button is sticky at bottom on mobile

### 5.7 Share Card (Screenshot / OGP)

```
┌─────────────────────────────────┐
│                                 │
│  裏キャラAI 診断結果              │
│                                 │
│  表の顔          裏の顔          │
│  ✨              🛋️             │
│  意識高い系    布団から出たくない   │
│  カフェワーカー  インドア廃人       │
│                                 │
│        GAP SCORE: 74            │
│       ■■■■■■■□□□               │
│                                 │
│  あなたも診断してみる？            │
│  → ura-chara.ai                 │
│                                 │
│           #裏キャラAI             │
└─────────────────────────────────┘
```

**Notes:**
- Clean, bold design optimized for Twitter/Instagram screenshots
- Two variants: landscape (1200x630 for OGP) and portrait (1080x1920 for Stories)
- Generated client-side (html2canvas / dom-to-image)
- Includes URL and hashtag to drive traffic back

---

## 6. Tone & Personality (トーン&パーソナリティ)

### The App's Voice

UraChara AI speaks like a **charismatic, slightly mischievous friend** who knows you a little too well. Think of a cross between a TikTok personality commentator and a fortune teller at a festival.

### Tone Guidelines

| Attribute | Description | Example |
|---|---|---|
| **Playful (遊び心)** | Never serious or clinical. This is entertainment, not therapy. | "あなたの裏キャラ、暴いちゃいます" not "パーソナリティ分析を実施します" |
| **Slightly provocative (ちょっと挑発的)** | Teases the user gently. Pokes fun at the gap. | "表ではキラキラだけど、中身は..." |
| **Empathetic (共感)** | Never mean. The "exposure" is always affectionate. | "でもそのギャップが、あなたの魅力です。" |
| **Pop-culture aware (ポップカルチャー)** | Uses language/references familiar to the target audience. | "推しへの愛は隠せない" |
| **Casual (カジュアル)** | Uses です/ます minimally. Mostly casual Japanese. | "教えてください！" not "ご記入ください" |

### Language Patterns

- **Headers/CTAs:** Short, punchy, emoji-accented
- **Descriptions:** Conversational, 2nd person (あなた)
- **Results:** Specific and vivid — avoid generic personality descriptions
- **Error messages:** Friendly and in-character ("もうちょっと書いてくれないと、裏キャラ見つけられないよ！" for minimum char errors)

### What the App is NOT

- NOT a therapist or mental health tool
- NOT a serious psychological assessment
- NOT judgmental or mean-spirited
- NOT generic — results should feel tailored and specific

---

## 7. MVP Scope & Constraints

### In Scope (MVP)

- [x] Single-page web app (Next.js App Router)
- [x] 5-step input wizard
- [x] AI analysis via Claude API (server-side)
- [x] Animated result page
- [x] Twitter share button with pre-filled text
- [x] Screenshot card generation (client-side)
- [x] Mobile-first responsive design
- [x] Japanese language only

### Out of Scope (Future)

- [ ] SNS API integration (Instagram, Twitter OAuth)
- [ ] User accounts / login
- [ ] Database / result persistence
- [ ] Multi-language support
- [ ] Comparison with friends
- [ ] Historical tracking ("your ura-chara over time")
- [ ] LINE / Instagram share integration
- [ ] Spotify API integration for music analysis
- [ ] Backend share URL generation (requires database)

### Privacy & Trust

- No user data is stored on any server
- API calls to Claude are ephemeral — no logging of user content
- Clear privacy statement on landing page and input screens
- No cookies beyond essential session management
- No analytics tracking in MVP (future: anonymous aggregate analytics only)

---

## 8. Success Metrics (KPIs)

| Metric | Target | Measurement |
|---|---|---|
| Completion rate (landing → result) | > 60% | Client-side event tracking (future) |
| Share rate (result → share action) | > 25% | Click tracking on share buttons |
| Average input time | < 3 minutes | Timestamp delta (client-side) |
| Bounce rate on landing | < 40% | Analytics (future) |
| Viral coefficient | > 1.2 | Referral tracking via share URLs (future) |

---

## Appendix: Persona Name Examples (裏キャラ名サンプル)

These are examples of the kind of persona names the AI should generate. They should be vivid, specific, and slightly exaggerated.

**表キャラ examples:**
- 意識高い系カフェワーカー (Aspiring cafe worker)
- 笑顔のムードメーカー (Smiling mood maker)
- ストイック筋トレマン (Stoic gym bro)
- おしゃれインスタグラマー (Stylish Instagrammer)
- 真面目リーダータイプ (Serious leader type)

**裏キャラ examples:**
- 布団から出たくないインドア廃人 (Bed-dwelling indoor hermit)
- 深夜のWikipedia探検家 (Late-night Wikipedia explorer)
- 推しのことしか考えてない人 (Person who only thinks about their oshi)
- 3日に1回しか料理しないズボラ飯民 (Lazy meal person who cooks once every 3 days)
- 通知オフにして既読スルーする陰キャ (Introvert who turns off notifications and leaves messages on read)
