// Sought After Co. — Stripe Checkout for client payments.
// Cloudflare Pages Function: POST /api/checkout
//
// Same pattern as Dudela's lib/stripe.ts: raw fetch to Stripe's REST API (no SDK),
// prices set inline with price_data so nothing has to be created in the Stripe
// Dashboard first. Prices live HERE, server-side, so nobody can edit the amount
// in their browser. Keep these in sync with the PLANS list in /pay.html.
//
// Required Cloudflare Pages secret (Settings > Variables and Secrets):
//   STRIPE_SECRET_KEY = sk_test_... while testing, sk_live_... when ready
// Use the Sought After / John and Viv Ventures Stripe account, NOT Dudela's.
//
// Invoicing: every one-time payment creates a Stripe invoice + receipt
// (invoice_creation). The care plan is a Stripe subscription, so Stripe bills
// it monthly and emails the invoice on its own.

const LAUNCH_DESC = "Custom website, live in 14 days. Inquiries in one place, simple online payments, revisions until it's right.";
const GROW_DESC = "Everything in Launch, plus Google Business Profile setup and 3 months of care: site health, basic SEO, lead tracking and a call every two weeks.";

const PLANS = {
  "launch-deposit": { name: "Launch website: 50% deposit", desc: LAUNCH_DESC, cents: 62500, mode: "payment", image: "launch" },
  "launch-balance": { name: "Launch website: final 50%", desc: LAUNCH_DESC, cents: 62500, mode: "payment", image: "launch" },
  "launch-full": { name: "Launch website: paid in full", desc: LAUNCH_DESC, cents: 125000, mode: "payment", image: "launch" },
  "grow-deposit": { name: "Launch + Grow: 50% deposit", desc: GROW_DESC, cents: 175000, mode: "payment", image: "grow" },
  "grow-balance": { name: "Launch + Grow: final 50%", desc: GROW_DESC, cents: 175000, mode: "payment", image: "grow" },
  "grow-full": { name: "Launch + Grow: paid in full", desc: GROW_DESC, cents: 350000, mode: "payment", image: "grow" },
  "care-monthly": { name: "Care plan (monthly)", desc: "Site health, basic SEO, Google profile management, lead tracking and a call every two weeks. Cancel anytime.", cents: 50000, mode: "subscription", image: "care" },
  // Custom = any one-off invoice (Google profile setup, extra pages, edits).
  // Amount comes from the request but is bounded below.
  "custom": { name: "Sought After Co. invoice", desc: "", cents: null, mode: "payment", image: "invoice" },
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

  if (data.agree !== true) {
    return json({ error: "Please agree to the payment terms to continue." }, 400);
  }

  let cents = plan.cents;
  let productName = plan.name;
  let desc = plan.desc;
  if (planKey === "custom") {
    const dollars = Number(data.amount);
    cents = Math.round(dollars * 100);
    if (!Number.isFinite(cents) || cents < CUSTOM_MIN_CENTS || cents > CUSTOM_MAX_CENTS) {
      return json({ error: "Please enter an amount between $50 and $10,000." }, 400);
    }
    const label = clean(data.description, 80);
    if (label) productName = label;
    desc = "Invoice from Sought After Co.";
  }
  if (business) desc = `${business}. ${desc}`.trim();

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
    "line_items[0][price_data][product_data][description]": desc,
    "line_items[0][price_data][product_data][images][0]": `${origin}/assets/pay/${plan.image}.png`,
    "metadata[plan]": planKey,
    "metadata[client_name]": name,
    "metadata[business]": business,
    "metadata[agreed_terms]": `yes ${new Date().toISOString()}`,
    allow_promotion_codes: "true",
  };
  if (plan.mode === "subscription") {
    params["line_items[0][price_data][recurring][interval]"] = "month";
    params["subscription_data[metadata][plan]"] = planKey;
    params["subscription_data[metadata][business]"] = business;
  } else {
    // Gives the client a real invoice + receipt PDF for one-time payments.
    params["invoice_creation[enabled]"] = "true";
    params["invoice_creation[invoice_data][description]"] = productName;
    params["invoice_creation[invoice_data][footer]"] = "Thank you! Questions: hello@soughtafter.design";
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
