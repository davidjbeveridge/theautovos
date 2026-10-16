# Inquiry delivery

The single allowed recipient is `theautovos@gmail.com`, set in `inquiry.mjs`. No submission can override it. Customer email is used as Reply-To; the sender must be verified. Phone-only inquiries omit Reply-To. The email contains the vehicle, service, timing, message, contact details, consent and bounded page/campaign context.

## Activate the hosted preview

1. Onboard a dedicated sender domain with Cloudflare Email Service. Check the account plan/quota before changing billing; do not assume deployment access includes Email Sending access.
2. Create a managed Turnstile widget for `7c4e9a.demos.beveridge.io`. Store the secret in Bitwarden and the preview Worker's `TURNSTILE_SECRET`; never commit it. The widget action is `inquiry` and the server verifies the exact hostname and action.
3. Add `send_email: [{name: "INQUIRY_EMAIL", destination_address: "theautovos@gmail.com"}]` to the preview configuration. Set `INQUIRY_MODE=live`, `MAIL_PROVIDER=cloudflare` and the verified `MAIL_FROM`. Keep the existing rate limit and disabled application logs.
4. Build using `SITE_ORIGIN=https://7c4e9a.demos.beveridge.io TURNSTILE_SITE_KEY=<public-site-key> node scripts/build-site.mjs --hosted-demo --live-inquiries`. Deploy that artifact and the matching Worker together. All preview indexing restrictions remain enabled.
5. Run `node scripts/verify-hosted-demo.mjs`; in live mode it deliberately sends an invalid simulation token and must not deliver email. Then submit one clearly labeled test through the real form and actual Turnstile widget. Record the inquiry reference and delivery evidence. Do not use Turnstile test keys or bypass validation to claim an end-to-end pass.
6. Verify receiving-server delivery or mailbox receipt separately. A binding message ID proves provider acceptance, not inbox placement. Do not fabricate inbox access. Confirm Reply-To allows a direct reply to the customer.

The production-domain handler retains the existing Resend adapter by default. `MAIL_PROVIDER=cloudflare` selects the same native adapter for a later production deployment. Production DNS/shop cutover is separate from preview activation.

## Failure and rollback

The handler rejects cross-origin posts, malformed or oversized bodies, honeypot submissions, invalid service/contact data and failed spam checks before sending. Missing dependencies fail closed. Explicit provider rejection preserves the form for retry; timeouts or ambiguous results instruct the visitor to call or email before trying again. There are no automatic resend loops, autoresponders, inquiry storage or raw application logs.

To return the hosted preview to simulation, remove the live mode setting (or set `INQUIRY_MODE=simulated`) and rebuild without `--live-inquiries`, then deploy the matching page and Worker. Never change only the banner. Keep the recipient and rate limit fixed. Local and catalog servers never connect to the provider.

References: [Cloudflare sending binding](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/), [binding restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/), [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Local verification

Run `node --test tests/*.test.mjs`. After building and serving the local demo, run `PLAYWRIGHT_MODULE=<installed-playwright-module> node scripts/inquiry-browser-proof.mjs`. This uses Chrome with explicit Turnstile and email response fixtures and records that limitation with its screenshots. It verifies the live UI without sending real email. The ordinary `site-browser-proof.mjs` still checks the simulated local site.
