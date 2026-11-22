/**
 * FTRIVA WEBSITE CLOUDFLARE WORKER
 * Uses the separate FTRIVA Website Supabase project.
 * Secrets: PAYSTACK_SECRET_KEY, SUPABASE_SECRET_KEY (legacy SUPABASE_SERVICE_ROLE_KEY also supported)
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

function validateAssessmentPayload(assessment) {
  const personal = assessment?.personal || {};
  const goals = assessment?.goals || {};
  const training = assessment?.trainingHistory || {};
  const activity = assessment?.currentActivity || {};
  const health = assessment?.health || {};
  const equipment = assessment?.equipment || {};
  const schedule = assessment?.schedule || {};
  const consents = assessment?.consents || {};

  const required = [
    personal.fullName, personal.dateOfBirth, personal.email, personal.phone,
    personal.country, personal.communication, personal.under18,
    goals.primary, training.structured, training.experience,
    activity.activityLevel, health.injuryOrPain, health.warningSymptoms,
    equipment.environment, schedule.sessions, schedule.duration,
    assessment.startDatePreference, assessment.startDate
  ];
  if (required.some(value => !safeText(String(value ?? ""), 500))) {
    throw new Error("Please complete all required assessment fields.");
  }
  if (!validEmail(safeText(personal.email, 254))) {
    throw new Error("Please provide a valid assessment email address.");
  }
  if (!safeText(personal.fullName, 120) || safeText(personal.phone, 40).length < 7) {
    throw new Error("Please provide your full name and a valid phone number.");
  }

  const dob = safeText(personal.dateOfBirth, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    throw new Error("Please provide a valid date of birth.");
  }
  const dobDate = new Date(dob + "T00:00:00.000Z");
  if (Number.isNaN(dobDate.getTime()) || dobDate.toISOString().slice(0, 10) !== dob) {
    throw new Error("Please provide a valid date of birth.");
  }

  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const part = type => todayParts.find(item => item.type === type)?.value || "";
  const today = part("year") + "-" + part("month") + "-" + part("day");
  if (dob > today) throw new Error("Date of birth cannot be in the future.");

  let age = Number(part("year")) - Number(dob.slice(0, 4));
  const birthMonth = Number(dob.slice(5, 7));
  const birthDay = Number(dob.slice(8, 10));
  if (Number(part("month")) < birthMonth || (Number(part("month")) === birthMonth && Number(part("day")) < birthDay)) age--;

  const isMinor = age < 18;
  if (!["yes", "no"].includes(personal.under18) || (personal.under18 === "yes") !== isMinor) {
    throw new Error("The under-18 answer must match the date of birth provided.");
  }

  const consentGiven = value => value === "yes" || value === true;
  if (!consentGiven(consents.accurate) || !consentGiven(consents.privacy) || !consentGiven(consents.onlineScope)) {
    throw new Error("Please confirm the accuracy, privacy and online-service consent statements before submitting.");
  }

  if (isMinor) {
    if (
      !safeText(personal.guardianName, 120) ||
      !validEmail(safeText(personal.guardianEmail, 254)) ||
      personal.guardianConsent !== true ||
      !consentGiven(consents.guardian)
    ) {
      throw new Error("For a client under 18, parent/guardian details and consent are required.");
    }
  }

  const startPreference = safeText(assessment.startDatePreference, 40);
  if (startPreference === "specific_date") {
    const requestedDate = safeText(assessment.startDate, 10);
    const requestedDateValue = new Date(requestedDate + "T00:00:00.000Z");
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ||
      Number.isNaN(requestedDateValue.getTime()) ||
      requestedDateValue.toISOString().slice(0, 10) !== requestedDate ||
      requestedDate < today
    ) {
      throw new Error("Please choose a valid programme start date that is today or later.");
    }
  } else if (!["as_soon_as_available", "within_7_days", "within_14_days", "within_30_days"].includes(startPreference)) {
    throw new Error("Please choose a valid programme start preference.");
  }

  const requiresManualReview =
    String(health.warningSymptoms).toLowerCase() !== "no" ||
    String(health.injuryOrPain).toLowerCase() === "yes" ||
    Boolean(safeText(health.restrictions, 1200));

  return { isMinor, requiresManualReview };
}

function getSupabaseConfig(env) {
  const url = safeText(env.SUPABASE_URL, 300).replace(/\/+$/, "");
  const key = safeText(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY, 1000);
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and the Supabase secret key as SUPABASE_SECRET_KEY in Cloudflare Worker Secrets.");
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
  // Legacy Supabase service_role JWTs must also be supplied as the database
  // Authorization token. New sb_secret_ keys are API keys and are not JWTs.
  if (!key.startsWith("sb_secret_") && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${key}`);
  }
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
  if (!Number.isFinite(actualAmount) || actualAmount !== packageInfo.amount) {
    throw new Error("The verified transaction amount does not match the current price for this FTRIVA package.");
  }
}

async function syncMembershipFromVerifiedPayment(payment, packageId, env) {
  const packageInfo = PACKAGES[packageId];
  if (!packageInfo || packageInfo.type !== "monthly") return null;

  const customerId = safeText(String(payment.customer?.id || ""), 40);
  const customerEmail = safeText(payment.customer?.email, 254).toLowerCase();
  const planCode = safeText(
    payment.plan_object?.plan_code ||
    payment.plan?.plan_code ||
    (typeof payment.plan === "string" ? payment.plan : "") ||
    env[packageInfo.planEnv],
    160
  );
  if (!customerId || !validEmail(customerEmail) || !planCode) {
    throw new Error("The verified monthly payment does not contain enough Paystack customer and plan details to reconcile its subscription.");
  }
  if (planCode !== safeText(env[packageInfo.planEnv], 160)) {
    throw new Error("The verified monthly payment plan does not match the configured FTRIVA membership plan.");
  }

  const expectedDomain = (env.ENVIRONMENT || "test").toLowerCase() === "production" ? "live" : "test";
  const paymentTime = Date.parse(payment.paid_at || payment.paidAt || payment.created_at || payment.createdAt || "");
  const eventSubscriptionCode = safeText(payment.subscription_code || payment.subscription?.subscription_code, 160);
  let subscription = null;
  let subscriptionLookupError = null;

  // Prefer a newly-created subscription associated with this initial payment.
  // Paystack does not create a new subscription record for every recurring charge.
  try {
    // Paystack's subscription list can be filtered by customer. Filter the
    // returned records by plan_code locally; do not require a plan numeric ID
    // to be present on the transaction verification response.
    const query = new URLSearchParams({ customer: customerId, perPage: "100", page: "1" });
    const subscriptions = await paystackRequest(`/subscription?${query.toString()}`, env.PAYSTACK_SECRET_KEY);
    const matches = (Array.isArray(subscriptions) ? subscriptions : []).filter(candidate => {
      const email = safeText(candidate.customer?.email, 254).toLowerCase();
      const candidatePlan = safeText(candidate.plan?.plan_code, 160);
      const domain = safeText(candidate.domain, 20).toLowerCase();
      const createdAt = Date.parse(candidate.createdAt || "");
      return email === customerEmail &&
        candidatePlan === planCode &&
        domain === expectedDomain &&
        safeText(candidate.status, 40).toLowerCase() === "active" &&
        Number.isFinite(paymentTime) &&
        Number.isFinite(createdAt) &&
        Math.abs(createdAt - paymentTime) <= 36 * 60 * 60 * 1000;
    }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    subscription = matches[0] || null;
  } catch (error) {
    subscriptionLookupError = error;
  }

  // For renewals, reuse the already-verified membership record instead of
  // incorrectly requiring the original subscription creation date to be recent.
  if (!subscription) {
    const existingRows = await supabaseRequest(
      `/rest/v1/ftriva_memberships?customer_email=eq.${encodeURIComponent(customerEmail)}&package_id=eq.${encodeURIComponent(packageId)}&status=in.(active,non_renewing,attention,past_due)&select=paystack_subscription_code,status&order=created_at.desc&limit=10`,
      env
    );
    const usableRows = Array.isArray(existingRows)
      ? existingRows.filter(row => safeText(row.paystack_subscription_code, 160))
      : [];
    let existing = null;
    if (eventSubscriptionCode) {
      existing = usableRows.find(row => row.paystack_subscription_code === eventSubscriptionCode) || null;
    }
    if (!existing && usableRows.length === 1) existing = usableRows[0];
    if (!existing && usableRows.length > 1) {
      throw new Error("More than one active FTRIVA membership matches this customer and plan. The payment was recorded, but subscription reconciliation needs manual review.");
    }
    if (!existing) {
      if (subscriptionLookupError) throw subscriptionLookupError;
      throw new Error("Paystack has verified the membership payment, but its matching active subscription is not available yet. The webhook can retry safely; do not pay again.");
    }

    await supabaseRequest(
      `/rest/v1/ftriva_purchases?payment_reference=eq.${encodeURIComponent(payment.reference)}`,
      env,
      {
        method: "PATCH",
        headers: { prefer: "return=minimal" },
        body: JSON.stringify({ paystack_subscription_code: existing.paystack_subscription_code })
      }
    );
    return existing.paystack_subscription_code;
  }

  const subscriptionCode = safeText(subscription.subscription_code, 160);
  if (!subscriptionCode) {
    throw new Error("Paystack returned a matching subscription without a subscription code.");
  }

  await supabaseRequest("/rest/v1/ftriva_memberships?on_conflict=paystack_subscription_code", env, {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      customer_email: customerEmail,
      package_id: packageId,
      paystack_customer_code: safeText(subscription.customer?.customer_code, 160) || safeText(payment.customer?.customer_code, 160) || null,
      paystack_subscription_code: subscriptionCode,
      paystack_email_token: safeText(subscription.email_token, 300) || null,
      paystack_plan_code: planCode,
      amount: Number(subscription.amount || subscription.plan?.amount || packageInfo.amount),
      currency: safeText(subscription.plan?.currency, 8) || "ZAR",
      status: safeText(subscription.status, 40).toLowerCase(),
      start_date: subscription.createdAt || new Date().toISOString(),
      next_payment_date: subscription.next_payment_date || null,
      raw_paystack_data: subscription
    })
  });

  // Keep every successful monthly payment linked to the recurring subscription.
  await supabaseRequest(
    `/rest/v1/ftriva_purchases?payment_reference=eq.${encodeURIComponent(payment.reference)}`,
    env,
    {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ paystack_subscription_code: subscriptionCode })
    }
  );
  return subscriptionCode;
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

async function savePaidAssessment(payment, packageId, assessment, env, assessmentValidation) {
  const assessmentEmail = safeText(assessment?.personal?.email, 254).toLowerCase();
  const paymentEmail = safeText(payment.customer?.email, 254).toLowerCase();
  if (!validEmail(assessmentEmail)) {
    throw new Error("A valid email address is required in the assessment.");
  }
  if (paymentEmail && assessmentEmail !== paymentEmail) {
    throw new Error("The assessment email must match the email address used for the verified Paystack payment.");
  }
  const customerEmail = paymentEmail || assessmentEmail;

  const record = {
    payment_reference: payment.reference,
    package_type: packageId,
    customer_email: customerEmail,
    assessment_data: assessment,
    requested_start_date: safeText(assessment.startDate, 40) || null,
    status: assessmentValidation?.requiresManualReview ? "under_review" : "assessment_submitted",
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



// DIGITAL downloads are time-limited bearer links issued only after Paystack
// verifies a DIGITAL payment. Each download re-checks the purchase record and
// streams from a private Supabase Storage bucket (never a public object URL).
function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\\+/g, "-").replace(/\\//g, "_");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function digitalTokenKey(env) {
  const { key } = getSupabaseConfig(env);
  const material = new TextEncoder().encode(`FTRIVA:DIGITAL:DOWNLOAD:v1:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function createDigitalDownloadLinks(reference, requestUrl, env) {
  const payload = {
    r: safeText(reference, 120),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    v: 1
  };
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await digitalTokenKey(env), new TextEncoder().encode(encodedPayload));
  const token = `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
  const origin = new URL(requestUrl).origin;
  const makeUrl = file => {
    const url = new URL("/api/digital/download", origin);
    url.searchParams.set("file", file);
    url.searchParams.set("token", token);
    return url.toString();
  };
  return {
    toolkit: makeUrl("toolkit"),
    tracker: makeUrl("tracker"),
    expiresAt: new Date(payload.exp * 1000).toISOString()
  };
}

async function verifyDigitalDownloadToken(token, env) {
  if (!token || token.length > 4000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const payloadBytes = base64UrlDecode(parts[0]);
    const signature = base64UrlDecode(parts[1]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      await digitalTokenKey(env),
      signature,
      new TextEncoder().encode(parts[0])
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (payload?.v !== 1 || !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!safeText(payload.r, 120)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function handleDigitalDownload(request, env) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file");
  const token = safeText(url.searchParams.get("token"), 4000);
  const files = {
    toolkit: {
      name: "FTRIVA_DIGITAL_Training_Toolkit.pdf",
      type: "application/pdf"
    },
    tracker: {
      name: "FTRIVA_DIGITAL_Workout_Tracker.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  };
  if (!files[file]) return json({ error: "This digital download is not available." }, 404);

  const claims = await verifyDigitalDownloadToken(token, env);
  if (!claims) return json({ error: "This download link is invalid or has expired. Return to your payment confirmation or contact FTRIVA." }, 401);

  try {
    const reference = encodeURIComponent(claims.r);
    const purchases = await supabaseRequest(
      `/rest/v1/ftriva_purchases?select=payment_reference&payment_reference=eq.${reference}&package_id=eq.DIGITAL&payment_status=eq.success&amount=eq.4900&currency=eq.ZAR&limit=1`,
      env
    );
    if (!Array.isArray(purchases) || purchases.length !== 1) {
      return json({ error: "We could not confirm an active DIGITAL purchase for this link. Please contact FTRIVA." }, 403);
    }

    const { url: supabaseUrl, key } = getSupabaseConfig(env);
    const headers = new Headers({ apikey: key });
    if (!key.startsWith("sb_secret_")) headers.set("authorization", `Bearer ${key}`);
    const objectUrl = `${supabaseUrl}/storage/v1/object/authenticated/ftriva-digital-test/${encodeURIComponent(files[file].name)}`;
    const storedFile = await fetch(objectUrl, { headers });
    if (!storedFile.ok) {
      console.error("FTRIVA digital asset unavailable:", storedFile.status);
      return json({ error: "Your payment is verified, but this file is temporarily unavailable. Please contact FTRIVA; do not pay again." }, 503);
    }

    return new Response(storedFile.body, {
      status: 200,
      headers: {
        "content-type": files[file].type,
        "content-disposition": `attachment; filename="${files[file].name}"`,
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox"
      }
    });
  } catch (error) {
    console.error("FTRIVA digital download failed:", error?.message || "Unknown error");
    return json({ error: "Your download could not be prepared. Please contact FTRIVA; do not pay again." }, 503);
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

    if (packageInfo.type === "monthly") {
      try {
        await syncMembershipFromVerifiedPayment(payment, packageId, env);
      } catch (error) {
        return json({
          verified: true,
          recorded: true,
          membershipRecorded: false,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          package: packageId,
          error: "Your payment and purchase are recorded, but membership activation is still being reconciled. Do not pay again. FTRIVA will contact you if anything further is needed."
        }, 202);
      }
    }

    let digitalDownloads;
    if (packageId === "DIGITAL") {
      try {
        digitalDownloads = await createDigitalDownloadLinks(payment.reference, request.url, env);
      } catch (error) {
        console.error("FTRIVA digital link creation failed:", error?.message || "Unknown error");
        return json({
          verified: true,
          recorded: true,
          digitalDeliveryReady: false,
          reference: payment.reference,
          amount: payment.amount,
          currency: payment.currency,
          package: packageId,
          error: "Your payment is verified and recorded, but download links could not be prepared. Do not pay again; contact FTRIVA."
        }, 202);
      }
    }

    return json({
      verified: true,
      recorded: true,
      ...(packageInfo.type === "monthly" ? { membershipRecorded: true } : {}),
      ...(packageId === "DIGITAL" ? { digitalDeliveryReady: true, digitalDownloads } : {}),
      reference: payment.reference,
      amount: payment.amount,
      currency: payment.currency,
      package: packageId,
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

  let assessmentValidation;
  try {
    assessmentValidation = validateAssessmentPayload(assessment);
  } catch (error) {
    return json({ error: error.message || "The assessment is incomplete." }, 400);
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

  let paymentVerified = false;
  try {
    const payment = await verifyPaystack(reference, env);
    paymentVerified = true;
    const { packageId, packageInfo } = getPackageFromPayment(payment);
    if (!packageInfo || !packageInfo.assessmentRequired) {
      return json({ error: "This purchase does not require a personalised fitness assessment." }, 403);
    }
    verifyAmountAndCurrency(payment, packageId, packageInfo);

    // Ensure a verified purchase exists before inserting the assessment because
    // the assessments table references ftriva_purchases.payment_reference.
    await savePurchase(payment, packageId, env);
    await savePaidAssessment(payment, packageId, assessment, env, assessmentValidation);
    return json({ submitted: true, message: "Your assessment has been submitted successfully." });
  } catch (error) {
    return json({
      error: paymentVerified
        ? "Your payment is verified, but the assessment could not be saved. Do not pay again; contact FTRIVA."
        : "We could not verify this payment, so the assessment was not submitted.",
      detail: error.message,
      paymentVerified
    }, error.status || (paymentVerified ? 503 : 400));
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
          if (packageInfo.type === "monthly") {
            await syncMembershipFromVerifiedPayment(payment, packageId, env);
          } else if (isNewEvent) {
            await sendSignupNotification(env, "paid programme");
          }
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
      supabaseConfigured: Boolean(env.SUPABASE_URL && (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY)),
      paystackConfigured: Boolean(env.PAYSTACK_SECRET_KEY),
      timestamp: new Date().toISOString()
    });
  }

  if (request.method === "GET" && url.pathname === "/api/digital/download") return handleDigitalDownload(request, env);
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

    // Single website-to-app destination. Set FTRIVA_APP_URL when the web app is deployed.
    if (request.method === "GET" && url.pathname === "/my-account") {
      const appUrl = safeText(env.FTRIVA_APP_URL, 500);
      if (appUrl) {
        try {
          const destination = new URL(appUrl);
          if (destination.protocol === "https:") {
            return Response.redirect(destination.toString(), 302);
          }
        } catch {
          // Fall through to the unavailable page rather than redirecting to an unsafe URL.
        }
      }
      return new Response(
        "<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>FTRIVA Account</title><body style='margin:0;background:#101d2b;color:#f5f1e8;font:16px Arial,sans-serif;display:grid;min-height:100vh;place-items:center;text-align:center'><main style='max-width:520px;padding:32px'><h1 style='letter-spacing:.12em'>FTRIVA</h1><h2>Your account portal is being prepared.</h2><p>Once your FTRIVA web app is ready, you will be able to sign in here using the email address from your purchase.</p><a style='color:#a8b8a0' href='/'>Return to FTRIVA</a></main></body></html>",
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
      );
    }

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
