# Revenue-Ready Plan

## Goal
Prepare Lunascope to onboard early users, measure conversion, and charge for premium signals without rewriting the product later.

## Modules To Build Next

### 1. Wallet Access Layer
- Replace the current mocked wallet chooser with a real connector stack.
- Recommended modules:
  - `lib/wallet/connector.ts`
  - `components/wallet/connect-modal.tsx`
  - `components/wallet/session-badge.tsx`
- Suggested stack: `wagmi`, `viem`, `@rainbow-me/rainbowkit` or a lean custom connector if tighter control matters more than speed.
- Revenue reason: wallet identity becomes the account primitive for subscriptions, invite redemption, and signal entitlements.

### 2. Invite / Early Access System
- Expand the current invite-code verification into a persistent allowlist service.
- Recommended modules:
  - `lib/access/repository.ts`
  - `lib/access/service.ts`
  - `app/api/access/redeem/route.ts`
  - `app/api/access/status/route.ts`
- Data model:
  - `invite_codes`: code, tier, max_redemptions, redeemed_count, expires_at
  - `wallet_access`: wallet_address, tier, granted_at, source_code, status
- Revenue reason: creates scarcity, supports partnerships, and enables gated premium cohorts before public launch.

### 3. Conversion Analytics
- Keep privacy-first event capture but move beyond console logging.
- Recommended modules:
  - `lib/analytics/schema.ts`
  - `lib/analytics/store.ts`
  - `app/api/analytics/batch/route.ts`
  - `app/admin/conversion/page.tsx`
- Track:
  - gate opened
  - wallet selected
  - invite code rejected
  - access granted
  - viewed preview only
  - reached dashboard
- Storage options:
  - Postgres table
  - self-hosted PostHog
  - Plausible + server-side custom events
- Revenue reason: shows exactly where traffic leaks before unlock and before paid conversion.

### 4. Subscription & Entitlements
- Add tiering before exposing premium alpha broadly.
- Recommended modules:
  - `lib/billing/tiers.ts`
  - `lib/billing/entitlements.ts`
  - `app/api/billing/checkout/route.ts`
  - `app/api/billing/webhook/route.ts`
- Billing options:
  - Stripe for fiat subscriptions
  - Helio / Coinbase Commerce for crypto checkout
- Suggested tiers:
  - Free Preview
  - Pro Signals
  - Desk / Research
- Revenue reason: separates unlocked dashboard access from paid signal depth and alert frequency.

### 5. Market Data Aggregation & Caching
- Replace placeholder snapshot logic with a production market pipeline.
- Recommended modules:
  - `lib/markets/polymarket-client.ts`
  - `lib/markets/normalizer.ts`
  - `lib/markets/snapshot-service.ts`
  - `lib/ai/scoring-service.ts`
  - `app/api/markets/snapshot/route.ts`
- Technical requirements:
  - server-side caching via `unstable_cache`
  - stale-while-revalidate behavior
  - tag-based invalidation for key events
  - rate limiting and fallback snapshots
- Revenue reason: stable data infrastructure protects trust during traffic spikes from X/Twitter or KOL mentions.

### 6. Premium Signal Delivery
- Build the actual monetizable product surface on top of the dashboard shell.
- Recommended modules:
  - `components/signals/signal-list.tsx`
  - `components/signals/edge-card.tsx`
  - `components/signals/copy-trade-panel.tsx`
  - `app/api/signals/live/route.ts`
- Paid unlock dimensions:
  - more signals
  - faster refresh cadence
  - higher-confidence filters
  - smart-money copy presets
  - SMS / Telegram / email alerts

## Recommended Build Order
1. Real wallet connector
2. Persistent invite redemption
3. Analytics storage + dashboard
4. Polymarket ingest + cache layer
5. Paid tiers and entitlements
6. Premium signal alerting

## Immediate Notes
- Metadata and OG support are now present.
- A basic invite-code gate exists and can be driven from `LUNASCOPE_INVITE_CODES`.
- A privacy-first analytics endpoint exists and currently logs anonymous events.
- A cache helper exists for the future Polymarket/AI aggregation layer.
