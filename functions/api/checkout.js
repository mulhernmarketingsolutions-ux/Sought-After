// Sought After Co. — Stripe Checkout for client payments.
// Cloudflare Pages Function: POST /api/checkout
//
// Same pattern as Dudela's lib/stripe.ts: raw fetch to Stripe's REST API (no SDK),
// prices set inline with price_data so nothing has to be created in the Stripe
// Dashboard first. Prices live HERE, server-side, so nobody can edit the amount
// in their browser.
//
// Required Cloudflare Pages secret (Settings > Variables and Secrets):
//   STRIPE_SECRET_KEY = sk_test_... while testing, sk_live_... when ready
// Use the Sought After / John and Viv Ventures Stripe account, NOT Dudela's.

const PLANS = {
  "launch-deposit": { name: "Launch: 50% deposit", cents: 62500, mode: "payment" },
  "launch-balance": { name: "Launch: final 50% at launch", cents: 62500, mode: "payment" },
  "launch-full": { name: "Launch: paid in full", cents: 125000, mode: "payment" },
  "grow-deposit": { name: "Launch + Grow: 50% deposit", cents: 175000, mode: "payment" },
  "grow-balance": { name: "Launch + Grow: final 50% at launch", cents: 175000, mode: "payment" },
  "grow-full": { name: "Launch + Grow: paid in full", cents: 350000, mode: "payment" },
  "care-monthly": { name: "Grow care plan (monthly)", cents: 50000, mode: "subscription" },
  // Custom = any one-off invoice (Google profile setup, extra pages, edits).
  // Amount comes from the request but is bounded below.
  "custom": { name: "Sought After Co. invoice", cents: null, mode: "payment" },
};

const CUSTOM_MIN_CENTS = 5000;     // $50
const CUSTOM_MAX_CENTS = 1000000;  // $10,000

function form(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function clean(s, max = 120) {
  return String(s || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Payments aren't switched on yet. Please email hello@soughtafter.design." }, 503);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const planKey = clean(data.plan, 40);
  const plan = Object.prototype.hasOwnProperty.call(PLANS, planKey) ? PLANS[planKey] : null;
  if (!plan) return json({ error: "Please pick what you're paying for." }, 400);

  const name = clean(data.name, 80);
  const email = clean(data.email, 120);
  const business = clean(data.business, 120);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "Please add your name and a valid email." }, 400);
  }

  let cents = plan.cents;
  let productName = plan.name;
  if (planKey === "custom") {
    const dollars = Number(data.amount);
    cents = Math.round(dollars * 100);
    if (!Number.isFinite(cents) || cents < CUSTOM_MIN_CENTS || cents > CUSTOM_MAX_CENTS) {
      return json({ error: "Please enter an amount between $50 and $10,000." }, 400);
    }
    const label = clean(data.description, 80);
    if (label) productName = `Sought After Co.: ${label}`;
  }
  if (business) productName = `${productName} (${business})`;

  const origin = new URL(request.url).origin;
  const params = {
    mode: plan.mode,
    customer_email: email,
    success_url: `${origin}/pay-thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pay?plan=${encodeURIComponent(planKey)}`,
    "line_items[0][quantity]": 1,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": cents,
    "line_items[0][price_data][product_data][name]": productName,
    "metadata[plan]": planKey,
    "metadata[client_name]": name,
    "metadata[business]": business,
    allow_promotion_codes: "true",
  };
  if (plan.mode === "subscription") {
    params["line_items[0][price_data][recurring][interval]"] = "month";
    params["subscription_data[metadata][plan]"] = planKey;
    params["subscription_data[metadata][business]"] = business;
  } else {
    // Gives the client a real invoice + receipt PDF for one-time payments.
    params["invoice_creation[enabled]"] = "true";
    params["payment_intent_data[description]"] = productName;
    params["payment_intent_data[metadata][plan]"] = planKey;
    params["payment_intent_data[metadata][business]"] = business;
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form(params),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.url) {
    console.log("Stripe error", res.status, out && out.error && out.error.message);
    return json({ error: "Couldn't start checkout. Please try again or email hello@soughtafter.design." }, 502);
  }
  return json({ url: out.url });
}

export async function onRequest() {
  return json({ error: "Method not allowed." }, 405);
}
