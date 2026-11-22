var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
var CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-paystack-signature"
};
var PACKAGES = {
  START: { name: "START", amount: 19900, type: "once_off", assessmentRequired: true },
  PROGRESS: { name: "PROGRESS", amount: 39900, type: "once_off", assessmentRequired: true },
  PERFORMANCE: { name: "PERFORMANCE", amount: 29900, type: "once_off", assessmentRequired: true },
  DIGITAL: { name: "DIGITAL", amount: 4900, type: "digital", assessmentRequired: false },
  ESSENTIAL: { name: "ESSENTIAL", amount: 24900, type: "monthly", planEnv: "PAYSTACK_PLAN_ESSENTIAL" },
  PLUS: { name: "PLUS", amount: 39900, type: "monthly", planEnv: "PAYSTACK_PLAN_PLUS" },
  ELITE: { name: "ELITE", amount: 59900, type: "monthly", planEnv: "PAYSTACK_PLAN_ELITE" }
};
var FOUNDING10_PACKAGES = /* @__PURE__ */ new Set(["START", "PROGRESS", "PERFORMANCE", "DIGITAL"]);
function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}
__name(json, "json");
function safeText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
__name(safeText, "safeText");
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}
__name(validEmail, "validEmail");
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
    personal.fullName,
    personal.dateOfBirth,
    personal.email,
    personal.phone,
    personal.country,
    personal.communication,
    personal.under18,
    goals.primary,
    training.structured,
    training.experience,
    activity.activityLevel,
    health.injuryOrPain,
    health.warningSymptoms,
    equipment.environment,
    schedule.sessions,
    schedule.duration,
    assessment.startDatePreference,
    assessment.startDate
  ];
  if (required.some((value) => !safeText(String(value ?? ""), 500))) {
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
  const dobDate = /* @__PURE__ */ new Date(dob + "T00:00:00.000Z");
  if (Number.isNaN(dobDate.getTime()) || dobDate.toISOString().slice(0, 10) !== dob) {
    throw new Error("Please provide a valid date of birth.");
  }
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(/* @__PURE__ */ new Date());
  const part = /* @__PURE__ */ __name((type) => todayParts.find((item) => item.type === type)?.value || "", "part");
  const today = part("year") + "-" + part("month") + "-" + part("day");
  if (dob > today) throw new Error("Date of birth cannot be in the future.");
  let age = Number(part("year")) - Number(dob.slice(0, 4));
  const birthMonth = Number(dob.slice(5, 7));
  const birthDay = Number(dob.slice(8, 10));
  if (Number(part("month")) < birthMonth || Number(part("month")) === birthMonth && Number(part("day")) < birthDay) age--;
  const isMinor = age < 18;
  if (!["yes", "no"].includes(personal.under18) || personal.under18 === "yes" !== isMinor) {
    throw new Error("The under-18 answer must match the date of birth provided.");
  }
  const consentGiven = /* @__PURE__ */ __name((value) => value === "yes" || value === true, "consentGiven");
  if (!consentGiven(consents.accurate) || !consentGiven(consents.privacy) || !consentGiven(consents.onlineScope)) {
    throw new Error("Please confirm the accuracy, privacy and online-service consent statements before submitting.");
  }
  if (isMinor) {
    if (!safeText(personal.guardianName, 120) || !validEmail(safeText(personal.guardianEmail, 254)) || personal.guardianConsent !== true || !consentGiven(consents.guardian)) {
      throw new Error("For a client under 18, parent/guardian details and consent are required.");
    }
  }
  const startPreference = safeText(assessment.startDatePreference, 40);
  if (startPreference === "specific_date") {
    const requestedDate = safeText(assessment.startDate, 10);
    const requestedDateValue = /* @__PURE__ */ new Date(requestedDate + "T00:00:00.000Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || Number.isNaN(requestedDateValue.getTime()) || requestedDateValue.toISOString().slice(0, 10) !== requestedDate || requestedDate < today) {
      throw new Error("Please choose a valid programme start date that is today or later.");
    }
  } else if (!["as_soon_as_available", "within_7_days", "within_14_days", "within_30_days"].includes(startPreference)) {
    throw new Error("Please choose a valid programme start preference.");
  }
  const requiresManualReview = String(health.warningSymptoms).toLowerCase() !== "no" || String(health.injuryOrPain).toLowerCase() === "yes" || Boolean(safeText(health.restrictions, 1200));
  return { isMinor, requiresManualReview };
}
__name(validateAssessmentPayload, "validateAssessmentPayload");
function getSupabaseConfig(env) {
  const url = safeText(env.SUPABASE_URL, 300).replace(/\/+$/, "");
  const key = safeText(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY, 1e3);
  if (!url || !key) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and the Supabase secret key as SUPABASE_SECRET_KEY in Cloudflare Worker Secrets.");
  }
  return { url, key };
}
__name(getSupabaseConfig, "getSupabaseConfig");
async function supabaseRequest(path, env, options = {}) {
  const { url, key } = getSupabaseConfig(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  if (!key.startsWith("sb_secret_") && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${key}`);
  }
  if (!headers.has("content-type") && options.body !== void 0) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers
  });
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Supabase request failed (${response.status}): ${(detail || "Unknown error").slice(0, 500)}`);
  }
  return data;
}
__name(supabaseRequest, "supabaseRequest");
async function sendSignupNotification(env, signupType, idempotencyKey) {
  const key = safeText(idempotencyKey, 180);
  if (!key) return;
  const textBody = "A new FTRIVA " + safeText(signupType, 100) + " has been recorded. Sign in to the FTRIVA website admin to review it. No customer personal or assessment information is included in this email.";
  const htmlBody = "<div style='font-family:Arial,sans-serif;color:#101D2B'><h2>New FTRIVA sign-up</h2><p>A new FTRIVA " + emailEscape(signupType) + " has been recorded.</p><p>Sign in to the FTRIVA website admin to review it.</p><p>No customer personal or assessment information is included in this email.</p></div>";
  await sendFtrivaEmailOnce(env, "ftriva:signup:" + key, "signup_internal", "ftrivafitness@gmail.com", "New FTRIVA sign-up", textBody, htmlBody, { signup_type: safeText(signupType, 100) });
}


