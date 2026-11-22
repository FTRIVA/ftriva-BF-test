# FTRIVA Member & Admin Portal

- Test URL: https://app-test.ftriva.com
- Cloudflare Worker: `ftriva-member-app-test`
- Editable app source: `index.html`
- Deployed Worker wrapper: `worker.js`
- Supabase project: `pudyyizfklajwhvsnduz`

The app serves the same portal to all signed-in users and selects the member or admin interface using the authenticated profile role. The admin area includes a private assessment-review page; assessment health details are protected by an admin-only RLS policy. Keep the production app separate. The Worker wrapper embeds a gzip-compressed copy of `index.html`; regenerate it whenever the HTML changes before deploying.
