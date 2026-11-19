# FTRIVA Full-stack Cloudflare Worker

This is a fresh replacement build for the FTRIVA marketing and client-onboarding website. It uses a real Cloudflare Worker entry point (`src/index.js`) plus static assets in `public/`. It is not a static-only Worker.

## Deploy with Cloudflare

**Important:** This project is intended for the Cloudflare Workers deployment flow, not the Pages drag-and-drop upload flow.

1. Extract this ZIP on a computer or development environment that can run Node.js. The Cloudflare dashboard's static asset upload is not a substitute for deploying the Worker entry point.
2. Install dependencies with `npm install`.
3. Run `npx wrangler login` and authenticate to the Cloudflare account.
4. For a test deployment, change `name` in `wrangler.jsonc` to a unique test Worker name if needed (the supplied name is `ftriva-test`).
5. Run `npm run deploy`.
6. Open the deployed `workers.dev` URL and check `/api/health`.

If deploying from an iPad alone, the dashboard drag-and-drop interface may not deploy this source project as executable Worker code. Use a connected Git repository with Cloudflare Workers Builds or a computer/development environment with Wrangler. Do not upload the source ZIP as static assets and expect API routes to execute.

## Cloudflare Worker secrets and variables

In the Worker dashboard, open Settings → Variables and Secrets. Add these as **secrets** (not plain-text variables):

- `PAYSTACK_SECRET_KEY` — Paystack test secret key for test deployment; live secret only after explicit launch approval.
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key, server-side only.

Add these as variables:

- `ENVIRONMENT` = `test`
- `SUPABASE_URL` = existing Supabase project URL
- `SUPABASE_ASSESSMENTS_TABLE` = `ftriva_assessments` (only if this table and the expected columns have been created in the existing project)
- `PAYSTACK_MONTHLY_PLAN_CODE` = Paystack plan code for the R249 monthly membership (required before monthly checkout can work)

Never put secret keys in frontend files or commit them to source control.

## Paystack behaviour

- Once-off checkout initialises a R299 ZAR transaction.
- Monthly checkout requires `PAYSTACK_MONTHLY_PLAN_CODE` configured in Paystack. If it is absent, the site deliberately refuses monthly checkout and explains why; it does not silently charge a once-off payment as a subscription.
- Paystack returns to `/payment-callback.html`. The Worker verifies the transaction directly with Paystack before the assessment unlocks.
- Test keys must be used in the test Worker. Do not use live keys while testing.

## Supabase integration status

The Worker submits an assessment to the configured PostgREST table after re-verifying the Paystack reference. It expects a table named by `SUPABASE_ASSESSMENTS_TABLE` (default `ftriva_assessments`) with columns compatible with:

- `payment_reference` text
- `package_type` text
- `customer_email` text
- `assessment_data` jsonb
- `requested_start_date` text (nullable)
- `status` text
- `submitted_at` timestamptz

The existing FTRIVA Supabase schema has not been inspected in this build. Do not assume this table exists. If it does not, the API will report a clear Supabase error and will not pretend the assessment was saved. Reconcile the table/columns with the existing database before accepting real clients. The service-role key bypasses RLS and is used only by the Worker; protect it carefully.

## Important scope and safety notes

- This package does not replace or modify the separate FTRIVA member/admin application.
- It does not alter the existing Supabase database or create tables.
- The assessment unlock is based on server-side Paystack verification; browser storage is not trusted for payment verification.
- The assessment's requested start date is stored as the requested date category. Actual programme access still depends on coach publication and any required safety review in the separate app/workflow.
- The current form includes a short date-range choice, not a calendar date picker. The exact-date scheduling rule can be added when the agreed final date options are confirmed in the backend schema.
- This build has not been tested against the user's Cloudflare account, Paystack credentials, or Supabase project because those accounts and credentials are not accessible here.