function emailEscape(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function sendFtrivaEmailOnce(env,key,template,recipient,subject,textBody,htmlBody,payload){
 try{
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?on_conflict=idempotency_key",env,{method:"POST",headers:{prefer:"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({customer_email:recipient,template_key:template,idempotency_key:key,payload,delivery_status:"pending"})});
  const rows=await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?idempotency_key=eq."+encodeURIComponent(key)+"&select=id,delivery_status,attempts&limit=1",env);
  const row=Array.isArray(rows)?rows[0]:null;if(!row||row.delivery_status==="sent"||row.delivery_status==="cancelled")return;
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(row.id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({attempts:Number(row.attempts||0)+1,delivery_status:"pending",last_error:null,updated_at:new Date().toISOString()})});
  if(!env.RESEND_API_KEY)throw new Error("RESEND_API_KEY is not configured on the TEST Worker.");
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:"Bearer "+env.RESEND_API_KEY,"content-type":"application/json","Idempotency-Key":key},body:JSON.stringify({from:"FTRIVA <notifications@notify.ftriva.com>",to:[recipient],subject,text:textBody,html:htmlBody})});
  const body=await response.text();if(!response.ok)throw new Error("Resend rejected email ("+response.status+"): "+body.slice(0,400));
  await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(row.id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({delivery_status:"sent",sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()})});
 }catch(error){
  console.error("FTRIVA transactional email failed:",template,error?.message||"Unknown email error");
  try{const rows=await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?idempotency_key=eq."+encodeURIComponent(key)+"&select=id&limit=1",env);if(Array.isArray(rows)&&rows[0])await supabaseRequest("/rest/v1/ftriva_customer_email_outbox?id=eq."+encodeURIComponent(rows[0].id),env,{method:"PATCH",headers:{prefer:"return=minimal"},body:JSON.stringify({delivery_status:"failed",last_error:String(error?.message||"Email delivery failed").slice(0,500),updated_at:new Date().toISOString()})})}catch(e){console.error("FTRIVA outbox update failed:",e?.message||"Unknown error")}
 }
}
async function sendFtrivaPurchaseEmails(env,payment,packageId,packageInfo,subscriptionCode=null){
 const email=safeText(payment.customer?.email,254).toLowerCase();if(!validEmail(email))return;
 const membership=packageInfo.type==="monthly";const needsAssessment=!membership&&packageInfo.assessmentRequired===true;const isDigital=packageId==="DIGITAL";
 const ref=safeText(membership?(subscriptionCode||payment.subscription_code||payment.subscription?.subscription_code||payment.reference):payment.reference,160);const key=ref||await sha256(email+":"+packageId);
 const name=safeText(payment.metadata?.customer_name||payment.metadata?.full_name,120)||"there";const amount=(Number(payment.amount||packageInfo.amount)/100).toFixed(2);const appUrl="https://app-test.ftriva.com";
 const subject=membership?"Your FTRIVA membership is active":needsAssessment?"Your FTRIVA purchase is confirmed":"Your FTRIVA DIGITAL resources are ready";
 const intro=membership?"Your FTRIVA "+packageId+" membership is active.":needsAssessment?"Your FTRIVA "+packageId+" purchase is confirmed.":"Your FTRIVA DIGITAL resources are ready.";
 const nextStep=needsAssessment?"Your personalised programme will appear in the app after you complete your assessment and FTRIVA has reviewed and prepared your plan. If you have not submitted your assessment yet, return to the FTRIVA website and complete it.":isDigital?"Your DIGITAL Training Toolkit and Workout Tracker are available in the Downloads section after you sign in.":"Your membership access is active in the app.";
 const textBody=["Hi "+name+",","",intro,"Amount: R"+amount,"",nextStep,"","Log in at "+appUrl+" using the same email address used at checkout. If you are new, create an account and confirm your email first.","","Add to Home Screen:","iPhone/iPad: Open this link in Safari, tap Share, then Add to Home Screen.","Android: Open in Chrome, tap the three-dot menu, then Add to Home screen or Install app.","","Need help? WhatsApp FTRIVA: +27 74 616 0421","","FIT. TRAIN. THRIVE.","FTRIVA"].join(String.fromCharCode(10));
 const heading=membership?"Your membership is active":needsAssessment?"Your purchase is confirmed":"Your DIGITAL resources are ready";
 const htmlBody="<div style='background:#F5F1E8;padding:28px;font-family:Arial,sans-serif;color:#101D2B'><div style='max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px'><div style='font-weight:900;letter-spacing:4px;font-size:22px'>FTRIVA</div><div style='color:#A8B8A0;font-size:11px;letter-spacing:2px;margin-top:4px'>FIT. TRAIN. THRIVE.</div><h1 style='font-size:25px;margin-top:28px'>"+heading+"</h1><p>Hi "+emailEscape(name)+",</p><p>"+emailEscape(intro)+"</p><p style='background:#F5F1E8;padding:14px;border-radius:8px'>Amount: <b>R"+amount+"</b></p><p>"+emailEscape(nextStep)+"</p><p><a href='"+appUrl+"' style='display:inline-block;background:#101D2B;color:white;padding:13px 18px;border-radius:8px;text-decoration:none;font-weight:bold'>Open your FTRIVA app</a></p><h3>Sign in</h3><p>Use the same email address used at checkout. If you are new, create an account and confirm your email first.</p><h3>Add to your Home Screen</h3><p><b>iPhone/iPad:</b> Open in Safari, tap Share, then Add to Home Screen.</p><p><b>Android:</b> Open in Chrome, tap the three-dot menu, then Add to Home screen or Install app.</p><p>Need help? WhatsApp <b>+27 74 616 0421</b>.</p><p style='color:#A8B8A0;font-weight:bold'>FIT. TRAIN. THRIVE.</p></div></div>";
 const payload={package:packageId,amount:Number(payment.amount||packageInfo.amount),currency:payment.currency||"ZAR",reference:ref,environment:"test"};
 await sendFtrivaEmailOnce(env,"ftriva:"+key+":customer",membership?"membership_activation_customer":"programme_purchase_customer",email,subject,textBody,htmlBody,payload);
 const internalSubject="FTRIVA "+(membership?"membership activated":"programme purchase confirmed")+" — "+packageId;
 const internalText=["A verified FTRIVA "+(membership?"membership activation":"programme purchase")+" has completed.","Package: "+packageId,"Amount: R"+amount,"Reference: "+ref,"Environment: TEST","The app entitlement sync completed before this notification was queued."].join(String.fromCharCode(10));
 const internalHtml="<div style='font-family:Arial,sans-serif;color:#101D2B'><h2>FTRIVA "+(membership?"membership activated":"purchase confirmed")+"</h2><p>Package: <b>"+emailEscape(packageId)+"</b></p><p>Amount: <b>R"+amount+"</b></p><p>Reference: "+emailEscape(ref)+"</p><p>Environment: TEST</p></div>";
 await sendFtrivaEmailOnce(env,"ftriva:"+key+":internal",membership?"membership_activation_internal":"programme_purchase_internal","ftrivafitness@gmail.com",internalSubject,internalText,internalHtml,payload);
}async function sendFtrivaMembershipEmails(env,email,packageId,subscriptionCode,data){const amount=Number(data.amount||data.plan?.amount||PACKAGES[packageId].amount);const payment={reference:subscriptionCode,subscription_code:subscriptionCode,amount,currency:"ZAR",customer:{email},metadata:{}};await sendFtrivaPurchaseEmails(env,payment,packageId,PACKAGES[packageId],subscriptionCode)}

