// Little Layers — Stripe Checkout (Vercel serverless function)
// ------------------------------------------------------------
// This securely creates a Stripe Checkout session from the cart.
// It needs ONE secret: STRIPE_SECRET_KEY (set in Vercel, never in code).
// See README.md → "Connect Stripe" for the 5-minute setup.

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    // Stripe not connected yet — the site shows a friendly message.
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const stripe = Stripe(secret);

  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Build Stripe line items from the cart. Prices come from the cart,
    // but Stripe re-checks them — for production you may prefer fixed
    // Stripe Price IDs (see README, optional hardening).
    const line_items = items.map((it) => {
      const name = it.personalName
        ? `${it.name} — personalized: "${it.personalName}"`
        : it.name;
      return {
        quantity: Math.max(1, parseInt(it.qty, 10) || 1),
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(it.price) * 100), // dollars -> cents
          product_data: {
            name,
            metadata: it.personalName ? { name_to_print: it.personalName } : {},
          },
        },
      };
    });

    const origin =
      req.headers.origin ||
      `https://${req.headers.host}` ||
      'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
      shipping_address_collection: { allowed_countries: ['US'] },
      // Collect a phone number so you can reach the customer about made-to-order items.
      phone_number_collection: { enabled: true },
      // Simple flat-rate shipping example ($5). Edit or remove in Stripe later.
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 500, currency: 'usd' },
            display_name: 'Standard shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
      ],
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
};
