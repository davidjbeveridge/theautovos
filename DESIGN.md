# Auto Vos interface system

## Overview
The canonical design system for the Auto Vos rebuild, designated by the user on October 7, 2026. The approved root homepage is the visual reference, including removal of its hero watch button. This delivery is a **prototype/template library**, published for owner review, with no connected commerce or lead processing.

## Brand expression
Drive it. Love it. Protect it. Keep the supplied winged-fox wordmark intact. Use the real studio and cars as evidence. Do not fabricate staff, completed installations, reviews, results, prices, certifications, warranties or policies.

## Colors and typography
`design/presentation.yaml` owns exact tokens. `scripts/build.mjs` projects them into `design-system/tokens.css`; do not edit that generated file. White and near-black carry the interface. Color belongs to photographs. Blue text links use semantic link tokens, with a lighter blue on dark backgrounds. Review disclosure text and its Read more control are Google-style exceptions without underlines. Only links embedded in paragraphs and captions receive the blue, bold, underlined reading treatment; headings, lists, navigation, cards and standalone link components retain their existing styling. Reading links are bold and underlined, with a thicker underline on hover and a visible keyboard outline. Text selection is white on ink on light surfaces and ink on white on dark surfaces, using selection tokens. Error/success colors are reserved for feedback. Arial/Helvetica uses the homepage's compact, tightly tracked headline grammar; sentence-case reading text stays comfortably spaced. Display size is fluid, 48–112px; secondary headings 32–64px; body 16–20px; metadata at least 12px. No downloaded font.

## Layout, spacing, surfaces, elevation, and shapes
Use one 1440px max content frame with fluid 24–64px gutters. Reading measure is 65 characters. Eight-pixel spacing rhythm, square corners, hairline dividers, no floating shadows. Photo viewers use a slim dark frame, contained image, caption, previous/next controls and thumbnails. Group images by their review or content section; never traverse unrelated reviews. Support arrow keys, touch swipes, Escape and focus return. Photography uses 16:10 editorial crops, 4:5 portraits, contain-fit products. Spacious full-bleed dark chapters alternate with white explanatory sections. Selected Google review cards are the bounded exception to square surfaces: dark charcoal, 12px corners, initials, individual stars/date, full-text expansion and all associated photos. Identify the curated selection and link to the original; do not imply a live Google widget or aggregate rating. Grids describe collections; prose, specifications, FAQs and steps do not need cards.

## Motion and icons
Keep motion restrained and optional. Scroll entrances translate at most 12px over 420ms without ever hiding undiscovered content. Gallery images scale by at most 1.02 on precise-pointer hover; touch and keyboard use explicit lightboxes. Disclosures and dialogs enter over 180ms. All motion uses shared registry tokens and respects a live reduced-motion preference. The Targa article embeds the YouTube player above its steps without autoplay, with a persistent external fallback. The service-site home hero uses the existing muted looping film with a compact 20px pause/play icon in a 48px tap target, a changing accessible action label and visible keyboard focus. Reduced motion and data-saving preferences default to the complete poster; offscreen or hidden-tab video pauses. Template film playback remains explicit. Reduced motion removes transitions. Hover changes an underline or image scale by at most 1.02 over 180ms. No parallax, scroll lock, forced intro or cursor effects. Use the homepage's 24px SVG line family, 1.5px strokes, shown at 20px with text labels and minimum 48px control targets.

## Components
`src/components.mjs` owns semantic rendering functions; `src/editorial.mjs` owns shared image-led page patterns; `src/system.css` and `src/editorial.css` own their styles; `src/interactions.js` owns progressive behavior. `contracts/components/registry.yaml` catalogs contracts. Use native a, button, details, summary, input, select, textarea, fieldset and table. There is no framework or private headless dependency to wrap. Complex composite widgets are deferred; native disclosure navigation and ordinary radio controls suffice.

### Shared editorial patterns
- `splitHeader({label,title,description,image,headingLevel?})` pairs one page heading and short purpose with a real photograph on an ink surface. The text precedes the image in DOM order; the image sits beside it on wide screens and follows it on narrow screens.
- `editorialRows(rows)` renders one spacious entry per row. Each row accepts `{title,text,lead?,href?,image,caption?,action?}`. Copy comes first in DOM order; wide layouts alternate the image side; compact layouts keep copy before image.
- `mediaExplanation({title,text,image,caption,lightboxLabel?,className?,headingLevel?})` pairs a bounded image with its explanation. The image opens the scoped photo viewer; a plain link to the original remains in the caption as a no-script fallback. Do not add a second viewer trigger for the same image.
- Collection pages use one row per entry; explanatory articles use media only where it clarifies the point; service pages pair diagrams with their explanation; installation instructions remain one ordered sequence.

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
- `src/editorial.mjs`, `src/editorial.css`: shared editorial page patterns used by the service site and catalog.
- `design-system/index.html`: generated visual catalog, storyboard and component specimens.
- `templates/`: generated example pages; edit source, then rebuild.
- `jacques.yaml` and `jacques.lock.json`: governance and deterministic lock.

