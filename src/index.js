/**
 * FTRIVA WEBSITE CLOUDFLARE WORKER
 * Uses the separate FTRIVA Website Supabase project.
 * Secrets: PAYSTACK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Monthly plan variables: PAYSTACK_PLAN_ESSENTIAL, PAYSTACK_PLAN_PLUS, PAYSTACK_PLAN_ELITE
 */

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-paystack-signature"
};

const PACKAGES = {
  START:       { name: "START",       amount: 19900, type: "once_off", assessmentRequired: true },
  PROGRESS:    { name: "PROGRESS",    amount: 39900, type: "once_off", assessmentRequired: true },
  PERFORMANCE:{ name: "PERFORMANCE", amount: 29900, type: "once_off", assessmentRequired: true },
  DIGITAL:     { name: "DIGITAL",     amount: 4900,  type: "digital",  assessmentRequired: false },
  ESSENTIAL:   { name: "ESSENTIAL",   amount: 24900, type: "monthly", planEnv: "PAYSTACK_PLAN_ESSENTIAL" },
  PLUS:        { name: "PLUS",        amount: 39900, type: "monthly", planEnv: "PAYSTACK_PLAN_PLUS" },
  ELITE:       { name: "ELITE",       amount: 59900, type: "monthly", planEnv: "PAYSTACK_PLAN_ELITE" }
};

// All four once-off programmes, including DIGITAL, qualify for Founding 10.
const FOUNDING10_PACKAGES = new Set(["START", "PROGRESS", "PERFORMANCE", "DIGITAL"]);

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function safeText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

function getSupabaseConfig(env) {
  const url = safeText(env.SUPABASE_URL, 300).replace(/\/+$/, "");
  const key = safeText(env.SUPABASE_SERVICE_ROLE_KEY, 1000);
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloudflare Worker Variables and Secrets.");
  }
  return { url, key };
}

/**
 * Supabase's newer sb_secret_ keys are API keys, not legacy JWT service-role
 * tokens. Send them as `apikey`; do not put an sb_secret_ key in a Bearer
 * Authorization header.
 */
async function supabaseRequest(path, env, options = {}) {
  const { url, key } = getSupabaseConfig(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  if (!headers.has("content-type") && options.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${url}${path}`, {
    ...options,
    headers
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Supabase request failed (${response.status}): ${(detail || "Unknown error").slice(0, 500)}`);
  }
  return data;
}

async function sendSignupNotification(env, signupType) {
  // Notifications are deliberately generic: customer details and assessment
  // information remain in the FTRIVA Website Supabase project.
  if (!env.EMAIL || typeof env.EMAIL.send !== "function") return;
  try {
    await env.EMAIL.send({
      from: "notifications@ftriva.com",
      to: "ftrivafitness@gmail.com",
      subject: "New FTRIVA sign-up",
      text: `A new FTRIVA ${signupType} has been recorded. Sign in to the FTRIVA Website Supabase project to review the full record. No customer personal or assessment information is included in this email.`
    });
  } catch (error) {
    // Email failure must never undo or block a successful purchase or claim.
    console.error("FTRIVA sign-up notification failed:", error?.code || "EMAIL_ERROR", error?.message || "Unknown email error");
  }
}

async function paystackRequest(path, secret, body) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.status) {
    throw new Error(result.message || `Paystack request failed (${response.status}).`);
  }
  return result.data;
}

async function verifyPaystack(reference, env) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured in this Worker.");
  }
  const payment = await paystackRequest(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    env.PAYSTACK_SECRET_KEY
  );
  if (payment.status !== "success") {
    throw new Error("Paystack has not verified this transaction as successful.");
  }
  return payment;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function getPackageFromPayment(payment) {
  const packageId = safeText(payment?.metadata?.ftriva_package, 30).toUpperCase();
  return { packageId, packageInfo: PACKAGES[packageId] || null };
}

