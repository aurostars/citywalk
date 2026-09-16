# Final Review Fix Report

Date: 2026-09-16

## Scope

This wave fixes all actionable findings from `final-code-review.md` and `impeccable-finish-review.md` without redesigning the approved city-magazine direction.

## Delivered

- Persistence failures now render once at shell level for preferences, favorites, theme, join/leave, and guide saves while React keeps the session state.
- `createTeam` returns `{ id, persisted }` through the existing single-write `commitState` path.
- Team creation retains submitted values, distinguishes durable and session-only outcomes in-dialog, and requires explicit close.
- Activities expose structured `availableWeekdays` and `startTime` fields. Every route now has a common valid day in listed time order; the market route runs on Saturday.
- Team departure validation rejects dates outside the selected activity weekdays. Browser happy-path coverage uses Saturday.
- Detail navigation resets forward entries to the top. Home-origin returns use history navigation and restore Home scroll while modified-link semantics remain native.
- Valid nested teams, check-ins, and guides have an exact storage round-trip test. Browser flows reload before asserting each created entity.
- Mobile onboarding keeps the validation explanation visible at `375x667`.
- Mobile results expose `244px` of lead media above the fixed navigation at `390x844`, exceeding the `160px` assertion.
- The guide claim now says `本期示例活动`.
- A compact `示例数据` disclosure is visible in the shell across routes.
- The FORM contract and persisted surface brief use `user-approved:editorial-guide+progressive-home:2026-09-15`.

## TDD Evidence

Baseline:

- `npm run test:run`: 12 files, 93 tests passed.

Unit/component RED:

- Focused run: 9 expected failures and 75 passes.
- Failures covered the absent team persistence result, shell warning/disclosure, route-day invariant, retained team fields, session-only team result, and invalid weekday rejection.
- The exact nested-state round-trip passed immediately, confirming a coverage gap rather than a storage implementation defect.

Browser RED:

- Detail opened at `scrollY=947` instead of `0`.
- Mobile onboarding validation was hidden at `375x667`.
- Only `24.4px` of lead media was visible above navigation at `390x844`.

Focused GREEN:

- Unit/component: 7 files, 84 tests passed.
- Changed browser flows: 6 tests passed, including scroll restoration and all nested reloads.
- Small-phone regression rerun: 1 test passed after the bounded media-height correction.

## Final Verification

- `npm run test:run`: 12 files, 100 tests passed.
- Clean `npm run build`: passed; 4,996 modules transformed; no chunk-size warning.
- `npm run test:e2e`: 18 Chromium tests passed in 43.3 seconds.
- Responsive coverage: `375x667`, `390x844`, `768x1024`, and `1440x900`.
- Impeccable detector, run once after UI completion: `[]`.
- `git diff --check`: passed.
- Refreshed screenshots:
  - `.superpowers/sdd/2026-09-15-citywalk-frontend-implementation/screenshots/desktop-light-final.png`
  - `.superpowers/sdd/2026-09-15-citywalk-frontend-implementation/screenshots/desktop-dark-final.png`
  - `.superpowers/sdd/2026-09-15-citywalk-frontend-implementation/screenshots/mobile-light-final.png`
  - `.superpowers/sdd/2026-09-15-citywalk-frontend-implementation/screenshots/mobile-dark-final.png`

## External Limitation

The mandated image endpoint still returns a successful `1832x1832` raster containing `The image is generating... Please refresh page to preview.` The endpoint, intrinsic dimensions, and stable UI frames pass acceptance, but final Beijing photography remains externally unresolved. No alternate image source was introduced.

## Delivery Boundary

- Commit message: `fix: harden citywalk release flows`
- No nested agents or external reviewer CLIs were used.
- No merge, push, deployment, PR creation, or remote administration was performed.
