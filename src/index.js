
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    try {
      if (path === "/api/health") {
        return json({ ok: true });
      }

      if (path === "/api/payment/recover" && request.method === "POST") {
        const body = await request.json();
        const reference = String(body.reference || "").trim();

        if (!reference) {
          return json({ error: "Payment reference is required." }, 400);
        }

        const result = await verifyPaystack(reference, env);

        if (!result.status || result.status !== "success") {
          return json({ error: "Payment has not been verified as successful." }, 402);
        }

        const packageId = String(
          result.metadata?.ftriva_package ||
          result.metadata?.package ||
          ""
        ).toUpperCase();

        const packages = {
          START: 19900,
          PROGRESS: 39900,
          PERFORMANCE: 29900,
          DIGITAL: 4900
        };

        if (!packages[packageId]) {
          return json({ error: "The package could not be confirmed." }, 400);
        }

        if (
          result.currency !== "ZAR" ||
          Number(result.amount) < packages[packageId]
        ) {
          return json({ error: "Payment amount or currency does not match." }, 400);
        }

        return json({
          verified: true,
          reference,
          package: packageId,
          amount: result.amount,
          currency: result.currency
        });
      }

      if (path === "/api/payment/verify" && request.method === "POST") {
        const body = await request.json();
        const reference = String(body.reference || "").trim();

        if (!reference) {
          return json({ error: "Payment reference is required." }, 400);
        }

        const result = await verifyPaystack(reference, env);

        if (!result.status || result.status !== "success") {
          return json({ error: "Payment was not successful." }, 402);
        }

        const packageId = String(
          result.metadata?.ftriva_package ||
          result.metadata?.package ||
          ""
        ).toUpperCase();

        await savePurchase(reference, packageId, result, env);

        return json({
          verified: true,
          reference,
          package: packageId,
          amount: result.amount,
          currency: result.currency
        });
      }

      if (path === "/api/assessment/submit" && request.method === "POST") {
        const body = await request.json();
        const reference = String(body.reference || "").trim();

        if (!reference) {
          return json({ error: "Payment reference is required." }, 400);
        }

        const payment = await verifyPaystack(reference, env);

        if (!payment.status || payment.status !== "success") {
          return json({ error: "Payment could not be verified." }, 402);
        }

        const assessment = body.assessment || body;

        await saveAssessment(
          assessment,
          reference,
          payment,
          env
        );

        return json({ success: true });
      }

      return new Response("Not found", {
        status: 404,
        headers: corsHeaders
      });
    } catch (error) {
      return json({
        error: error.message || "Something went wrong."
      }, 500);
    }
  }
};

async function verifyPaystack(reference, env) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`
      }
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status || !data.data) {
    throw new Error(data.message || "Could not verify Paystack transaction.");
  }

  return data.data;
}

async function savePurchase(reference, packageId, payment, env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  const table = env.SUPABASE_PURCHASES_TABLE || "ftriva_purchases";

  const response = await fetch(
    `${url}/rest/v1/${table}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        paystack_reference: reference,
        package_id: packageId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase purchase save failed: ${await response.text()}`);
  }
}

async function saveAssessment(assessment, reference, payment, env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  const table = env.SUPABASE_ASSESSMENTS_TABLE || "ftriva_assessments";

  const response = await fetch(
    `${url}/rest/v1/${table}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        ...assessment,
        paystack_reference: reference,
        payment_amount: payment.amount,
        payment_currency: payment.currency,
        payment_status: payment.status
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase assessment save failed: ${await response.text()}`);
  }
}