function verifyAmountAndCurrency(payment, packageId, packageInfo) {
  if (!packageInfo) throw new Error("This transaction is not associated with a recognised FTRIVA package.");
  if (payment.currency !== "ZAR") throw new Error("The verified transaction currency does not match ZAR.");
  const actualAmount = Number(payment.amount);
  if (!Number.isFinite(actualAmount) || actualAmount < packageInfo.amount) {
    throw new Error("The verified transaction amount does not match the selected FTRIVA package.");
  }
  // For once-off products, require the exact Black Friday amount. Monthly
  // Paystack plan payments are checked against their configured plan amount.
  if (packageInfo.type !== "monthly" && actualAmount !== packageInfo.amount) {
    throw new Error("The verified transaction amount is not the current price for this FTRIVA package.");
  }
}

async function savePurchase(payment, packageId, env) {
  const packageInfo = PACKAGES[packageId];
  const customerEmail = safeText(payment.customer?.email, 254).toLowerCase();
  const record = {
    payment_reference: payment.reference,
    customer_email: customerEmail,
    customer_name: safeText(payment.metadata?.customer_name, 120),
    phone: safeText(payment.metadata?.phone, 40),
    package_id: packageId,
    package_name: packageInfo.name,
    amount: Number(payment.amount),
    currency: payment.currency || "ZAR",
    payment_status: "success",
    paystack_customer_code: safeText(payment.customer?.customer_code, 120) || null,
    paystack_authorization_code: safeText(payment.authorization?.authorization_code, 160) || null,
    channel: safeText(payment.channel, 60) || null,
    paid_at: payment.paid_at || payment.paidAt || new Date().toISOString(),
    raw_paystack_data: payment
  };

  await supabaseRequest(
    `/rest/v1/ftriva_purchases?on_conflict=payment_reference`,
    env,
    {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(record)
    }
  );
}

async function savePaidAssessment(payment, packageId, assessment, env) {
  const customerEmail = safeText(
    payment.customer?.email || assessment?.personal?.email,
    254
  ).toLowerCase();
  if (!validEmail(customerEmail)) {
    throw new Error("A valid customer email address is required in the assessment.");
  }

  const record = {
    payment_reference: payment.reference,
    package_type: packageId,
    customer_email: customerEmail,
    assessment_data: assessment,
    requested_start_date: safeText(assessment.startDate, 40) || null,
    status: "assessment_submitted",
    submitted_at: new Date().toISOString()
  };

  await supabaseRequest(
    `/rest/v1/ftriva_assessments?on_conflict=payment_reference`,
    env,
    {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(record)
    }
  );
}

async function submitFounding10Assessment(claimToken, assessment, env) {
  const token = safeText(claimToken, 200);
  if (!token) throw new Error("Your Founding 10 claim token is missing.");
  const tokenHash = await sha256(token);

  // The database function consumes the claim and inserts the assessment in
  // one transaction, so a failed insert never strands a valid claim.
  const result = await supabaseRequest("/rest/v1/rpc/submit_ftriva_founding10_assessment", env, {
    method: "POST",
    body: JSON.stringify({
      p_claim_token_hash: tokenHash,
      p_assessment: assessment
    })
  });

  if (!result?.submitted) {
    const error = new Error("This Founding 10 claim is invalid, expired or has already been submitted.");
    error.status = 409;
    throw error;
  }
}

