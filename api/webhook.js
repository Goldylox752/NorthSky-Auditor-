import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

/* =========================
   STRIPE WEBHOOK (OS CORE)
========================= */
export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send("Webhook Error");
  }

  /* =========================
     ID EMPOTENCY CHECK
  ========================= */
  const eventId = event.id;

  const { data: exists } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (exists) {
    return res.json({ skipped: true });
  }

  await supabase.from("stripe_events").insert({
    id: eventId,
    processed: true,
  });

  /* =========================
     PAYMENT SUCCESS
  ========================= */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session.customer_details?.email;

    const linkId =
      session.payment_link ||
      session.payment_link_id ||
      session.metadata?.plan ||
      session.metadata?.link_id;

    const plan = getPlanFromLink(linkId);

    console.log("💰 PAYMENT:", email, plan);

    /* =========================
       UPSERT USER
    ========================= */
    await supabase.from("users").upsert({
      email,
      paid: true,
      plan,
      stripe_customer: session.customer,
      updated_at: new Date().toISOString(),
    });

    /* =========================
       CREATE ORG (OS INSTANCE)
    ========================= */
    const { data: org } = await supabase
      .from("organizations")
      .insert({
        owner_email: email,
        plan,
        status: "active",
      })
      .select()
      .single();

    /* =========================
       APPLY PLAN RULES (OS BRAIN)
    ========================= */
    const config = getPlanConfig(plan);

    await supabase.from("org_settings").insert({
      org_id: org.id,
      plan,
      max_agents: config.max_agents,
      max_leads_per_day: config.max_leads_per_day,
      priority: config.priority,
    });

    console.log("🧠 OS PROVISIONED:", email, plan);
  }

  return res.status(200).json({ received: true });
}

/* =========================
   PLAN RESOLUTION (TRUTH LAYER)
========================= */
function getPlanFromLink(linkId) {
  const map = {
    aFaeV6cX97yIfsjcvu2ZO0E: "starter",
    dRm28k8GTaKU1Btcvu2ZO0D: "pro",
    dRmfZae1d2eoeofgLK2ZO0C: "elite",
  };

  return map[linkId] || "starter";
}

/* =========================
   PLAN ENGINE (OS RULES)
========================= */
function getPlanConfig(plan) {
  switch (plan) {
    case "starter":
      return {
        max_agents: 1,
        max_leads_per_day: 20,
        priority: 3,
      };

    case "pro":
      return {
        max_agents: 5,
        max_leads_per_day: 100,
        priority: 2,
      };

    case "elite":
      return {
        max_agents: 20,
        max_leads_per_day: 999,
        priority: 1,
      };

    default:
      return {
        max_agents: 1,
        max_leads_per_day: 20,
        priority: 3,
      };
  }
}

/* =========================
   BUFFER HELPER
========================= */
async function buffer(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(
      typeof chunk === "string" ? Buffer.from(chunk) : chunk
    );
  }

  return Buffer.concat(chunks);
}