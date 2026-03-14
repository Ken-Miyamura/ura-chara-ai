# UraChara AI

## What is this?
An AI app that reveals your hidden personality ("裏キャラ").
Users paste their own data (SNS posts, hobbies, schedule, music taste, first impressions),
and the AI analyzes the gap between their surface personality and hidden personality.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS + Framer Motion
- Anthropic Claude API
- TypeScript strict mode

## Data Strategy
- MVP: User hand-input only (text paste). No SNS API integration.
- No database in MVP. All state is client-side.
- Future: Instagram Graph API integration (most promising for persona data).
- Future: Supabase for share feature + analytics.

## Key Files
- docs/product-design.md - Product specification
- docs/technical-architecture.md - Technical spec
- src/types/shared.ts - Shared type definitions (source of truth)

## Rules
- TypeScript strict mode. No `any` types.
- All API keys via environment variables only.
- Each component must be independently testable.
- No database calls in MVP. Do not install Supabase or any ORM.
- Japanese comments are OK. Code in English.