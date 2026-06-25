# Little Layers — Website 🛍️💜

A custom, brand-matched online shop for Little Layers, with Stripe checkout and a
"name to print" field for personalized products. Built to cost ~$0/month — you only
pay Stripe's small per-sale fee (about 2.9% + 30¢) plus your domain.

---

## What's in this folder

| File | What it does |
|---|---|
| `index.html` | The whole storefront — design, products, cart, checkout. Open it to preview. |
| `api/create-checkout-session.js` | The secure Stripe checkout (runs on free Vercel hosting). |
| `package.json` | Tells the host to install Stripe. |
| `photos/` | (Optional) put your product photos here. |

You can double-click `index.html` anytime to see the site. The cart and
personalization work right away. **Payments turn on after you connect Stripe** (below).

---

## 1) Set your real prices

Open `index.html`, find the `PRODUCTS` list near the bottom (after the comment
`PRODUCTS — edit prices & photos here`). Each product looks like this:

```js
{ id:'bloomstack', name:'BloomStack Organizer', price:24,
  desc:'A flower-shaped, stackable organizer…',
  emoji:'🌸', personalize:false, img:'' },
```

- `price:` — change `24` to your real price (just the number, in dollars).
- `name:` / `desc:` — edit the wording however you like.
- `personalize:true` — adds the "Name to print" box (already on for the caddies).
- The current prices are **placeholders** — please set your own.

## 2) Add product photos (optional but recommended)

1. Put your photos in the `photos/` folder (e.g. `photos/bloomstack.jpg`).
2. In the `PRODUCTS` list, set `img:'photos/bloomstack.jpg'`.
   When `img` is filled, it replaces the colorful emoji placeholder.

Square photos (e.g. 800×800) look best.

## 3) Connect Stripe (turns payments on) — ~5 minutes

1. Create a free Stripe account at https://stripe.com (use the business email).
2. In the Stripe Dashboard → **Developers → API keys**, copy your **Secret key**
   (starts with `sk_…`). Keep it private — never paste it into the website code.
3. Deploy the site to **Vercel** (free) — see step 4.
4. In Vercel → your project → **Settings → Environment Variables**, add:
   - Name: `STRIPE_SECRET_KEY`
   - Value: your `sk_…` key
5. Redeploy. Done — the "Checkout with Stripe" button now opens a real, secure
   Stripe payment page. The customer's personalization name rides along on the order.

> Until you do this, the checkout button shows a friendly "payments aren't switched
> on yet" note instead of erroring. Nothing breaks.

## 4) Put it online for free (Vercel)

1. Make a free account at https://vercel.com.
2. Click **Add New → Project → import** this folder (or connect it from GitHub).
3. Deploy. You'll get a free `…vercel.app` link instantly.
4. Add your domain (e.g. `littlelayersbyirha.com`) in **Settings → Domains** once
   you've purchased it.

*(Netlify works too, but the included checkout function is written for Vercel.)*

---

## Notes & ideas for later
- Shipping is set to a flat $5 example inside `api/create-checkout-session.js` — edit it.
- Stripe emails you on every sale; you can also see orders in the Stripe Dashboard.
- For extra safety you can switch to fixed Stripe **Price IDs** instead of sending
  prices from the page — ask and I'll set that up.
- Want order confirmation emails, a contact form, or a "custom request" page? Easy adds.

Made with 💜 and a 3D printer.
