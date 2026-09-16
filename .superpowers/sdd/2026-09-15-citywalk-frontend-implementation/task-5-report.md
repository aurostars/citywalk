# Task 5 Report: Activity Detail and Favorites

Date: 2026-09-16

## Status

Implemented the activity detail route, persistent favorite controls, activity-scoped team and check-in links, unknown-ID recovery, and the HashRouter-safe skip action.

## Scope Delivered

- Registered `/activity/:activityId` under the existing application shell.
- Added a responsive activity detail page driven by `activities`, `weekendRoutes`, `weekendWeather`, and `useAppState()`.
- Rendered the generated fixture image, schedule, venue, price, duration, suitable party sizes, weather guidance, and route description.
- Derived weather guidance from the current weather fixture, each activity's `weatherKinds`, and its indoor or outdoor setting.
- Added a persistent favorite toggle to the detail page.
- Added a compact favorite toggle to activity cards using the same application state.
- Added links to `/teams?activity=<id>` and `/checkins?activity=<id>` without implementing those destination pages.
- Added an unknown-ID state with an explanation and a return link.
- Replaced the hash-based skip link with a native keyboard button that focuses `#main-content` without navigation.
- Preserved the existing cool-paper, charcoal, and lime editorial visual system with 8px media corners and Phosphor icons.

## Root Cause: Skip Action

`AppShell` used `<a href="#main-content">` while the production app uses `HashRouter`. The fragment is therefore the router location. Activating the link replaced the active route hash, such as `#/teams?activity=798-art-weekend`, with `#main-content`.

The fix uses a native `button` and a ref to the existing `<main id="main-content" tabIndex={-1}>`. Activation calls `focus()` directly, so keyboard context moves to main content while the route hash remains unchanged.

## TDD Evidence

### Baseline

Command:

```text
npm run test:run
```

Result before Task 5 changes:

```text
Test Files  6 passed (6)
Tests       68 passed (68)
Exit code   0
```

### RED

Tests were written before production changes:

- `src/features/activities/ActivityDetailPage.test.tsx`
- `src/features/home/ActivityCard.test.tsx`
- `src/components/AppShell.test.tsx`

Command:

```text
npm run test:run -- src/features/activities/ActivityDetailPage.test.tsx src/features/home/ActivityCard.test.tsx src/components/AppShell.test.tsx
```

Observed result:

```text
Test Files  3 failed (3)
Tests       5 failed (5)
Exit code   1
```

Expected failures were confirmed:

- React Router returned 404 because `/activity/:activityId` did not exist.
- Activity cards had no favorite button.
- The skip control had role `link` with `href="#main-content"`, not the required route-safe button behavior.

### GREEN

Focused command:

```text
npm run test:run -- src/features/activities/ActivityDetailPage.test.tsx src/features/home/ActivityCard.test.tsx src/components/AppShell.test.tsx
```

Focused result:

```text
Test Files  3 passed (3)
Tests       5 passed (5)
Exit code   0
```

Full unit command:

```text
npm run test:run
```

Full unit result:

```text
Test Files  9 passed (9)
Tests       73 passed (73)
Exit code   0
```

Build command:

```text
npm run build
```

Build result:

```text
TypeScript build passed
Vite transformed 4990 modules
Production bundle completed
Exit code 0
```

## Visual Verification

A bounded Playwright pass checked the detail route at 1440 by 1000 and 390 by 844.

- No horizontal overflow at either viewport.
- Desktop uses an asymmetric editorial hero and compact facts layout.
- Mobile collapses to a single column with full-width actions and bottom navigation clearance.
- Computed activity media radius is 8px.
- One initial desktop action-wrap issue was corrected by making favorite the full-width primary action and pairing the two destination links beneath it.

The image fixture endpoint returned its temporary "image is generating" raster during this verification. The application uses the required generated-image URL and retains `ImageWithFallback` handling for load failures.

## Self-Review

- All required activity facts are visible and sourced from fixtures.
- Favorite state changes immediately and persists to `citywalk:v1`.
- Card and detail favorites share `useAppState()` and remain synchronized.
- Team and check-in links carry the activity ID in the query string.
- Existing team and check-in placeholder pages were not expanded.
- Unknown activity IDs render product-specific recovery content.
- Skip action is keyboard-operable and preserves the current route hash.
- UI iconography uses only `@phosphor-icons/react`.
- Changed UI source contains no visible en dash or em dash characters.
- `git diff --check` passes.
- No external reviewer CLI or nested agent was used.
- Controller-owned untracked `README.md` and `.github/workflows/deploy.yml` were not modified or staged.

## Files

- Added `src/features/activities/ActivityDetailPage.tsx`
- Added `src/features/activities/ActivityDetailPage.test.tsx`
- Added `src/features/home/ActivityCard.test.tsx`
- Added `src/components/AppShell.test.tsx`
- Modified `src/features/home/ActivityCard.tsx`
- Modified `src/components/AppShell.tsx`
- Modified `src/app/routes.tsx`
- Modified `src/index.css`

## Commit

Requested commit message:

```text
feat: add activity details and favorites
```