async function paystackRequest(path, secret, body) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.status) {
    throw new Error(result.message || `Paystack request failed (${response.status}).`);
  }
  return result.data;
}
__name(paystackRequest, "paystackRequest");
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
__name(verifyPaystack, "verifyPaystack");
async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
function getPackageFromPayment(payment) {
  const packageId = safeText(payment?.metadata?.ftriva_package, 30).toUpperCase();
  return { packageId, packageInfo: PACKAGES[packageId] || null };
}
__name(getPackageFromPayment, "getPackageFromPayment");
function verifyAmountAndCurrency(payment, packageId, packageInfo) {
  if (!packageInfo) throw new Error("This transaction is not associated with a recognised FTRIVA package.");
  if (payment.currency !== "ZAR") throw new Error("The verified transaction currency does not match ZAR.");
  const actualAmount = Number(payment.amount);
  if (!Number.isFinite(actualAmount) || actualAmount !== packageInfo.amount) {
    throw new Error("The verified transaction amount does not match the current price for this FTRIVA package.");
  }
}
__name(verifyAmountAndCurrency, "verifyAmountAndCurrency");
async function syncMembershipFromVerifiedPayment(payment, packageId, env) {
  const packageInfo = PACKAGES[packageId];
  if (!packageInfo || packageInfo.type !== "monthly") return null;
  const customerId = safeText(String(payment.customer?.id || ""), 40);
  const customerEmail = safeText(payment.customer?.email, 254).toLowerCase();
  const planCode = safeText(
    payment.plan_object?.plan_code || payment.plan?.plan_code || (typeof payment.plan === "string" ? payment.plan : "") || env[packageInfo.planEnv],
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
  try {
    const query = new URLSearchParams({ customer: customerId, perPage: "100", page: "1" });
    const subscriptions = await paystackRequest(`/subscription?${query.toString()}`, env.PAYSTACK_SECRET_KEY);
    const matches = (Array.isArray(subscriptions) ? subscriptions : []).filter((candidate) => {
      const email = safeText(candidate.customer?.email, 254).toLowerCase();
      const candidatePlan = safeText(candidate.plan?.plan_code, 160);
      const domain = safeText(candidate.domain, 20).toLowerCase();
      const createdAt = Date.parse(candidate.createdAt || "");
      return email === customerEmail && candidatePlan === planCode && domain === expectedDomain && safeText(candidate.status, 40).toLowerCase() === "active" && Number.isFinite(paymentTime) && Number.isFinite(createdAt) && Math.abs(createdAt - paymentTime) <= 36 * 60 * 60 * 1e3;
    }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    subscription = matches[0] || null;
  } catch (error) {
    subscriptionLookupError = error;
  }
  if (!subscription) {
    const existingRows = await supabaseRequest(
      `/rest/v1/ftriva_memberships?customer_email=eq.${encodeURIComponent(customerEmail)}&package_id=eq.${encodeURIComponent(packageId)}&status=in.(active,non_renewing,attention,past_due)&select=paystack_subscription_code,status&order=created_at.desc&limit=10`,
      env
    );
    const usableRows = Array.isArray(existingRows) ? existingRows.filter((row) => safeText(row.paystack_subscription_code, 160)) : [];
    let existing = null;
    if (eventSubscriptionCode) {
      existing = usableRows.find((row) => row.paystack_subscription_code === eventSubscriptionCode) || null;
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
    await syncMemberAppMembership(env, existing.paystack_subscription_code);
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
      start_date: subscription.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      next_payment_date: subscription.next_payment_date || null,
      raw_paystack_data: subscription
    })
  });
  await supabaseRequest(
    `/rest/v1/ftriva_purchases?payment_reference=eq.${encodeURIComponent(payment.reference)}`,
    env,
    {
      method: "PATCH",
      headers: { prefer: "return=minimal" },
      body: JSON.stringify({ paystack_subscription_code: subscriptionCode })
    }
  );
  await syncMemberAppMembership(env, subscriptionCode);
  return subscriptionCode;
}
__name(syncMembershipFromVerifiedPayment, "syncMembershipFromVerifiedPayment");
async function syncMemberApp(env, payload) {
  i

--- TRUNCATED ---
Response was ~13,692 tokens (limit: 6,000). Use more specific queries to reduce response size.