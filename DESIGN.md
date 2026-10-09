# Auto Vos interface system

## Overview
The canonical design system for the Auto Vos rebuild, designated by the user on October 7, 2026. The approved root homepage is the visual reference, including removal of its hero watch button. This delivery is a **prototype/template library**, published for owner review, with no connected commerce or lead processing.

## Brand expression
Drive it. Love it. Protect it. Keep the supplied winged-fox wordmark intact. Use the real studio and cars as evidence. Do not fabricate staff, completed installations, reviews, results, prices, certifications, warranties or policies.

## Colors and typography
`design/presentation.yaml` owns exact tokens. `scripts/build.mjs` projects them into `design-system/tokens.css`; do not edit that generated file. White and near-black carry the interface. Color belongs to photographs. Blue text links use semantic link tokens, with a lighter blue on dark backgrounds. Inline links are bold and underlined by default, with a thicker underline on hover and a visible keyboard outline. Error/success colors are reserved for feedback. Arial/Helvetica uses the homepage's compact, tightly tracked headline grammar; sentence-case reading text stays comfortably spaced. Display size is fluid, 48–112px; secondary headings 32–64px; body 16–20px; metadata at least 12px. No downloaded font.

## Layout, spacing, surfaces, elevation, and shapes
Use one 1440px max content frame with fluid 24–64px gutters. Reading measure is 65 characters. Eight-pixel spacing rhythm, square corners, hairline dividers, no floating shadows. Photography uses 16:10 editorial crops, 4:5 portraits, contain-fit products. Spacious full-bleed dark chapters alternate with white explanatory sections. Grids describe collections; prose, specifications, FAQs and steps do not need cards.

## Motion and icons
Keep motion optional and user-controlled. The home poster is complete without video; playback requires explicit action in the new template. Reduced motion removes transitions. Hover changes an underline or image scale by at most 1.02 over 180ms. No parallax, scroll lock, forced intro, carousel or cursor effects. Use the homepage's 24px SVG line family, 1.5px strokes, shown at 20px with text labels and minimum 48px control targets.

## Components
`src/components.mjs` owns semantic rendering functions; `src/system.css` owns component styles; `src/interactions.js` owns progressive behavior. `contracts/components/registry.yaml` catalogs contracts. Use native a, button, details, summary, input, select, textarea, fieldset and table. There is no framework or private headless dependency to wrap. Complex composite widgets are deferred; native disclosure navigation and ordinary radio controls suffice.

## Content and language
Use direct questions and concrete answers: what the service does, what it does not do, examples, next step. Preserve product names and source credits. Avoid generic luxury claims and invented urgency. Legacy site content is an October 7 audit snapshot, not proof of current facts. Staff, contact details, rights, commerce data and policy copy need owner verification before release. Clearly label fixture data in commerce and forms.

## Interaction and state
Navigation uses real static links with aria-current. Gallery filters expose aria-pressed and a live result count; empty state has reset. Product selection is native radio/select; add-to-bag uses an session-only demo bag containing merchandise selections, never personal data. Quote/contact forms validate locally, retain fields after an error, focus a linked error summary, and show an explicitly local completion. No personal data is stored or sent. A demo transport-error toggle lives in the template preview rail, outside the production page composition. Cart supports update/remove/empty; checkout explains the provider handoff and never charges.

## Responsive and platform behavior
Desktop grid is 12 conceptual columns. At 900px, navigation becomes a native disclosure and split heroes stack. At 600px, grids stack; quote form stays one column, actions span available width, galleries retain useful captions. Test 360, 390, 768, 1024 and 1440px plus 200% text scaling. Do not conceal essential text to fit.

## Accessibility
One H1 and one main per page; skip link first; semantic landmarks; visible two-ring focus; descriptive images; decorative SVG hidden from assistive technology. Error summary links to labeled fields. Invalid fields use aria-invalid and aria-describedby. Feedback has visible text and live regions. No meaning relies on color alone. Native controls retain keyboard behavior. Automated checks do not establish screen-reader conformance.

## Data-heavy and consequential interfaces
Product prices are fixture data, never live offers. Total excludes unconfigured tax/shipping and says so. Receipt and confirmation fixtures are labeled as examples. Policy templates specify required sections but do not invent legal promises. Production form processing, payment provider, privacy consent, CRM, tax, shipping and fulfillment remain integration work.

## Do's and don'ts
Do use semantic components, bounded variants, canonical tokens and content records. Do preserve the root concept and keep the owner preview noindex. Do verify links, contrast, keyboard paths and recovery.
Do not add Tailwind, utility-class strings, shadcn, runtime CSS-in-JS, generic Box/style-prop systems or theme engines. Do not introduce a framework merely for templating. Do not turn the catalog's documentation controls into customer-facing UI.

## Source-of-truth references
- `design/brief.json`: Xenia brief and protected qualities.
- `design/page-inventory.json`: template coverage and migration decisions for each audited URL.
- `design/rebuild-plan.md`: single implementation plan and current state.
- `design/assets.json`: image provenance and publication boundary.
- `src/content.mjs`: editable template fixture content.
- `src/components.mjs`, `src/pages.mjs`, `src/catalog.mjs`: canonical implementation.
- `design-system/index.html`: generated visual catalog, storyboard and component specimens.
- `templates/`: generated example pages; edit source, then rebuild.
- `jacques.yaml` and `jacques.lock.json`: governance and deterministic lock.

## Canonical status and publication
The main branch is authoritative. The owner-facing catalog at `design-system/index.html` expresses the foundations, storyboard, component behavior, page patterns and usage rules. Keep tooling names, source paths, build commands and implementation contracts out of this visual guide. Repository documentation remains the implementation reference. Canonical design status does not mean the owner has approved every business fact or that forms/commerce are live.

`scripts/package-preview.mjs` creates the explicit publication allowlist in `dist/`. GitHub Pages publishes that artifact from main; never publish the repository root, reports or local proof files.

## Full static service-site extension — October 7
The current task extends this identity into a registry-driven service site (52 demo pages; production publication gates recorded separately). `src/site/` owns the service-site shell, content, page families and progressive behavior; it reuses canonical tokens, primitives and `src/system.css`. The historical catalog/fixtures remain unchanged. `scripts/build-site.mjs` creates separate allowlisted demo and production candidates.

`design/site-brief.json` is the scoped Xenia extension brief; `design/site-design-run.json` records design evidence. `server/inquiry.mjs` is the sole runtime exception, packaged by `server/worker.mjs` for Cloudflare Workers Static Assets. No live email or analytics runs in the local demo. See `handoff/README.md` for configuration and release gates. The user authorized the isolated temporary Beveridge demo. Client production launch, shop cutover and production DNS changes still require their release gates. Automotive art is excluded; no art page, links, inquiry context or agent guidance ships in the service-site artifact.

Run the original build/verification plus site source, inquiry, Chrome and local Worker checks before service-site completion. Source-bound current results and pending owner approvals are in `design/implementation-verification.md`. Do not claim static-adapter conformance or live integration from these local checks.
