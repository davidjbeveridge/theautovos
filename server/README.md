# Inquiry delivery

The single allowed recipient is `theautovos@gmail.com`, set in `inquiry.mjs`. No submission can override it. Customer email is used as Reply-To; the sender must be verified. Phone-only inquiries omit Reply-To. The email contains the vehicle, service, timing, message, contact details, consent and bounded page/campaign context.

## Production — October 21, 2026

The live Worker is `auto-vos-site`, account `488e0d64df5803c663dd8c6e5c0c2049` (`admin@makelark.com`). `wrangler.jsonc` binds zone `28cdcb9a1b23fe98185597ecdb4ef4d0`, wildcard apex/www routes, the restricted email binding, and the public Turnstile widget. Neither workers.dev nor version previews are enabled. Do not deploy production through the personal account that hosts the owner preview.

Use `npm run build:production`; it invokes the same guarded build as Wrangler. Deploy the merged main revision with credentials bound to this account, then compare live pages/assets with `dist-production`. The Worker redirects www and HTTP to `https://theautovos.com`, preserving path/query. Cloudflare nameservers are `maleah.ns.cloudflare.com` and `ricardo.ns.cloudflare.com`. The retained apex A and www Squarespace CNAME are proxied behind the Worker routes. The Squarespace verification CNAME remains DNS-only. Shop was initially DNS-only; the redirect-recovery incident below supersedes that proxy state. Do not replace shop with a Worker route or alter its commerce settings.

Workers Paid is active under the approved $5/month plus metered-overages plan. Email Sending uses `inquiries@theautovos.com`, Cloudflare-managed SPF/DKIM/DMARC/bounce DNS, and the Gmail-only native binding. Message-preview storage and application logging are disabled. The Turnstile secret is stored in Worker secrets and the explicitly selected vault, never source. No apex inbound mail routing was added.

Verification: all 46 production pages and referenced assets were compared with the merged build. One real browser submission with the production Turnstile widget was accepted; Cloudflare recorded `delivered` to the receiving mail server at `2026-10-21T22:01:37Z`. This establishes receiving-server delivery, not Gmail inbox placement or a human reply. Separate historical preview inbox confirmation does not prove production inbox placement. Private references, message IDs and DNS/product backups remain in ignored launch evidence. Do not resend tests automatically.

Rollback: first prefer a previously verified production Worker version with the same account, routes, secrets and recipient. If reverting to Squarespace, unproxy apex/www and deliberately restore the prior Squarespace primary-domain/homepage configuration; merely changing DNS will otherwise redirect the old primary domain to shop. Keep the shop catalog intact. Restore removed marketing pages through Squarespace Deleted Pages within its 30-day recovery window or the private pre-cutover content exports. Never empty Deleted Pages as part of deployment. Owner-preview configuration and credentials stay separate.

## Redirect recovery — October 21, 2026

The initial cutover left old Squarespace DNS answers cached at some resolvers. Squarespace's new shop-primary setting then returned permanent 301 redirects from apex/www to shop. A browser can retain those redirects after its DNS becomes current. Forced-edge checks prove the Cloudflare application, not that every ordinary client has recovered; do not label global propagation complete from those checks.

October 22 repair: the temporary recovery rule itself broke direct shop visits and the site's `noreferrer` Shop links. Ordinary HTTPS diagnostics reproduced a 302 to `https://theautovos.com/?av_launch_recovery=20261021` without a referrer or with a preview referrer, while an apex referrer returned the shop. The obsolete rule is now **disabled**: ruleset `1481e5bf309e417bb8657a888c45d1e1`, rule `c3a605d9a364458caebb60476c4fc577`, ref `autovos_launch_redirect_recovery`. Shop remains proxied with its unchanged `ext-cust.squarespace.com` origin and TLS settings. Apex/www Worker routes and commerce/email settings are unchanged.

Do not re-enable a blanket shop-root recovery redirect: direct shop visits must work independently of referrer, cookies, query markers or browsing history. Production and preview navigation point directly to `https://shop.theautovos.com/` and stay in the same tab; the store's “Back to Auto Vos” link returns to the canonical apex. XPEL and other third-party links retain their new-tab behavior. Cached historical apex-to-shop 301s are separate client state; do not break the working shop to compensate for them.

