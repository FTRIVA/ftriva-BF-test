# FTRIVA Black Friday Website — Cloudflare Worker

This is a replacement website package based on the previously deployed FTRIVA Cloudflare website. It preserves the existing static-site + Worker structure and includes individual package selection, a package recommendation widget, Paystack checkout endpoints, the Founding 10 claim endpoint, Supabase assessment submission and generic email sign-up notifications via Cloudflare Email Service.

## Files
- `public/` — website pages, styles and browser logic
- `src/index.js` — Cloudflare Worker API
- `FOUNDER_10_SETUP.sql` — additive Supabase migration for atomic first-10 claims
- `CLOUDFLARE_SECRETS_CHECKLIST.txt` — required account configuration
- `wrangler.jsonc` — retains the `ftriva-test` Worker name and existing static assets binding

## Deploy
Upload/replace the files in the existing GitHub repository and let the connected Cloudflare deployment build. Do not create a new Worker or Supabase project unless explicitly intended. Before enabling real checkout, complete the checklist and test in a separate test environment.

## Important
The existing assessment table schema must be checked before deployment. The package cannot guarantee that Supabase inserts succeed until its columns match. Email notifications require the ftriva.com domain to be onboarded in Cloudflare Email Service and the configured EMAIL binding to be deployed. Keep all service-role and Paystack secret keys in Cloudflare Worker secrets only.
