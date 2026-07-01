# Handoff / Status — Payment Integration

> Shared source of truth between Claude Code and Claude Cowork sessions.
> Whoever picks this up: read this first, then update it before you stop.
> Last updated: 2026-06-28

## Where the work lives
- **Active branch:** `claude/payment-integration-usxgb4` (pushed to `origin`).
- **`main` does NOT yet have these payment improvements.** They are only on the branch above.
- To resume: `git fetch origin claude/payment-integration-usxgb4 && git checkout claude/payment-integration-usxgb4 && git pull`

## What already existed (on `main`)
- Stripe Checkout serverless function: `api/create-checkout-session.js`
- Storefront with working cart + "Checkout" button: `index.html`
- `package.json` with the `stripe` dependency

## What this branch adds (latest commit)
- **Post-checkout confirmation** in `index.html`: returning to `/?paid=1` shows a
  "Thank you for your order" toast and empties the bag; `/?canceled=1` shows a
  friendly "checkout canceled" note. URL is tidied after.
- **Cart persistence** via `localStorage` (survives the Stripe redirect / cancel).
- **Server-side validation** in `api/create-checkout-session.js`: rejects invalid /
  non-positive prices, clamps quantity (1–99), bounds name length.
- **Node pinned** to `>=18` in `package.json` for a supported Vercel runtime.

## External state (NOT in git — must be tracked here)
- **Vercel project:** `little-layers` exists under team "Shayan's projects"
  (`team_a6pFUvb6fybdNSBOatEron8L`, project `prj_oKhKc7aNXnQQj6BSMOnQkTQQFoXH`).
- **`STRIPE_SECRET_KEY` env var: NOT set yet.** This is the only thing blocking live payments.
  The checkout function reads `process.env.STRIPE_SECRET_KEY`.
- **Stripe key location:** there is no stored key in Drive/Gmail/Dropbox (Stripe never
  emails the secret). Reveal it from the Stripe Dashboard → Developers → API keys.

## Decisions made
- **Test first:** start with the Stripe **TEST** key (`sk_test_…`) and verify the full
  flow before switching to the live `sk_live_…` key.
- Secret key goes in **Vercel env vars only** — never committed to the repo or pasted in chat.

## New product added (from Dropbox `/Little Layers` pricing doc)
- **Drawella** — stackable two-drawer set, **$32**, no personalization — added to the
  `PRODUCTS` list in `index.html`. It was the only doc item with no counterpart on the site.
- **Image = TEMPORARY:** using the existing `photos/vanitydrawers.jpg`. The intended new
  photo is one of the Jun-25 PNGs in the Dropbox `/Little Layers` folder, but this
  environment's **network policy blocks `*.dropboxusercontent.com`**, so it can't be
  pulled here. To swap: attach the real photo in Claude Code, OR have Cowork commit it to
  `/photos`, OR widen the env network policy to allow Dropbox and re-pull. Then point
  `img:` for `drawella` at the new file.
- Other doc items (Orange caddy, Doodle Dish Large, Flower pencil Holder) use with/without-name
  or set-of-2/3 pricing that the current single-price format doesn't model — deferred.

## Open / next steps
- [ ] Stripe → Test mode → reveal `sk_test_…` secret key.
- [ ] Vercel → little-layers → Settings → Environment Variables → add
      `STRIPE_SECRET_KEY = sk_test_…` (Production; optionally Preview/Dev) → Save.
- [ ] Redeploy (Vercel → Deployments → ⋯ → Redeploy).
- [ ] Test checkout with card `4242 4242 4242 4242`, any future expiry / CVC / ZIP.
- [ ] Swap test key for live `sk_live_…` once verified.
- [ ] **Product prices in `index.html` are still placeholders ($18–$26)** — set real prices.
- [ ] Merge this branch into `main` (or deploy it) so the confirmation/cart-persistence
      improvements reach the live site. No PR opened yet.