async function handlePaymentInitialize(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Please submit valid checkout details." }, 400); }

  const packageId = safeText(body.package, 30).toUpperCase();
  const packageInfo = PACKAGES[packageId];
  const email = safeText(body.email, 254).toLowerCase();
  const fullName = safeText(body.fullName, 120);
  const phone = safeText(body.phone, 40);

  if (!packageInfo || !validEmail(email) || !fullName || !phone) {
    return json({ error: "Please provide your name, valid email, phone number and a FTRIVA package." }, 400);
  }
  if (!env.PAYSTACK_SECRET_KEY) {
    return json({ error: "Payment setup is incomplete. PAYSTACK_SECRET_KEY is missing from Worker Secrets." }, 503);
  }

  const callbackUrl = `${new URL(request.url).origin}/payment-callback.html`;
  const payload = {
    email,
    currency: "ZAR",
    callback_url: callbackUrl,
    metadata: {
      custom_fields: [
        { display_name: "Customer name", variable_name: "customer_name", value: fullName },
        { display_name: "Phone", variable_name: "phone", value: phone },
        { display_name: "FTRIVA package", variable_name: "ftriva_package", value: packageId }
      ],
      ftriva_package: packageId,
      customer_name: fullName,
      phone,
      environment: env.ENVIRONMENT || "test"
    }
  };

  if (packageInfo.type === "monthly") {
    const planCode = safeText(env[packageInfo.planEnv], 160);
    if (!planCode) {
      return json({
        error: `${packageInfo.name} membership checkout is not configured. Add its Paystack plan code as ${packageInfo.planEnv}. No payment has been taken.`
      }, 503);
    }
    payload.plan = planCode;
  } else {
    payload.amount = packageInfo.amount;
  }

  try {
    const result = await paystackRequest("/transaction/initialize", env.PAYSTACK_SECRET_KEY, payload);
    return json({ authorizationUrl: result.authorization_url, reference: result.reference, package: packageId });
  } catch (error) {
    return json({ error: error.message || "Unable to start Paystack checkout." }, 502);
  }
}

async function handlePaymentVerify(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid payment verification request." }, 400); }
  const reference = safeText(body.reference, 120);
  if (!reference) return json({ error: "The Paystack transaction reference is required." }, 400);

  try {
    const payment = await verifyPaystack(reference, env);
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    verifyAmountAndCurrency(payment, packageId, packageInfo);

    try {
      await savePurchase(payment, packageId, env);
    } catch (error) {
      return json({
        verified: true,
        recorded: false,
        reference: payment.reference,
        package: packageId,
        error: `Your payment is verified, but the purchase record could not be saved. Do not pay again. Contact FTRIVA. ${error.message}`
      }, 503);
    }

    return json({
      verified: true,
      recorded: true,
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      package: packageId,
      customer: safeText(payment.customer?.email, 254)
    });
  } catch (error) {
    return json({ verified: false, error: error.message || "Payment verification failed." }, error.status || 400);
  }
}

async function handlePaymentRecover(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ verified: false, error: "Invalid payment recovery request." }, 400); }
  const reference = safeText(body.reference, 120);
  if (!reference) return json({ verified: false, error: "The original Paystack transaction reference is required." }, 400);
  try {
    const payment = await verifyPaystack(reference, env);
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    verifyAmountAndCurrency(payment, packageId, packageInfo);
    return json({ verified: true, reference: payment.reference, package: packageId, amount: payment.amount, currency: payment.currency });
  } catch (error) {
    return json({ verified: false, error: error.message || "Payment recovery failed." }, error.status || 400);
  }
}

async function handleFounding10Claim(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid Founding 10 claim details." }, 400); }

  const packageId = safeText(body.package, 30).toUpperCase();
  const fullName = safeText(body.fullName, 120);
  const email = safeText(body.email, 254).toLowerCase();
  const phone = safeText(body.phone, 40);
  if (!FOUNDING10_PACKAGES.has(packageId) || !fullName || !validEmail(email) || !phone) {
    return json({ error: "Choose START, PROGRESS, PERFORMANCE or DIGITAL and provide valid contact details." }, 400);
  }

  try {
    const claimToken = `${crypto.randomUUID()}.${crypto.randomUUID()}`;
    const tokenHash = await sha256(claimToken);
    const result = await supabaseRequest("/rest/v1/rpc/claim_ftriva_founding10", env, {
      method: "POST",
      body: JSON.stringify({
        p_full_name: fullName,
        p_email: email,
        p_phone: phone,
        p_package_id: packageId,
        p_claim_token_hash: tokenHash
      })
    });

    if (!result?.claimed) {
      if (result?.reason === "duplicate") {
        return json({ claimed: false, error: "This email address has already used a Founding 10 claim." }, 409);
      }
      if (result?.reason === "invalid_package") {
        return json({ claimed: false, error: "This package is not eligible for the Founding 10." }, 400);
      }
      if (result?.reason === "full") {
        return json({ claimed: false, error: "All 10 Founding 10 places have been claimed." }, 409);
      }
      return json({ claimed: false, error: "The Founding 10 claim details could not be accepted." }, 400);
    }

    await sendSignupNotification(env, "Founding 10 free-programme claim");
    return json({
      claimed: true,
      claimToken,
      remaining: Math.max(0, 10 - Number(result.claimed_count || 0))
    });
  } catch (error) {
    return json({ error: `The Founding 10 claim system is not ready. ${error.message}` }, 503);
  }
}

