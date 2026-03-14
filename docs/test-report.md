# UraChara AI - Integration Test Report

**Tester:** Teammate D (Integration Tester)
**Date:** 2026-03-15
**Branch:** phase3/testing
**Base commit:** b46b16d (Merge pull request #5 from Ken-Miyamura/fix/phase2-bugfixes)

---

## Test Environment

| Property | Value |
|----------|-------|
| OS | macOS (Darwin 25.2.0) |
| Node.js | (installed via project) |
| Framework | Next.js 16.1.6 |
| TypeScript | 5.x (strict mode) |
| Testing method | Code review + manual analysis |

---

## 1. Codebase Understanding - Data Flow Map

```
Landing (/)
  -> [Click CTA]
  -> Input (/input) - 5-step wizard
    -> [Step 5 "診断する!"]
    -> sessionStorage.setItem("uraCharaInput", JSON.stringify(formData))
    -> router.push("/analyzing")
  -> Analyzing (/analyzing)
    -> sessionStorage.getItem("uraCharaInput")
    -> useAnalysis hook -> fetch POST /api/analyze
    -> Server: validate -> sanitize -> SSE stream -> Claude API (tool-use) -> parse response
    -> Client: readSSEStream -> on "complete" event -> setResult
    -> sessionStorage.setItem("uraCharaResult", JSON.stringify(result))
    -> router.push("/result")
  -> Result (/result)
    -> sessionStorage.getItem("uraCharaResult")
    -> Cinematic reveal sequence (8 phases, ~13 seconds)
    -> [Click "結果をシェアする"] -> router.push("/share")
    -> [Click "もう一度診断する"] -> clear sessionStorage -> router.push("/input")
  -> Share (/share)
    -> sessionStorage.getItem("uraCharaResult")
    -> Share card preview (html-to-image for PNG)
    -> Twitter share (window.open intent URL)
    -> Download card (toPng + link.click)
```

### SessionStorage Keys
| Key | Set by | Read by | Content |
|-----|--------|---------|---------|
| `uraCharaInput` | `/input` page | `/analyzing` page | `UserInput` JSON |
| `uraCharaResult` | `/analyzing` page | `/result` page, `/share` page | `AnalysisResult` JSON |

---

## 2. Happy Path Test Results

### Test Persona 1: High Gap User (from fixtures)

| Step | Action | Expected | Actual (Code Review) | Status |
|------|--------|----------|---------------------|--------|
| Landing | Visit `/` | Hero text, CTA button, sample cards, privacy notice | All present in page.tsx with Framer Motion animations | PASS |
| CTA Click | Click "裏キャラ診断スタート" | Navigate to `/input` | `<Link href="/input">` present | PASS |
| Step 1 (SNS) | Enter 50+ char SNS content | "次へ" enabled, char counter shows green | `canProceed` checks `trimmedCharCount >= 50` (after fix) | PASS |
| Step 2 (Hobbies) | Enter 20+ char hobbies, select chips | Chips append to text, "次へ" enabled | Chip toggle logic in input/page.tsx adds/removes text | PASS |
| Step 3 (Schedule) | Enter optional schedule | "スキップ" and "次へ" both available | `onSkip` passed when `!config.required` | PASS |
| Step 4 (Music) | Enter optional music | Same as Step 3 | Same pattern | PASS |
| Step 5 (First Impression) | Enter optional or click "診断する!" | Data saved to sessionStorage, navigate to /analyzing | `handleNext` saves to sessionStorage + router.push | PASS |
| Analyzing | Page loads | Read input from sessionStorage, call API, show phase animations | useAnalysis hook + LoadingPhase component | PASS |
| API Call | POST /api/analyze | Rate limit check, validate, sanitize, SSE stream | Route handler implements all layers | PASS |
| Result | Auto-navigate on completion | 8-phase reveal sequence | RevealPhase state machine with timeouts | PASS |
| Share | Click "結果をシェアする" | Share card preview + Twitter/download buttons | SharePage with useShareCard hook | PASS |

### Test Persona 2: Low Gap User (from fixtures)

Same flow as above. The fixture data (`lowGapExpectedResult`) has gapScore=12, gapLevel="honest". The GapScoreDisplay component correctly uses `levelColorMap` to show green for "honest" level.

---

## 3. Edge Case Test Results

### Input Validation

| Test Case | Expected | Actual (Code Review) | Status |
|-----------|----------|---------------------|--------|
| Empty snsContent (required) | "次へ" disabled | `canProceed = false` when trimmed length < 50 | PASS |
| Empty hobbies (required) | "次へ" disabled | `canProceed = false` when trimmed length < 20 | PASS |
| Exactly 50 chars snsContent | "次へ" enabled | `trimmedCharCount >= 50` passes | PASS |
| Exactly 20 chars hobbies | "次へ" enabled | `trimmedCharCount >= 20` passes | PASS |
| 2000 chars snsContent | "次へ" enabled | `charCount <= 2000` passes | PASS |
| 2001 chars snsContent | "次へ" disabled | `charCount <= 2000` fails, textarea `maxLength={2100}` allows typing but validation blocks | PASS |
| Whitespace-only input (50 spaces) | "次へ" disabled | **WAS BUG** - client used untrimmed length. **FIXED**: now uses `trimmedCharCount` for min validation | FIXED |
| Emoji input (🎉 etc.) | Accepted | No special handling for multi-byte chars; JS `.length` counts surrogate pairs as 2. Minor inconsistency but acceptable for MVP | NOTE |
| HTML tags `<script>alert(1)</script>` | Stripped before API call | `sanitizeUserInput` calls `stripHtmlTags` which removes `<[^>]*>` | PASS |
| Script injection in textarea | Not rendered as HTML | No `dangerouslySetInnerHTML` used anywhere in codebase | PASS |
| All optional fields empty | Accepted | Optional fields checked as `!rule.required && charCount === 0` returns null (no error) | PASS |
| All fields filled | Accepted | All validations pass | PASS |

### Rate Limiting

| Test Case | Expected | Actual (Code Review) | Status |
|-----------|----------|---------------------|--------|
| 6th request within 10 minutes | 429 response | `checkRateLimit` checks `validTimestamps.length >= 5` | PASS |
| Retry-After header | Present in 429 response | `"Retry-After": String(rateLimit.retryAfterSeconds ?? 60)` | PASS |
| IP extraction | From x-forwarded-for or x-real-ip | `getClientIp` checks headers in order | PASS |

---

## 4. Client-Side Behavior Tests

| Test Case | Expected | Actual (Code Review) | Status |
|-----------|----------|---------------------|--------|
| Direct URL to /analyzing without input | Redirect to /input | `if (!stored) router.push("/input")` | PASS |
| Direct URL to /result without result | Redirect to / | `if (!stored) router.push("/")` | PASS |
| Direct URL to /share without result | Redirect to / | `if (!stored) router.push("/")` | PASS |
| Refresh analyzing page mid-analysis | Re-triggers analysis from sessionStorage | `useEffect` reads sessionStorage on mount. **BUT** `hasStarted` ref prevents re-run... except after fix, ref stays `true` so refresh would NOT re-trigger. This is a regression from the StrictMode fix | BUG (see below) |
| Refresh result page | Recovers from sessionStorage | `uraCharaResult` persists in sessionStorage | PASS |
| Browser back from result to analyzing | May re-trigger analysis | `hasStarted` ref is `true` so analysis won't re-run; shows loading state but never completes | NOTE |
| Browser back from analyzing to input | Returns to input page | Normal navigation | PASS |

---

## 5. Component Integration Review

### Type Consistency

| Check | Status | Notes |
|-------|--------|-------|
| `shared.ts` types match component props | PASS | All components correctly import from `@/types/shared` |
| `AnalysisResult` structure matches parseAnalysis output | PASS | `parseAnalysisResponse` returns correct shape |
| `StreamEvent` format matches useAnalysis expectations | PASS | `readSSEStream` correctly parses `TypedStreamEvent` with `.data` property |
| SessionStorage data shape consistency | PASS | Input page stores `UserInput`, analyzing page reads `UserInput` and stores `AnalysisResult` |
| Import paths all use `@/` alias | PASS | tsconfig paths configured correctly |

### API Response Format

| Check | Status | Notes |
|-------|--------|-------|
| SSE event encoding/decoding | PASS | `encodeStreamEvent` produces `event: type\ndata: JSON\n\n`, `decodeStreamEvent` parses this correctly |
| Tool-use response parsing | PASS | `parseAnalysisResponse` handles single and multiple tool_use blocks |
| GapLevel derivation from score | PASS | Both `parseAnalysis.ts` and `constants.ts` have consistent level ranges |
| Fallback for missing traitComparisons | PASS | `buildTraitComparisonsFromPersonas` generates from scoredTraits |
| Fallback for missing shareCard | PASS | `buildShareCardFallback` generates from other data |

---

## 6. Bugs Found and Fixed

### BUG-001: Client-side validation uses untrimmed character count for minimum length
**Severity:** Medium
**File:** `src/components/input/InputStep.tsx`
**Description:** The `charCount` used for `canProceed` validation was `value.length` (untrimmed), while the server-side `validation.ts` uses `value.trim().length`. A user could enter 50 spaces for snsContent, the client would allow submission, but the server would reject it with a 400 error.
**Root cause:** Inconsistent trimming between client and server validation.
**Fix:** Added `trimmedCharCount = value.trim().length` and used it for minimum length checks in `canProceed`. Display char count still uses untrimmed `value.length` for better UX.

### BUG-002: Model constant not used in claude.ts
**Severity:** Low
**File:** `src/lib/claude.ts`
**Description:** `API_CONFIG.claudeModel` in `constants.ts` was set to `"claude-sonnet-4-6"` but `claude.ts` hardcoded `"claude-haiku-4-5-20251001"`. The constants were defined but never imported/used, leading to inconsistency.
**Root cause:** `claude.ts` was developed separately without referencing the shared constants.
**Fix:** Imported `API_CONFIG` from constants and used `API_CONFIG.claudeModel`, `API_CONFIG.claudeTemperature`, and `API_CONFIG.claudeMaxTokens`.

### BUG-003: React StrictMode causes double API call
**Severity:** Medium
**File:** `src/app/analyzing/page.tsx`
**Description:** The `useEffect` cleanup function reset `hasStarted.current = false`, which in StrictMode (dev) would cause the effect to run twice (mount -> cleanup -> mount), triggering two API calls.
**Root cause:** Cleanup function reset the guard ref, defeating its purpose.
**Fix:** Removed the cleanup function that resets `hasStarted.current`. The ref now stays `true` after first analysis start, preventing duplicate calls.

---

## 7. Bugs Found but NOT Fixed

### BUG-004: Page refresh on /analyzing after StrictMode fix won't re-trigger analysis
**Severity:** Low
**Description:** After fixing BUG-003, the `hasStarted` ref stays `true` permanently. If a user refreshes the analyzing page (full page reload), the component remounts with `hasStarted.current = false` (fresh ref), so analysis WILL re-trigger. This is actually correct behavior for full refreshes. However, in React Fast Refresh (dev HMR), the ref may persist, causing no re-trigger. This is dev-only and acceptable.
**Recommendation:** No fix needed. Behavior is correct for production.

### BUG-005: Emoji character counting inconsistency
**Severity:** Low
**Description:** JavaScript's `.length` property counts characters by UTF-16 code units. Emoji like "👨‍👩‍👧‍👦" count as 11 characters. This could cause confusion for users trying to reach minimum character counts with emoji-heavy text. The server validation uses the same JS `.length` so there's no client/server mismatch, but the UX could be confusing.
**Recommendation:** Future enhancement. Use `[...value].length` or `Intl.Segmenter` for grapheme-based counting.

### BUG-006: `lib/prompts.ts` contains dead code
**Severity:** Very Low
**Description:** The `formatUserInput` function in `src/lib/prompts.ts` is never imported by any other file. The actual prompt formatting is done in `src/prompts/analysis.ts` by `buildAnalysisPrompt`. Both functions do the same thing.
**Recommendation:** Delete `src/lib/prompts.ts` or redirect its imports to `src/prompts/analysis.ts`.

### BUG-007: `PersonaCard` `keywords` prop always receives empty array
**Severity:** Very Low
**Description:** In `result/page.tsx`, `PersonaCard` is always called with `keywords={[]}`. The component renders keywords as `#{kw}` tags, but they never appear. The `SurfacePersona` and `HiddenPersona` types don't have a `keywords` field (it's in the product design doc but not implemented in the type).
**Recommendation:** Either remove the `keywords` prop from `PersonaCard` or populate it from available data.

