# Task 9 Report

Date: 2026-09-16

## Status

Task 9 is implemented and verified. No deployment, push, or pull request was performed.

Requirements were taken from:

- `.superpowers/sdd/2026-09-15-citywalk-frontend-implementation/task-9-brief.md`
- `PRODUCT.md`
- `.impeccable/surfaces/src-features-home-homepage-tsx.md`
- `docs/superpowers/specs/2026-09-15-citywalk-homepage-design.md`

The controller-owned untracked `README.md` and `.github/workflows/deploy.yml` drafts were reviewed and corrected in place.

## Delivered

### Browser acceptance

- Added `playwright.config.ts` against the production preview at `/citywalk/`.
- Added 15 Chromium scenarios in `e2e/citywalk.spec.ts`.
- Every scenario clears `localStorage` before its own flow.
- Covered fresh onboarding and persisted reload, preference editing, detail favorite persistence, team query preselection/create/leave, check-in query/create/success confirmation, guide filter/save/publish/success confirmation, theme persistence, mobile navigation, unknown activity recovery, reduced motion, and image integrity.
- Checked document-level horizontal overflow at `390x844`, `768x1024`, and `1440x900`.
- Checked all visible interactive controls across mobile core pages and creation dialogs against a 44 px minimum target.

### Accessibility and responsive fixes

- Increased undersized mobile and compact action targets to at least 44 px.
- Preserved keyboard focus styles, dialog focus behavior, reduced-motion behavior, light/dark theming, and the fixed mobile navigation.
- Added a semantic route-loading status with stable viewport height.

### Route loading and build

- Preserved `HashRouter`.
- Lazy-loaded Home, Activity Detail, Teams, Check-ins, and Guides at route level.
- Added an injectable route-element factory so component tests continue to exercise real page components without coupling synchronous component assertions to production chunk timing.
- Reduced the initial minified JavaScript chunk from 533.91 kB to 293.05 kB.
- The final build has no chunk-size warning.
- `dist/index.html` references `/citywalk/assets/...`.

### Deployment workflow

- Uses Node.js 24 and `npm ci`.
- Gates deployment on `npm run test:run`, `npm run build`, Chromium installation, and `npm run test:e2e`.
- Runs verification for pull requests and main while uploading/deploying Pages artifacts only from `main`.
- Keeps repository permissions read-only by default; Pages and OIDC write permissions exist only on the deploy job.
- Uploads unit, build, install, E2E, Playwright report, trace, screenshot, and video diagnostics on failures.
- Uses concurrency cancellation and a bounded verification timeout.

### README

- Documents local commands and the production-preview dependency of E2E.
- States that activity, weather, route, team, and guide content is synthetic.
- States that user changes are browser-local and disappear when site data is cleared.
- States that there is no account, server sync, live weather, maps, ticketing, payment, or check-in photo persistence.
- Documents the required external image endpoint and its network dependency.
- Notes that the provider may currently return a “The image is generating” raster and that the app does not swap to another source.

## TDD Evidence

- Baseline build RED: one 533.91 kB initial chunk with Vite's >500 kB warning.
- Route lazy-loading GREEN: 293.05 kB initial chunk with no warning.
- Touch-target RED: Playwright reported 34-42 px controls across onboarding, results, detail, teams, check-ins, guides, and dialogs.
- Touch-target GREEN: the same browser assertion passes across every covered mobile surface.
- The initial focused seven-scenario E2E run found no pre-existing workflow or overflow regression, so no unrelated behavior was changed.
- A post-lazy-loading unit failure identified test-runner collection and synchronous test-harness assumptions. Vitest now excludes `e2e/**`, component tests use eager real route elements, and the production-app route test awaits the lazy page.

## Visual QA

One initial screenshot round and one confirmation round were performed. Final ignored screenshots:

- `screenshots/desktop-light-final.png` at `1440x900`
- `screenshots/desktop-dark-final.png` at `1440x900`
- `screenshots/mobile-light-final.png` at `390x844`
- `screenshots/mobile-dark-final.png` at `390x844`

The confirmation round showed consistent light/dark hierarchy, no clipping, and stable mobile navigation. The external provider returned its generating raster in all reviewed captures; image elements still had nonzero natural dimensions, explicit intrinsic dimensions, stable rendered frames, and the required endpoint.

## Final Verification

- `npm run test:run`: 12 files, 93 tests passed; clean output.
- `npm run build`: passed; 4996 modules transformed; no >500 kB warning.
- `npm run test:e2e`: 15 tests passed in 28.3 seconds.
- Image acceptance: required endpoint, nonzero natural dimensions, explicit width/height, and unchanged frames after 500 ms.
- Responsive acceptance: no horizontal overflow at all three required viewports.
- Reduced-motion acceptance: no decorative CSS transition and immediate result state.
- Impeccable detector: `[]`.
- Taste preflight scans: no visible en/em dashes, radial gradients, decorative blur, oversized type, or thick side-border patterns in changed UI targets.
- Workflow YAML parse: passed.
- `git diff --check`: passed.

## Delivery Boundary

The intended commit message is `test: verify responsive flows and Pages deployment`. Deployment and push remain intentionally unperformed.

## Fix Round 1

Date: 2026-09-16

### Corrections

- README now names the one-time **Settings > Pages > Build and deployment > Source: GitHub Actions** prerequisite. The workflow remains unchanged with read-only default permissions and job-scoped Pages/OIDC writes.
- Overflow acceptance now waits for each lazy route's heading and verifies rendered Home onboarding/results, Activity Detail, Teams, Check-ins, Guides, and all three open creation dialogs at `390x844`, `768x1024`, and `1440x900`. Measurements cover the document, each page/dialog surface, and its rendered direct children; the route fallback must be absent.
- Reduced-motion acceptance selects preferences and clicks directly, records browser `performance.now()` at the click and rendered-result mutations, and requires completion under 300 ms. There are no sleep-based waits.
- Image acceptance fetches and holds the required 798 endpoint response, verifies a nonzero reserved frame while the image is incomplete with zero natural dimensions, releases the response, and compares the loaded frame. Existing required-endpoint, explicit width/height, and nonzero natural-dimension assertions remain.
- The delayed-image test exposed a real defect: the lead image changed from `729.828x547.359` before release to `729.828x729.828` after the provider's square generating raster loaded. `.lead-activity-image` now enforces the declared 4:3 ratio; no other app behavior changed.

### RED Evidence

- The previous focused overflow/reduced-motion/image tests all passed (`5 passed in 11.1s`), confirming the review's false-green baseline.
- Delaying the Teams chunk for 12 seconds made the new `390x844` overflow scenario fail at the `一起出发` heading after 10 seconds instead of measuring `页面加载中`.
- Forcing the normal 400 ms generation delay under reduced motion failed with `Received: 407`, above the strict `< 300` ms bound.
- Holding the 798 response exposed the real pre-load/post-load frame mismatch above. A load-event resize mutation also failed the same frame equality assertion.

### GREEN Evidence

- Focused overflow, reduced-motion, and image acceptance: `5 passed in 18.2s`.
- Reduced-motion stability repeat: `10 passed in 15.3s`.
- Full Chromium E2E: `15 passed in 37.4s`.
- Full Vitest: `12` files, `93` tests passed in `11.88s`.
- Production build: 4996 modules transformed, no chunk warning; initial JavaScript remains `293.05 kB`.
- The four ignored final screenshots were refreshed because the real 4:3 frame fix changes the rendered lead-image height.
- No GitHub API, deployment, push, or other remote administration call was performed.
