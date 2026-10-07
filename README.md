# Auto Vos

**Canonical design baseline, October 7, 2026.** The approved site concept remains at `index.html`. The rebuild system is at **`design-system/index.html`**: foundations, six-scene visitor storyboard, live component specimens, and 20 working examples across 16 page families.

## Share with the owner

- Site concept: https://davidjbeveridge.github.io/theautovos/
- Design system and storyboard: https://davidjbeveridge.github.io/theautovos/design-system/

Main is the authoritative source. The Owner preview workflow verifies and publishes only the site, catalog, templates and assets. `preview-version.json` identifies the deployed revision. This preview does not replace the existing business website.

## Preview

Open `design-system/index.html` directly, or run:

```sh
python3 -m http.server 8787 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8787/design-system/`. No installation or build is needed to view the checked-in templates.

## Edit and verify

```sh
node scripts/build.mjs
node scripts/verify.mjs
jacques check run --workspace . --tier fast --json
jacques component registry validate contracts/components/registry.yaml --json
```

- `DESIGN.md` — design rules and source ownership.
- `design/presentation.yaml` — canonical presentation tokens (JSON-compatible YAML).
- `src/content.mjs` — service, gallery, commerce fixture and catalog records.
- `src/components.mjs` — semantic rendering functions.
- `src/pages.mjs` — page-family compositions.
- `src/system.css`, `src/catalog.css` — readable semantic CSS, no utility framework.
- `src/interactions.js` — progressive forms, disclosure, gallery, video and demo bag behavior.
- `contracts/components/` — eight portable component contracts and registry.
- `design/page-inventory.json` — all 36 audited URLs mapped to a template and migration decision.
- `design/rebuild-plan.md` — canonical plan, current state and release boundary.
- `design-artifacts/` — verification and design review.

`templates/` and `design-system/` are generated. Edit `src/` or the token registry, then rebuild. Catalog preview images come from the explicit browser proof, not the normal build.

### Browser proof

The browser check requires Playwright and installed Google Chrome. There are no application runtime dependencies. Install Playwright as test tooling or point `PLAYWRIGHT_MODULE` at an existing `playwright/index.mjs`; then run:

```sh
node scripts/browser-proof.mjs
node scripts/accessibility-proof.mjs
# After packaging (default origin includes /dist):
node scripts/owner-preview-proof.mjs
```

The default test origin is `http://127.0.0.1:8787`; set `PREVIEW_URL` to change it. It uses a disposable Chrome context, tests 20 pages at five widths, captures desktop/mobile examples and catalog chapters, and exercises validation/retry, gallery reset, native navigation, demo cart editing and video controls. It closes its browser. Long catalog chapters are captured separately to avoid full-page raster limits. The checker loads lazy images before evidence capture; the shipped site retains lazy loading.

The installed JACQUES CLI validates the manifest, design contract, presentation registry, component contracts and lockfile. Its UI runner does **not** support this static HTML adapter. The explicit repository browser proof supplies runtime evidence; no JACQUES adapter conformance is claimed.

## Prototype boundary

All pages remain `noindex,nofollow`. Forms validate locally and do not send or persist personal information. The demo bag stores merchandise selection only in session storage. Prices and options are labeled fixtures; checkout never collects payment. Policy pages are content shells, not active legal terms. Verify staff/contact details and image rights before publication. Production delivery, payment provider, inventory, tax, shipping, policy approval, redirects and deployment remain rebuild integration work.

## Homepage provenance

The root homepage was copied from `davidjbeveridge/makelark-demos/auto-vos/` at commit `293b278b161223e853534c7d269a04875879b1ce`. Its traced logo, shop film and source photographs establish the system's visual reference. The requested hero watch button removal is preserved. Additional local prototype imagery is attributed in `design/assets.json`.

## Publish

Run `npm run package:preview` to produce the allowlisted `dist/` artifact. Pull requests verify the build; main publishes through `.github/workflows/preview.yml`. Internal design contracts, audits, source files and local proof are excluded from the website.
