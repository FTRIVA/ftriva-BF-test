const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const corsHeaders = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" };
const allowedPackages = {
  once_off: { name: "Once-off programme", amount: 29900, currency: "ZAR", type: "once_off" },
  monthly: { name: "Monthly membership", amount: 24900, currency: "ZAR", type: "monthly" }
};

function safeText(value, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}
async function paystackRequest(path, secret, body) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.status) throw new Error(data.message || `Paystack request failed (${response.status})`);
  return data.data;
}
async function verifyPaystack(reference, env) {
  const secret = env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured in this Worker.");
  const data = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, secret);
  if (data.status !== "success") throw new Error("Payment has not been verified as successful.");
  return data;
}
async function supabaseInsert(table, record, env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { saved: false, reason: "Supabase environment variables are not configured." };
  const safeTable = /^[a-zA-Z0-9_]+$/.test(table || "") ? table : "";
  if (!safeTable) return { saved: false, reason: "The configured Supabase table name is invalid." };
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${safeTable}`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify(record)
  });
  if (!response.ok) {
    const detail = await response.text();
    return { saved: false, reason: `Supabase rejected the insert (${response.status}). Check that the configured table and columns match the record.`, detail: detail.slice(0, 500) };
  }
  return { saved: true };
}
async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method === "GET" && url.pathname === "/api/health") {
    return json({ ok: true, service: "FTRIVA Worker", environment: env.ENVIRONMENT || "test", timestamp: new Date().toISOString() });
  }
  if (request.method === "POST" && url.pathname === "/api/payment/initialize") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Please submit valid form data." }, 400); }
    const packageInfo = allowedPackages[body.package];
    const email = safeText(body.email, 254).toLowerCase();
    const fullName = safeText(body.fullName, 120);
    const phone = safeText(body.phone, 40);
    if (!packageInfo || !validEmail(email) || !fullName) return json({ error: "Please provide your name, a valid email address and a valid package." }, 400);
    if (!env.PAYSTACK_SECRET_KEY) return json({ error: "Payment setup is incomplete: add PAYSTACK_SECRET_KEY under this Worker’s Settings → Variables and Secrets." }, 503);
    const payload = {
      email,
      currency: "ZAR",
      amount: packageInfo.amount,
      callback_url: `${url.origin}/payment-callback.html`,
      metadata: {
        custom_fields: [
          { display_name: "Customer name", variable_name: "customer_name", value: fullName },
          { display_name: "Phone", variable_name: "phone", value: phone },
          { display_name: "FTRIVA package", variable_name: "ftriva_package", value: packageInfo.type }
        ],
        ftriva_package: packageInfo.type,
        customer_name: fullName,
        phone,
        environment: env.ENVIRONMENT || "test"
      }
    };
    if (packageInfo.type === "monthly") {
      if (!env.PAYSTACK_MONTHLY_PLAN_CODE) return json({ error: "Monthly membership checkout is not configured yet. Add a Paystack monthly plan code as PAYSTACK_MONTHLY_PLAN_CODE. No payment has been taken." }, 503);
      payload.plan = env.PAYSTACK_MONTHLY_PLAN_CODE;
      delete payload.amount;
    }
    try {
      const data = await paystackRequest("/transaction/initialize", env.PAYSTACK_SECRET_KEY, payload);
      return json({ authorizationUrl: data.authorization_url, reference: data.reference, accessCode: data.access_code, package: packageInfo.type });
    } catch (error) { return json({ error: error.message || "Unable to start payment." }, 502); }
  }
  if (request.method === "POST" && url.pathname === "/api/payment/verify") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
    const reference = safeText(body.reference, 120);
    if (!reference) return json({ error: "Payment reference is required." }, 400);
    try {
      const payment = await verifyPaystack(reference, env);
      const meta = payment.metadata || {};
      const expectedPackage = safeText(meta.ftriva_package, 30);
      const expectedAmount = expectedPackage === "monthly" ? 24900 : expectedPackage === "once_off" ? 29900 : null;
      if (!expectedAmount || Number(payment.amount) < expectedAmount) return json({ error: "The verified transaction does not match a recognised FTRIVA package amount." }, 400);
      return json({ verified: true, reference: payment.reference, amount: payment.amount, currency: payment.currency, package: expectedPackage, customer: payment.customer?.email || "" });
    } catch (error) { return json({ verified: false, error: error.message || "Payment verification failed." }, 400); }
  }
  if (request.method === "POST" && url.pathname === "/api/assessment/submit") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid assessment submission." }, 400); }
    const reference = safeText(body.paymentReference, 120);
    if (!reference) return json({ error: "A verified payment reference is required before submitting the assessment." }, 403);
    let payment;
    try { payment = await verifyPaystack(reference, env); } catch (error) { return json({ error: `Payment verification failed: ${error.message}` }, 403); }
    const meta = payment.metadata || {};
    if (!["once_off", "monthly"].includes(meta.ftriva_package)) return json({ error: "This payment is not associated with a FTRIVA package." }, 403);
    const assessment = body.assessment;
    if (!assessment || typeof assessment !== "object") return json({ error: "Assessment data is missing." }, 400);
    const record = {
      payment_reference: payment.reference,
      package_type: meta.ftriva_package,
      customer_email: payment.customer?.email || safeText(assessment.personal?.email, 254),
      assessment_data: assessment,
      requested_start_date: safeText(assessment.startDate, 20) || null,
      status: "assessment_submitted",
      submitted_at: new Date().toISOString()
    };
    const result = await supabaseInsert(env.SUPABASE_ASSESSMENTS_TABLE || "ftriva_assessments", record, env);
    if (!result.saved) return json({ error: "Your payment is verified, but the assessment could not be saved to Supabase.", detail: result.reason, technicalDetail: result.detail || null, paymentVerified: true }, 503);
    return json({ submitted: true, message: "Your assessment has been submitted successfully.", status: "assessment_submitted" });
  }
  return json({ error: "API route not found." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const response = await handleApi(request, env);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
      return new Response(response.body, { status: response.status, headers });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("FTRIVA assets binding is missing. Check wrangler.jsonc.", { status: 500 });
  }
};
