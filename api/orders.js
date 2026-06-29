// Little Layers — Orders API (Vercel serverless function)
// Returns recent paid orders for the branded Orders page.
// Protected by ORDERS_PASSWORD (set in Vercel). Uses the existing STRIPE_SECRET_KEY.

const Stripe = require('stripe');

module.exports = async (req, res) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const pw = process.env.ORDERS_PASSWORD;
  if (!secret) return res.status(503).json({ error: 'Stripe not configured' });
  if (!pw) return res.status(503).json({ error: 'Orders page not enabled — set ORDERS_PASSWORD in Vercel.' });

  const given = (req.headers['x-orders-pw'] || (req.query && req.query.pw) || '').toString();
  if (given !== pw) return res.status(401).json({ error: 'Wrong password' });

  const stripe = Stripe(secret);
  try {
    const list = await stripe.checkout.sessions.list({ limit: 40 });
    const paid = list.data.filter((s) => s.payment_status === 'paid').slice(0, 25);

    const orders = [];
    for (const s of paid) {
      const full = await stripe.checkout.sessions.retrieve(s.id, {
        expand: ['line_items', 'shipping_cost.shipping_rate'],
      });
      const cd = full.customer_details || {};
      const sd = full.shipping_details || null;
      orders.push({
        id: full.id,
        created: full.created,
        amount: full.amount_total,
        currency: (full.currency || 'usd').toUpperCase(),
        status: full.payment_status,
        customerName: cd.name || (sd && sd.name) || '',
        email: cd.email || '',
        phone: cd.phone || '',
        shipMethod: (full.shipping_cost && full.shipping_cost.shipping_rate && full.shipping_cost.shipping_rate.display_name) || '',
        shipName: sd && sd.name ? sd.name : '',
        address: sd && sd.address ? sd.address : null,
        items: ((full.line_items && full.line_items.data) || []).map((li) => ({
          desc: li.description,
          qty: li.quantity,
          amount: li.amount_total,
        })),
      });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ orders });
  } catch (err) {
    console.error('Orders API error:', err);
    return res.status(500).json({ error: 'Could not load orders' });
  }
};