async function handleAssessmentSubmit(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid assessment submission." }, 400); }
  const assessment = body.assessment;
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment)) {
    return json({ error: "Assessment data is missing." }, 400);
  }

  if (body.claimToken) {
    try {
      await submitFounding10Assessment(body.claimToken, assessment, env);
      return json({ submitted: true, founding10: true, message: "Your Founding 10 assessment has been submitted." });
    } catch (error) {
      return json({ error: `Your assessment could not be saved. ${error.message}` }, error.status || 503);
    }
  }

  const reference = safeText(body.paymentReference, 120);
  if (!reference) return json({ error: "A verified payment reference or Founding 10 claim is required." }, 403);

  try {
    const payment = await verifyPaystack(reference, env);
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    if (!packageInfo || !packageInfo.assessmentRequired) {
      return json({ error: "This purchase does not require a personalised fitness assessment." }, 403);
    }
    verifyAmountAndCurrency(payment, packageId, packageInfo);

    // Ensure a verified purchase exists before inserting the assessment because
    // the assessments table references ftriva_purchases.payment_reference.
    await savePurchase(payment, packageId, env);
    await savePaidAssessment(payment, packageId, assessment, env);
    return json({ submitted: true, message: "Your assessment has been submitted successfully." });
  } catch (error) {
    return json({
      error: "Your payment may already be verified, but the assessment could not be saved. Do not pay again.",
      detail: error.message,
      paymentVerified: true
    }, error.status || 503);
  }
}


async function hmacSha512Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function membershipPackageForPlan(planCode, env) {
  for (const id of ["ESSENTIAL", "PLUS", "ELITE"]) {
    if (safeText(env[PACKAGES[id].planEnv], 160) === planCode) return id;
  }
  return null;
}

