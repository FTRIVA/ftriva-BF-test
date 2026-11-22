# FTRIVA Black Friday Website & Member Portal — Test Environment

This repository contains the FTRIVA public website, its Cloudflare Worker API, and the browser-side website logic for the November 2026 campaign.

## Interfaces
- `public/` — public website pages, package selection, assessment forms, checkout and payment callback.
- `src/index.js` — Cloudflare Worker API for Paystack, Supabase, purchase entitlements, assessment submissions, digital downloads and Resend notifications.
- The separate member/admin portal is deployed to `https://app-test.ftriva.com`. Its editable HTML source is in `member-app/index.html`, with the deployed Worker wrapper in `member-app/worker.js`. It uses role-based access: members see their training portal; the FTRIVA admin sees the programme builder, assessment review, client assignments, exercise feedback and commerce tools.

## Test configuration
- Worker: `ftriva-test`
- Environment: `test`
- Website Supabase project: `jygjaxsztnmgykzhukdx`
- Member-app Supabase project: `pudyyizfklajwhvsnduz`
- Member app: `https://app-test.ftriva.com`
- Do not modify or deploy the production Worker while completing test-environment work.

## Required Cloudflare Worker secrets
Store secrets in Cloudflare Worker Secrets only; never commit secret values:
- `SUPABASE_SECRET_KEY` (preferred) or the supported legacy `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY` — Paystack TEST secret key only
- `FTRIVA_APP_SYNC_TOKEN` — shared token for the website-to-member-app entitlement sync
- `RESEND_API_KEY` — restricted sending key for `notify.ftriva.com`

The Paystack plan codes and non-secret environment variables are in `wrangler.jsonc`. The Worker does not require a Cloudflare Email Sending binding; transactional notifications use Resend.

## Email
- Sending domain: `notify.ftriva.com`
- Sender: `FTRIVA <notifications@notify.ftriva.com>`
- Internal notifications: `ftrivafitness@gmail.com`
- Purchase and membership emails are queued only after verified payment and successful app-entitlement synchronisation.
- Membership creation alone does not activate access or send the activation email. The verified payment event performs activation.
- Email delivery is idempotent through the Supabase outbox and Resend idempotency keys.

## Security and data
- Keep website customer/payment/assessment tables private with RLS enabled and no public policies. The website Worker accesses them server-side.
- Keep member profiles, programmes, assignments, feedback, progress, client assessment records and storage protected by member/admin RLS policies. Paid website assessments are synchronised server-to-server into the admin-only `client_assessments` table through the authenticated `ftriva-purchase-sync` Edge Function.
- The website Supabase project is hosted in EU Central (Frankfurt). Review POPIA Section 72 cross-border transfer safeguards and the privacy notice before accepting real client data.
- Keep test and production Supabase projects, Worker secrets, Paystack keys and domains separate.

## Deployment
The connected Cloudflare deployment builds from this repository. After changing files, verify the latest `ftriva-test` deployment and confirm that its secret bindings remain configured. Never use a live Paystack secret in the test Worker.