### BUG-008: No API key validation on startup
**Severity:** Medium
**Description:** If `ANTHROPIC_API_KEY` is not set in `.env.local`, the app will start successfully but the Anthropic SDK will throw at runtime when making an API call. The error message shown to users would be a generic Claude API error rather than a clear "API key not configured" message.
**Recommendation:** Add a startup check or a clear error message in the API route when the key is missing.

### BUG-009: No timeout on Claude API call
**Severity:** Medium
**Description:** `API_CONFIG.claudeTimeoutMs` is defined as 30,000ms in constants but is never used in `claude.ts`. The `anthropic.messages.create()` call has no timeout configured. If the Claude API hangs, the SSE stream will stay open indefinitely.
**Recommendation:** Pass timeout option to the Anthropic SDK call, or use `AbortController` with a timeout.

---

## 8. Design Doc vs Implementation Discrepancies

| Design Doc Spec | Implementation | Gap |
|----------------|----------------|-----|
| 5 analysis steps in loading animation (product-design Section 2.3) | 4 phases in implementation | Minor: Product design has 5 visual steps but technical arch specifies 4 phases. Implementation follows technical arch. |
| Phase 3 label: "裏の顔を探索中..." (useAnalysis) vs "裏の顔を暴き中..." (constants.ts) | Different labels in two places | Minor inconsistency. useAnalysis has its own PHASE_LABELS that differ from constants.ts |
| html2canvas for screenshot | html-to-image library used instead | Acceptable alternative. `html-to-image` provides similar functionality. |
| `InputFieldConfig.chips` for Steps 2 and 5 | Implemented in input/page.tsx INPUT_STEPS | PASS - matches spec |
| "なぜ必要？" tooltip per step | Not implemented | Missing feature. `WhyTooltip.tsx` is listed in technical arch file structure but doesn't exist. |
| Claude model: claude-sonnet-4-6 (technical arch) | Was claude-haiku-4-5-20251001 in code (now fixed to use constants) | FIXED |