async function handlePaystackWebhook(request, env) {
  if (!env.PAYSTACK_SECRET_KEY) return json({ error: "Webhook secret is not configured." }, 503);
  const rawBody = await request.text();
  const suppliedSignature = request.headers.get("x-paystack-signature") || "";
  const expectedSignature = await hmacSha512Hex(env.PAYSTACK_SECRET_KEY, rawBody);
  if (!constantTimeEqual(suppliedSignature.toLowerCase(), expectedSignature)) {
    return json({ error: "Invalid Paystack webhook signature." }, 401);
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ error: "Invalid webhook payload." }, 400); }
  const eventType = safeText(event.event, 100) || "unknown";
  const data = event.data || {};
  const eventKey = await sha256(rawBody);
  const subscriptionCode = safeText(data.subscription_code || data.subscription?.subscription_code, 160);

  // Keep an auditable, idempotent event record. A repeated webhook uses the
  // same SHA-256 event key and cannot create duplicate event rows.
  const eventRows = await supabaseRequest("/rest/v1/ftriva_paystack_events?on_conflict=event_key", env, {
    method: "POST",
    headers: { prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      event_key: eventKey,
      event_type: eventType,
      payment_reference: safeText(data.reference, 160) || null,
      payload: event,
      processing_status: "received"
    })
  });
  const isNewEvent = Array.isArray(eventRows) && eventRows.length === 1;

  try {
    if (eventType === "charge.success") {
      const reference = safeText(data.reference, 160);
      if (reference) {
        const payment = await verifyPaystack(reference, env);
        const { packageId, packageInfo } = getPackageFromPayment(payment);
        // Ignore successful transactions that do not belong to a FTRIVA package.
        if (packageInfo) {
          verifyAmountAndCurrency(payment, packageId, packageInfo);
          await savePurchase(payment, packageId, env);
          if (isNewEvent && packageInfo.type !== "monthly") await sendSignupNotification(env, "paid programme");
        }
      }
    } else if (eventType === "subscription.create") {
      const planCode = safeText(data.plan?.plan_code || data.plan_code, 160);
      const packageId = membershipPackageForPlan(planCode, env);
      const email = safeText(data.customer?.email || data.email, 254).toLowerCase();
      if (packageId && validEmail(email) && subscriptionCode) {
        const packageInfo = PACKAGES[packageId];
        await supabaseRequest("/rest/v1/ftriva_memberships?on_conflict=paystack_subscription_code", env, {
          method: "POST",
          headers: { prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({
            customer_email: email,
            package_id: packageId,
            paystack_customer_code: safeText(data.customer?.customer_code, 160) || null,
            paystack_subscription_code: subscriptionCode,
            paystack_email_token: safeText(data.email_token, 300) || null,
            paystack_plan_code: planCode,
            amount: Number(data.amount || data.plan?.amount || packageInfo.amount),
            currency: "ZAR",
            status: "active",
            start_date: data.createdAt || new Date().toISOString(),
            next_payment_date: data.next_payment_date || null,
            raw_paystack_data: data
          })
        });
        if (isNewEvent) await sendSignupNotification(env, "new monthly membership");
      }
    } else if (["subscription.disable", "subscription.not_renew", "invoice.payment_failed"].includes(eventType) && subscriptionCode) {
      const nextStatus = eventType === "subscription.disable" ? "cancelled" : eventType === "subscription.not_renew" ? "non_renewing" : "attention";
      await supabaseRequest(
        `/rest/v1/ftriva_memberships?paystack_subscription_code=eq.${encodeURIComponent(subscriptionCode)}`,
        env,
        {
          method: "PATCH",
          headers: { prefer: "return=minimal" },
          body: JSON.stringify({ status: nextStatus, raw_paystack_data: data, ...(nextStatus === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}) })
        }
      );
    }

    await supabaseRequest(`/rest/v1/ftriva_paystack_events?event_key=eq.${eventKey}`, env, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ processing_status: "processed", processed_at: new Date().toISOString() })
    });
    return json({ received: true });
  } catch (error) {
    await supabaseRequest(`/rest/v1/ftriva_paystack_events?event_key=eq.${eventKey}`, env, {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ processing_status: "failed", processing_error: error.message })
    }).catch(() => {});
    return json({ received: false, error: "Webhook could not be processed." }, 500);
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method === "POST" && url.pathname === "/api/paystack/webhook") return handlePaystackWebhook(request, env);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({
      ok: true,
      service: "FTRIVA Worker",
      environment: env.ENVIRONMENT || "test",
      supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      paystackConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
      timestamp: new Date().toISOString()
    });
  }

  if (request.method === "POST" && url.pathname === "/api/payment/initialize") return handlePaymentInitialize(request, env);
  if (request.method === "POST" && url.pathname === "/api/payment/verify") return handlePaymentVerify(request, env);
  if (request.method === "POST" && url.pathname === "/api/payment/recover") return handlePaymentRecover(request, env);
  if (request.method === "POST" && url.pathname === "/api/founding10/claim") return handleFounding10Claim(request, env);
  if (request.method === "POST" && url.pathname === "/api/assessment/submit") return handleAssessmentSubmit(request, env);

  return json({ error: "API route not found." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        const response = await handleApi(request, env);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      } catch (error) {
        const response = json({ error: error.message || "Unexpected server error." }, 500);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
        return new Response(response.body, { status: response.status, headers });
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("FTRIVA assets binding is missing. Check wrangler.jsonc.", { status: 500 });
  }
};