## Canonical status and publication
The main branch is authoritative. The owner-facing catalog at `design-system/index.html` expresses the foundations, storyboard, component behavior, page patterns and usage rules. Keep tooling names, source paths, build commands and implementation contracts out of this visual guide. Repository documentation remains the implementation reference. Canonical design status does not mean the owner has approved every business fact or that forms/commerce are live.

`scripts/package-preview.mjs` creates the explicit publication allowlist in `dist/`. GitHub Pages publishes that artifact from main; never publish the repository root, reports or local proof files.

## Full static service-site extension — October 7
The current task extends this identity into a registry-driven service site (46 demo pages; production publication gates recorded separately). `src/site/` owns the service-site shell, content, page families and progressive behavior; it reuses canonical tokens, primitives and `src/system.css`. Work, Guides and explanatory-article templates share the live editorial renderers. Legacy commerce fixtures remain clearly labeled. `scripts/build-site.mjs` creates separate allowlisted demo and production candidates.

`design/site-brief.json` is the scoped Xenia extension brief; `design/site-design-run.json` records design evidence. `server/inquiry.mjs` is the sole runtime exception, packaged by `server/worker.mjs` for Cloudflare Workers Static Assets. No live email or analytics runs in the local demo. See `handoff/README.md` for configuration and release gates. The user authorized the isolated temporary Beveridge demo. Client production launch, shop cutover and production DNS changes still require their release gates. Automotive art is excluded; no art page, links, inquiry context or agent guidance ships in the service-site artifact.

Run the original build/verification plus site source, inquiry, Chrome and local Worker checks before service-site completion. Source-bound current results and pending owner approvals are in `design/implementation-verification.md`. Do not claim static-adapter conformance or live integration from these local checks.

The shared XPEL banner closes every service-site page before the footer. Use the approved logo on a light surface, three product photographs with manufacturer attribution, and direct product links. Product imagery is manufacturer evidence, not an Auto Vos portfolio claim.

Repeated side-by-side content uses shared grid rows for media, headings, descriptions and actions. Wrapped headings must not stagger the start of adjacent body text. Use CSS subgrid at each component's multi-column breakpoint, with natural content height and independent rows for wrapped collections; restore ordinary flow when stacked. This applies to services, galleries, benefits, process/installation steps, guides, comparisons and XPEL products.

Selected customer reviews use a manually controlled, scroll-snap carousel: three cards on desktop, two on tablet and one on mobile. Never autoplay; retain native scrolling and keyboard controls. Desktop disclosure menus open on hover and focus, while touch retains native tap behavior.

Installation walkthroughs keep one numbered sequence. Use `.site-step-layout` to pair each instruction and quality note with its exact still; short clips may open in an adjacent native disclosure to avoid showing the same frame twice. Below 760px, preserve text → still → optional clip order. The catalog includes this pattern.

Evergreen guide sections are mapped explicitly in `src/site/guide-media.mjs`. Each has a relevant photo/diagram or a recorded text-only reason. Article headings use level 2; embedded service explanations use level 3. The Work template shows four installation categories; the Guides template demonstrates alternating rows; the explanatory guide demonstrates bounded media. Use these templates and their catalog previews for future additions.

## Search and agent context
Public page metadata comes from `src/site/seo.mjs`; `src/site/agent-reference.mjs` builds the registry-backed llms.txt. Use the actual visible page image, content type and verified entity facts. Service pages describe offerings; guides use Article/VideoObject and galleries use ImageGallery. Keep brand/model proof links factual. No duplicate empty descriptions, fabricated ratings, dates or keyword-permutation pages. Run the SEO tests and rendered proof when changing page metadata or route intent.

When prose names an XPEL specification or technical data sheet, link that exact phrase to its verified manufacturer document. Guide section `sourceLinks` reference the article’s named sources; both illustrated and text-only sections render these as inline links opening a new tab with `noopener noreferrer`. Keep source-list links too.

Customer copy speaks to vehicle owners. Captions describe visible work, fit, finish or location; keep file origins, folder names, verification notes and approval status in internal records. Use direct service language ("We install…"), everyday pricing explanations and concrete next steps. Preserve original review text and photographer credits. Keep necessary preview-form and illustration disclosures clear and brief. Never turn missing evidence into a product, coverage or warranty claim. Any Q&A edit requires regenerating the digest from rendered pages, checking the existing Google Doc for edits/comments, syncing it and verifying the export before recording the new digest hash.
