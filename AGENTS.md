## JACQUES interface work

For frontend, native UI, design-system, or UX work:

1. Use `$jacques`.
2. Read the nearest resolved `DESIGN.md`.
3. Run the repository jacques checks before completion.
4. Treat the presentation registry as authoritative.
5. Do not edit generated presentation files.
6. Do not expose raw application values to users.

Run `jacques inspect DESIGN.md` for repository-specific context.

Use `node scripts/build.mjs` and `node scripts/verify.mjs`. Run the explicit web proof at integration. The static HTML adapter has no JACQUES UI runner; do not claim adapter conformance. Read `design/rebuild-plan.md` for current scope.
