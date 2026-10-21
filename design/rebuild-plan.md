# Rebuild system — plan and current state

## Production launch — October 21, 2026

David explicitly authorized production launch, saved credentials, necessary Cloudflare setup and Squarespace store separation. Confirmed canonical origin: `https://theautovos.com`; `www` redirects preserving path/query; `shop.theautovos.com` retains the existing Squarespace merchandise catalog and checkout. This supersedes the previous preview-only publication boundary and pending launch acceptance; it does not assert invoice payment.

1. Verify account/site access, export complete DNS, and inventory current pages, products, checkout, domain and SSL settings. Preserve mail/verification records and rollback evidence before mutations.
2. Prepare production rendering: no preview notice; index public pages; apex canonicals/schema/sitemap/agent URLs; retained-store menu links and redirects; correct 404s and canonical-host redirect. Keep the separate owner preview excluded from indexing.
3. Provision an isolated production Worker, restricted email recipient, actual sending provider, hostname-bound Turnstile and secrets in the confirmed account. Deploy and test before DNS cutover; never claim provider acceptance proves inbox receipt.
4. Connect/validate the Squarespace store subdomain. Preserve every product, variant, checkout/payment/tax/shipping setting and required policy page. Make the store the retained homepage/navigation; archive non-store pages only after the main site and store work. Keep a restoration inventory.
5. Configure registrar/DNS delegation as needed. Verify DNS, TLS, HTTP/HTTPS host redirects, legacy routes, mobile/desktop journeys, real form delivery, cart and checkout without placing a merchandise order.
6. Update launch checklist, operator guidance and canonical documents with exact account/source/DNS/Worker/form/shop evidence. Run build, source, Jacques, tests, explicit Chrome and release checks; merge and deploy matching main. Report remaining prerequisites honestly.

Current state: the new Cloudflare identity and account are verified: `admin@makelark.com`, account `488e0d64df5803c663dd8c6e5c0c2049`. Created the Free Website zone `28cdcb9a1b23fe98185597ecdb4ef4d0` and a production Turnstile widget restricted to apex/www. The API key and widget secret are in Bitwarden; no secret is committed. The pending zone preserves the complete three-record Squarespace DNS baseline. Registrar delegation and live website remain unchanged. Assigned nameservers: `maleah.ns.cloudflare.com`, `ricardo.ns.cloudflare.com`.

Workers Paid is active at the explicitly approved $5/month plus metered overages. Squarespace confirms the nameserver update; Cloudflare zone activation is verified. Email Sending is enabled for `theautovos.com`; Cloudflare installed bounce MX, SPF, DKIM and DMARC records without changing apex inbound mail. Message-preview storage is disabled. A staging Worker is deployed at `auto-vos-site.autumn-dream-ff26.workers.dev`, deliberately noindex, with the Gmail-only email binding, rate limiting and the production Turnstile secret. Production hostname traffic still serves the legacy Squarespace site.

Prepared source: production notice/indexing behavior, apex canonicals and references, path/query-preserving www/HTTP redirects, explicit Cloudflare mail-provider configuration, and Shop in both menus. Production config binds the verified account and public widget key. The determinism verifier now rebuilds with the manifest's actual public mail/widget settings. Canonical/site builds, source verifiers, all 29 tests and Jacques governance pass; all 242 broad Chrome checks at five widths passed before provisioning, and all 189 local production Worker checks pass. Q&A digest remains unchanged at 135 answers. Production layout proof and hosted checks are being recorded. No production hostname cutover, actual production inbox receipt or store alteration is claimed yet.

## October 21 — homepage photo and gallery label