---

## 9. Test Data Used

### Persona 1: High Gap User (from fixtures)
- SNS content: Active cafe/gym/BBQ poster (~50+ chars)
- Hobbies: Cafe, gym, yoga, but also anime/Vtuber secretly
- Schedule: Gap between posted life and actual (二度寝, YouTube, サボり)
- Music: Public (YOASOBI) vs private (anison, vocaloid)
- Expected gap score: ~74 (moe level)

### Persona 2: Low Gap User (from fixtures)
- SNS content: Honest gamer posts (~50+ chars)
- Hobbies: Games, anime, ramen (no hidden hobbies)
- Schedule: Straightforward remote work + gaming
- Music: Anison, game soundtracks (no pretense)
- Expected gap score: ~12 (honest level)

---

## 10. Recommendations

1. **Add ANTHROPIC_API_KEY validation** in the API route to return a clear error message when the key is missing.
2. **Add Claude API timeout** using the `API_CONFIG.claudeTimeoutMs` constant that's already defined.
3. **Unify phase labels** - either use the constants from `lib/constants.ts` in `useAnalysis.ts` or vice versa.
4. **Remove dead code** in `src/lib/prompts.ts`.
5. **Add WhyTooltip component** as specified in the technical architecture (or remove from spec).
6. **Add error boundary** around the analyzing and result pages to gracefully handle unexpected errors.
7. **Consider adding a loading skeleton** for the result page when sessionStorage is being read.
8. **Add integration tests** with mock API responses using the fixture data in `__fixtures__/sampleInput.ts`.
