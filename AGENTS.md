## JACQUES interface work

For frontend, native UI, design-system, or UX work:

1. Use `$jacques`.
2. Read the nearest resolved `DESIGN.md`.
3. Run the repository jacques checks before completion.
4. Treat the presentation registry as authoritative.
5. Do not edit generated presentation files.
6. Do not expose raw application values to users.

Run `jacques inspect DESIGN.md` for repository-specific context.

## Production publication and search discovery

Use `npm run publish:production` for every authorized production publication, from the fetched, merged main revision. It rebuilds sitemap, llms.txt and page JSON-LD, verifies the deployed artifacts, submits the sitemap through the existing Search Console login, and sends changed/new/retired canonical URLs to Bing IndexNow. Never notify from a build, PR or noindex preview. Use `npm run notify:production` to retry a notification failure without redeploying; use `npm run publish:production -- --resume` after a deploy failure with the prepared build intact. Preserve required release checks and content approvals. See `server/README.md` for credentials and recovery. A notification receipt is not proof of indexing, ranking or revenue; Google’s individual Request Indexing UI remains a bounded exception for priority URLs.

Use `node scripts/build.mjs` and `node scripts/verify.mjs`. Run the explicit web proof at integration. The static HTML adapter has no JACQUES UI runner; do not claim adapter conformance. Read `design/rebuild-plan.md` for current scope.