Run `node scripts/verify-shop-navigation.mjs` after deployment. It verifies both site builds, ordinary HTTPS responses for direct/referred shop visits, production/preview links, canonical www redirect, catalog/product/cart and the store backlink. No order or email is sent. Incident snapshots remain ignored under `design-artifacts/shop-navigation-2026-10-22/`.

## Shared footer inquiry

The service-site shell now uses the same form and client handler on every page. The quote page keeps its main form; other pages put the sole form beside the lazy-loaded footer map. Load the configured live Turnstile script on all these pages. Never create a second set of form IDs or bypass the existing origin, rate limit, spam or recipient controls. The contact page's separate map remains click-to-load; privacy copy distinguishes it from the automatically lazy-loaded footer map.

The October 21 footer release is application main `acfe1a2` (PR #31), verified on production and owner preview with their separate account/provider/widget configuration. Local response fixtures prove failure, retry and accepted UI states without delivery. Hosted invalid-token checks prove rejection, not inbox delivery; retain the separate real launch receipt evidence above. Release details and Worker versions are recorded in the canonical rebuild plan.

## Activate the separate hosted preview

1. Onboard a dedicated sender domain with Cloudflare Email Service. Check the account plan/quota before changing billing; do not assume deployment access includes Email Sending access.
2. Create a managed Turnstile widget for `7c4e9a.demos.beveridge.io`. Store the secret in Bitwarden and the preview Worker's `TURNSTILE_SECRET`; never commit it. The widget action is `inquiry` and the server verifies the exact hostname and action.
3. Add `send_email: [{name: "INQUIRY_EMAIL", destination_address: "theautovos@gmail.com"}]` to the preview configuration. Set `INQUIRY_MODE=live`, `MAIL_PROVIDER=cloudflare` and the verified `MAIL_FROM`. Keep the existing rate limit and disabled application logs.
4. Set the public site key in the preview configuration and run `node scripts/build-hosted-demo.mjs`. Wrangler runs this same build automatically before deployment, so the page and Worker use the same inquiry mode. All preview indexing restrictions remain enabled.
5. Run `node scripts/verify-hosted-demo.mjs`; in live mode it deliberately sends an invalid simulation token and must not deliver email. Then submit one clearly labeled test through the real form and actual Turnstile widget. Record the inquiry reference and delivery evidence. Do not use Turnstile test keys or bypass validation to claim an end-to-end pass.
6. Verify receiving-server delivery or mailbox receipt separately. A binding message ID proves provider acceptance, not inbox placement. Do not fabricate inbox access. Confirm Reply-To allows a direct reply to the customer.

The handler retains a Resend compatibility adapter, but production explicitly selects `MAIL_PROVIDER=cloudflare`. Preview activation and its domain/widget/account remain separate from production.

## Failure and rollback

The handler rejects cross-origin posts, malformed or oversized bodies, honeypot submissions, invalid service/contact data and failed spam checks before sending. Missing dependencies fail closed. Explicit provider rejection preserves the form for retry; timeouts or ambiguous results instruct the visitor to call or email before trying again. There are no automatic resend loops, autoresponders, inquiry storage or raw application logs.

To return the hosted preview to simulation, set `INQUIRY_MODE=simulated` and run `node scripts/build-hosted-demo.mjs`, then deploy the matching page and Worker. Never change only the banner. Keep the recipient and rate limit fixed. Local and catalog servers never connect to the provider.

References: [Cloudflare sending binding](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/), [binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Local verification

Run `node --test tests/*.test.mjs`. After building and serving the local demo, run `PLAYWRIGHT_MODULE=<installed-playwright-module> node scripts/inquiry-browser-proof.mjs`. This uses Chrome with explicit Turnstile and email response fixtures and records that limitation with its screenshots. It verifies the live UI without sending real email. The ordinary `site-browser-proof.mjs` still checks the simulated local site.