Verified complete on [the isolated preview](https://7c4e9a.demos.beveridge.io/). Owner-selected Drive file `1I6y4FjVAM6xXwXyHSmuK5-dMlmrotrnx` replaces only the homepage windshield-support photograph, with matching alt/title/caption, a 2400×1800 optimized original and 480/960/1600 WebP candidates. The shared gallery heading is “Paint protection film.” Service-page and gallery photographs are unchanged; existing templates consume the shared label. The 135-answer Q&A digest is unchanged.

PR #23 merged as `a05d9dc6d270f7774dc65fd452e09d8011fab33e`. The concurrent smoother-video release was then combined in main `eef8ed3ae576c2f8c91426c23fd28503837d66be` (PR #24); final Worker `f20180df-6a0b-47a9-aa68-23ea3b613df1` contains both changes. Verified: canonical/site builds, 26 tests, Jacques governance, 242 Chrome site checks, targeted 390/821/1440 responsive loading/lightbox/focus checks, 189 local Worker checks and 715 hosted HTTPS checks. Ten changed/relevant hosted pages and image files match the combined main build byte-for-byte. No production-domain or intake-configuration changes. The initial deployment was superseded during concurrent work; only this final combined release is recorded as complete. Evidence: attached content-refresh worktree, `design-artifacts/homepage-oct21/release.json`, screenshots and hosted proof.

Gallery-cover follow-up: replace only the homepage windshield gallery cover with owner-selected Drive file `1RcRzaLc7MzRwvdApUK4piTyEAAkRnumM` (orange Porsche 911, overhead). Crop the 2016×1512 original to rectangle (320,210)–(1680,1230), keeping the full car in a 1360×1020 master. Mobile shows the whole 4:3 crop; the existing desktop 16:10 center crop removes excess floor without cutting the car. Generate 480/960/1360 WebP candidates and factual alt/title/caption; retain all eight gallery photographs. Current state: canonical/site builds, 26 unit tests, Jacques governance and Chrome checks at 390/821/1440 pass. The complete car is visible in both mobile and desktop crops; responsive loading and keyboard navigation to the unchanged eight-photo gallery are verified. Evidence: `design-artifacts/homepage-oct21/gallery-cover-proof.json` and screenshots. PR #25 merged as `2dc47bc8de91c614908630e492ab225008b481b5`; main CI passed. Preview Worker `b0a31e40-e534-4528-ba19-1fb55d5eaa01` is live; all eight targeted files match the merged build byte-for-byte. All 719 hosted HTTPS checks passed; current proof and screenshots are in `design-artifacts/homepage-oct21/`. Q&A and the separate windshield-support image are unchanged.

## Business hours correction — October 21, 2026

Owner confirmed Monday–Friday 9am–5pm and Saturday by appointment only, superseding the previous 6pm weekday close. Update both content registries, Contact and shared footers, generated templates, JSON-LD (17:00), and generated agent references. Keep Sunday closed and existing appointment-only guidance; emphasize every visible appointment-only phrase. Verify rendered Contact/footer at mobile and desktop, source/generated consistency and structured data, then merge and redeploy the isolated preview. Current state: canonical and both site builds, source verifiers, all 26 tests and Jacques governance pass. Chrome checks at 390/821/1440 confirm visible hours, bold appointment wording and no horizontal overflow; inspected mobile and desktop screenshots. All 94 business-schema instances close at 17:00; both agent references and all generated templates contain the corrected hours. Q&A digest unchanged. PR #26 merged as `b4b3053bca8761997448b11d9e8cb62edba22106`; main CI passed. Preview Worker `f67b5b55-6024-44fe-a1ae-63e110b8b447` is live. All 46 pages plus llms.txt exactly match the merged build and all 719 hosted HTTPS checks pass. Local main and regenerated preview updated while preserving private plan notes. Evidence: `design-artifacts/homepage-oct21/hours-proof.json`, `hours-live-proof.json`, screenshots and hosted proof.

## Authorized outcome
Extend the supplied homepage into a complete web design system, visitor storyboard, component catalog and page templates. Bootstrap JACQUES with strict-simple defaults. Publish a separate owner-review preview after commit and merge, as authorized October 7.

## Decisions
- Preserve the approved root homepage and its hero button removal.
- Use static HTML, component render functions, native controls and semantic CSS. No new runtime dependency or framework migration.
- One canonical presentation registry; generated CSS; component contracts and repository-local guidance.
- Build service discovery/detail, work collection/story, studio/team, art, contact, quote, shop/product/cart/checkout, policy, confirmation and not-found families. Service/policy variants share templates.
- Use genuine supplied and audited imagery; publication rights remain subject to confirmation.
- Remove legacy demo pages from proposed IA; map old aliases in an explicit migration inventory.
- Forms and commerce are local fixtures. Do not imply a lead/order was sent.

## Implementation and acceptance
1. Extract identity and tokens; validate brief and JACQUES manifest/registry.
2. Implement shared shell, semantic components and distinct template compositions.
3. Assemble browsable foundations, storyboard, components and template catalog.
4. Verify deterministic rebuild, route coverage, assets, links, contracts, responsive layouts, keyboard/form/filter/cart flows, reduced motion and content extremes.
5. Render, inspect, repair observed defects and record exact remaining production work.

## Current state
Canonical owner-facing catalog and preview package are complete. The concept's service, quote, contact and team links stay inside the preview. Source checks, 104 runtime inspections at five widths and 27 interaction/accessibility checks passed on the packaged preview. Governance and component contracts passed. The changed catalog opening and usage chapter were visually inspected at desktop and mobile. Historical visual scores describe the earlier baseline, not this copy revision. Release follows commit → main → Pages. The published `preview-version.json` identifies the exact deployed revision; workflow success and HTTP readback establish publication.

Audit snapshot: `reports/audit-2026-10-07/crawl/pages.jsonl` remains local evidence; the committed route inventory captures all 36 URLs. The installed JACQUES CLI has no static-HTML UI adapter; explicit Chrome tests supply runtime evidence.

## Release boundary
Owner verifies facts, rights, policies and product data; connect forms/commerce; set redirects/canonicals/analytics/consent; verify real receipts and delivery; then launch the actual business website under separate release authority. Root preview remains noindex.

## Canonical owner preview
The user designated this design system canonical and authorized commit, merge and publication. The visual catalog contains component examples and usage rules without tool names, source paths or build commands. Main is authoritative; the Pages workflow publishes an allowlisted artifact. Live leads and commerce remain outside this preview.

## Media correction — October 8
Removed the withdrawn hood-installation photograph from all concept, storyboard, component and template uses. Replaced it with existing vehicle photography and matching alt text. Removed the same scene, including surrounding transitions, from desktop and mobile films; retired the old files and regenerated template thumbnails. The separate service-site source receives the same photo correction without importing its unfinished rebuild into this release.

## Hero motion repair — October 21, 2026

Raptor and Dakar v7 shots repeated about 59% of frames after stretching their reviewed 24 fps source excerpts to 6.8 seconds. Rebuilt just these two segments with motion-compensated interpolation at 30 fps. Same vetted source intervals, six-car order, 36-second loop and four unchanged source segments. No new generation or credits. Seven distributed intermediate frames per shot and full-resolution late details were inspected: both Dakar hood vents and Raptor hood, grille, lamps and wheels remain present without observed interpolation tearing.

New desktop/mobile v8 files fully decode, remain silent H.264/yuv420p with fast-start, 1,080 frames and the same loop seam. The new `scripts/verify-hero-motion.mjs` catches the v7 repeated-frame failure and checks actual decoded frame cadence; both v8 shot interiors have zero near-repeated frames. The Chrome hero proof now runs this guard first. This is separate from visual geometry review. Canonical/site builds, 26 tests and Jacques checks pass; 189 local Worker checks and Chrome playback/loop/controls/poster checks at 390 and 1440 pass. Physical OS visibility remains untested; the hidden handler is simulated. Deployed to the isolated preview as Worker `ab6a54b2-1bff-4588-9e01-0a95b0518d46`; hosted route verification is running. No client production cutover. Compact source, filter and hash evidence remains in `design-artifacts/hero-2026-10-21/production.json` under `motion_repair`.

## Hero film refresh — revision 5, October 21, 2026

Replaced fourth-slot Audi with the supplied white Ford F-150 Raptor PPF job. Drive image `1g5qkZ1nfL6URJC7d8tH3uIkwt9h-Qfpt` is the actual seed (conventional landscape crop); two adjacent photos supplied geometry context. Selected low front-quarter approach and arc showcases the hood and grille. No people. Other five approved source segments remain byte-for-byte unchanged, including the corrected Dakar vents. The silent desktop/mobile v7 loop is 36 seconds.

Two Veo 3.1 Fast candidates at 20 quoted credits each (40 total). First rejected for added marker lights. Second uses only 0.25–3.8 seconds before later lighting changes, slowed to 6.8 seconds with repeated original frames and no optical interpolation. Quarter-second frames and full-resolution endpoint checked against originals. Private sources, candidates, hashes, reproducible render, and compact release evidence: `design-artifacts/hero-2026-10-21/production.json`.

Verification: full media decode, exact duration/frame count, silent H.264/faststart and loop seam; 26 tests; canonical and both site builds; Jacques checks; 189 Worker routing checks; Chrome playback at 390 and 1440 including six-shot crops, wrap, controls, offscreen pause, simulated visibility handler, and three poster fallbacks. Physical window visibility was not tested. Hosted homepage comparison permits only the two video URL changes, preserving the live inquiry configuration. Deployed to the isolated preview as Worker `ba45bfe3-b704-41fd-9634-371e94da27e9`; 711 hosted HTTPS checks passed; both served media hashes match local exports and retired v2/v5/v6 URLs return 404. Source release follows. No client production cutover.

## Hero film refresh — revision 4, October 15, 2026

**Current state:** Deployed to https://7c4e9a.demos.beveridge.io/ as Worker version `afead865-31db-483e-aa56-3844e0a61641`. Media, local build and Chrome playback checks pass; all 443 hosted HTTPS checks pass. Published homepage and both media hashes match the tested build; v5 and v2 URLs return 404. Source release: PR #13. The blue Audi tint shot is fourth. A new restrained Dakar shot preserves both original front hood vents. Only its first 3.5 seconds are used, slowed to 6.8 seconds with repeated frames; later frames introducing an extra red grille feature are excluded. The first candidate was rejected for inventing upper hood vents. The other five approved edited segments are byte-for-byte unchanged. The final silent loop remains 33.6 seconds; public consumers now use `shop-film-v6.mp4` and `shop-film-mobile-v6.mp4`. Defective v5 exports are privately archived and excluded from publication.

| Order | Vehicle | Final treatment |
|---|---|---|
| 1 | Yellow Porsche 718 Cayman GT4 RS | Exact original first-cut segment; approved low approach and gloss. |
| 2 | Mercedes Geotrek | Approved whole-van to front arc. |
| 3 | INEOS Grenadier | Approved front arc; original satin/matte Stealth PPF retained. |
| 4 | Blue Audi RS3 | Exact approved window-tint shot; glass remains the focus. |
| 5 | Blue Porsche 911 GT3 RS | Approved front arc and carbon detail. |
| 6 | Gray Porsche 911 Dakar | Restrained front-quarter approach, with both original hood vents retained throughout the selected excerpt. |

**Vehicle identity:** The original homepage photo shows the GT4 RS door decal; its matching rear photo shows PORSCHE and GT4 RS badges. Correct identity: Porsche 718 Cayman GT4 RS. The prior Ford GT label was incorrect. Original evidence: `design-artifacts/hero-2026-10-12/identity/vehicle-identification.json`. Model year is not inferred.

**Spend and provenance:** Two Veo 3.1 Fast candidates at 20 quoted credits each; 40 additional credits under David's standing edit authorization. Current balance unavailable through the migrated Flow CLI. Original source photograph was conventionally cropped to exclude the background mannequin. No generative erasure or people manipulation. Canonical segment paths, hashes, prompts, rejected candidates, trim and production state: `design-artifacts/hero-2026-10-15/production.json`. Reproducible assembly: `render.py` in that folder. Prior releases remain privately archived.

**Verification:** Desktop and mobile exports fully decode: 33.6 seconds, 1,008 frames, 30 fps, silent H.264/yuv420p, fast-start. Desktop 1280 × 720 / 12.0 MB; mobile 854 × 480 / 5.3 MB. Original-photo comparison and quarter-second candidate review caught and excluded altered geometry; full-resolution selected endpoint checked. Segment hashes prove the other five approved shots are unchanged. Evidence: `design-artifacts/hero-2026-10-15/review/media-verification.json`. Browser evidence: `design-artifacts/site/hero-proof.json` and `hero-vents-*.png`.

Original and service-site builds/verifiers, owner-package retirement guard, Jacques checks, 8 inquiry tests, 179 local Worker routing checks and the 133-answer Q&A sync guard passed. Chrome checks cover actual playback, natural loop wrap at 390 and 1440 pixels, pause/resume, offscreen pause and reduced-motion/no-JavaScript/data-saving posters. Physical OS window-visibility delivery is not verified; the application's visibility handler is exercised with a simulated event. No static HTML adapter-conformance claim.

**Boundaries:** Cars only; no human installation footage, occupants, hands or human reflections. Hero structure, copy, CTAs, poster and accessibility behavior remain intact. Client production launch remains separate. Approved seed images do not imply Caleb approval of generated output. Retired people-containing v2 films and defective v5 films are not acceptable rollbacks.

**Backups:** Approved originals with restrained conventional motion remain the fallback. Full-resolution website photos or genuine finished-car YouTube footage may support later revisions; do not substitute vehicles without direction. AI upscaling or vertical-to-horizontal expansion needs Caleb's output review before publication.
