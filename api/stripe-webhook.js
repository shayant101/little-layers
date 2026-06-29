// Little Layers — order-alert webhook (Vercel serverless function)
// On a completed checkout, emails an order summary to the team via Resend.
//
// Env vars (set in Vercel):
//   STRIPE_SECRET_KEY  — already set (used to re-fetch authoritative order data)
//   RESEND_API_KEY     — your Resend key (re_...)
//   WEBHOOK_TOKEN      — shared secret; the Stripe endpoint URL must include ?token=THIS
//   ALERT_EMAILS       — comma-separated recipients (no domain in Resend => only your
//                        Resend signup email will deliver; add more once a domain is verified)
//   ALERT_FROM         — optional; defaults to "Little Layers <onboarding@resend.dev>"
//                        (change to orders@yourdomain.com after verifying a domain in Resend)

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Authenticate the caller via a token in the URL (only Stripe, configured by us, knows it).
  const token = (req.query && req.query.token) || '';
  if (!process.env.WEBHOOK_TOKEN || token !== process.env.WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!secret || !resendKey) return res.status(503).json({ error: 'Not configured' });

  try {
    const event = req.body || {};
    if (event.type !== 'checkout.session.completed') {
      return res.status(200).json({ ignored: event.type || 'unknown' });
    }

    const stripe = Stripe(secret);
    // Re-fetch from Stripe so we trust the data (not the incoming payload).
    const s = await stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand: ['line_items', 'shipping_cost.shipping_rate'],
    });

    const cd = s.customer_details || {};
    const sd = s.shipping_details || null;
    const money = (c) => '$' + ((c || 0) / 100).toFixed(2);
    const shipName = (s.shipping_cost && s.shipping_cost.shipping_rate && s.shipping_cost.shipping_rate.display_name) || '—';
    const isPickup = /pickup/i.test(shipName);
    const addr = sd && sd.address
      ? [sd.address.line1, sd.address.line2, [sd.address.city, sd.address.state, sd.address.postal_code].filter(Boolean).join(', '), sd.address.country].filter(Boolean).join('<br>')
      : '';
    const rows = ((s.line_items && s.line_items.data) || []).map(
      (li) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${li.quantity}× ${li.description}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${money(li.amount_total)}</td></tr>`
    ).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#2B2530">
        <h2 style="margin:0 0 4px">🎉 New Little Layers order — ${money(s.amount_total)}</h2>
        <p style="color:#7A7280;margin:0 0 16px">${new Date().toLocaleString()}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">${rows}
          <tr><td style="padding:8px 10px;font-weight:bold">Total</td><td style="padding:8px 10px;text-align:right;font-weight:bold">${money(s.amount_total)}</td></tr>
        </table>
        <p style="margin:0 0 4px"><b>Fulfillment:</b> ${isPickup ? '🏠 Local pickup (Irvine)' : '📦 ' + shipName}</p>
        ${!isPickup && addr ? `<p style="margin:0 0 12px;color:#555">${sd.name || ''}<br>${addr}</p>` : ''}
        <p style="margin:0"><b>Customer:</b> ${cd.name || '—'}<br>
        <b>Email:</b> ${cd.email || '—'}<br>
        <b>Phone:</b> ${cd.phone || '—'}</p>
        <p style="color:#999;font-size:12px;margin-top:20px">Full details in your Stripe Dashboard.</p>
      </div>`;

    const to = (process.env.ALERT_EMAILS || cd.email || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (to.length) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.ALERT_FROM || 'Little Layers <onboarding@resend.dev>',
          to,
          subject: `🎉 New order — ${money(s.amount_total)}`,
          html,
        }),
      });
      if (!r.ok) console.error('Resend error:', r.status, await r.text());
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Return 200 so Stripe doesn't retry forever on our internal hiccups.
    return res.status(200).json({ ok: false });
  }
};
