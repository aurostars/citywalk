# Task 8 Report

## Delivered

- Replaced the guide placeholder with an image-led editorial list using each guide's related activity image.
- Added activity-type filters with a visible and accessible `全部` state.
- Added saved toggles backed by `toggleGuideSaved` and local storage persistence.
- Added a labeled modal composer for title, related activity, summary, and audience.
- Derived the published guide type from the selected activity, placed local entries first, and marked them `我的分享`.
- Kept submitted values visible after submission and required explicit `完成` before returning to the list.
- Reserved `攻略已发布` for confirmed local storage writes.
- Added an in-dialog `攻略仅保留在本次会话` warning for failed writes while retaining values and preventing resubmission.
- Extended `publishGuide` to return `{ id, persisted }` from the existing single-write AppState commit boundary.
- Added required-field errors, first-invalid-field focus, focus trapping, Escape close, success focus, and opener focus restoration.

## Baseline

Command:

```bash
npm run test:run
```

Exit: `0`. Vitest reported `11 passed` files and `86 passed` tests before Task 8 changes.

## RED Evidence

Initial focused command:

```bash
npm run test:run -- src/features/guides/GuidesPage.test.tsx src/app/app-state.test.tsx
```

Exit: `1`. Vitest reported `2 failed` files, `6 failed` tests, and `12 passed` tests. All five guide-page tests failed because `/guides` still rendered the placeholder. Representative failures could not find the `按活动类型筛选` group, guide save controls, or `写攻略` button. The AppState contract test failed with `expected '' to match /^guide-/` because `publishGuide` still returned a string.

Throwing-storage mutation command:

```bash
npm run test:run -- src/app/app-state.test.tsx -t "reports a session-only guide after one failed persistence attempt"
```

Exit: `1` against the former string-return behavior. Vitest reported `1 failed` test and `12 skipped`; the regression failed at `expected '' to match /^guide-/`. This proves the test detects loss of the structured publication result on the failed-write path.

## GREEN Evidence

Focused command:

```bash
npm run test:run -- src/features/guides/GuidesPage.test.tsx src/app/app-state.test.tsx
```

Exit: `0`. Vitest reported `2 passed` files and `18 passed` tests.

Full unit command:

```bash
npm run test:run
```

Exit: `0`. Vitest reported `12 passed` files and `92 passed` tests.

Build command:

```bash
npm run build
```

Exit: `0`. TypeScript and Vite completed successfully; Vite transformed `4996` modules and built in `2.70s`. The existing non-blocking warning for a JavaScript chunk larger than 500 kB remains deferred to Task 9 route splitting.

Diff command:

```bash
git diff --check
```

Exit: `0` with no output.

## Self-review

- Browser checks at `1440x1000` and `390x844` found body scroll widths equal to viewport widths, with no horizontal page overflow.
- The mobile dialog stayed within the viewport from `14px` to `376px`, leaving `14px` clearance on both sides.
- All four guide rows rendered related generated activity image URLs; loaded images reported `1832px` natural width and `8px` corners.
- Opening focused `guide-title`, confirmed publication focused `攻略已发布`, and `完成` restored focus to `写攻略`.
- The completed local guide appeared first and contained `我的分享`.
- The mobile page retained `96px` bottom padding above fixed navigation, and filters remained horizontally scrollable without widening the page.
- Static scans found zero visible em dash or en dash characters in Task 8 production files.
- Task 8 uses Phosphor icons only, 8px surfaces and media, and pills only for filters and status.
- The guide list is a flat article composition with no nested card containers.
- `README.md` and `.github/workflows/deploy.yml` were neither modified nor staged.

## Fix Round 1

### Delivered

- Publishing now selects the new guide's activity type before the composer closes, so a guide created under a different active filter is visible first after `完成`.
- The filter update applies to both confirmed local storage writes and session-only outcomes.
- After either submission outcome, Escape is ignored and the header close action is absent; `完成` is the only exit.
- Completion still restores focus to `写攻略`.

### RED Evidence

Cross-filter command:

```bash
npm run test:run -- src/features/guides/GuidesPage.test.tsx -t "shows a guide published under another type first after completion"
```

Exit: `1`. Vitest reported `1 failed` test and `5 skipped`; the `展览` filter had `aria-pressed="false"` instead of `"true"`.

Post-submit exit command:

```bash
npm run test:run -- src/features/guides/GuidesPage.test.tsx -t "publishes a guide first|keeps a failed publication"
```

Exit: `1`. Vitest reported `2 failed` tests and `4 skipped`; both persistent and session-only flows failed because Escape removed the submitted dialog.

Session-only filter mutation command:

```bash
npm run test:run -- src/features/guides/GuidesPage.test.tsx -t "keeps a failed publication"
```

Exit: `1` with a temporary mutation that updated the filter only when `result.persisted` was true. Vitest reported `1 failed` test and `5 skipped`; the session-only flow caught `aria-pressed="false"` on `展览`. The unconditional filter update was restored before verification.

### GREEN Evidence

Focused command:

```bash
npm run test:run -- src/features/guides/GuidesPage.test.tsx src/app/app-state.test.tsx
```

Exit: `0`. Vitest reported `2 passed` files and `19 passed` tests.

Full unit command:

```bash
npm run test:run
```

Exit: `0`. Vitest reported `12 passed` files and `93 passed` tests.

Build command:

```bash
npm run build
```

Exit: `0`. TypeScript and Vite completed successfully; Vite transformed `4996` modules and built in `2.47s`. Output was `533.91 kB` JavaScript (`164.59 kB` gzip). The existing non-blocking chunk warning remains deferred; route splitting was not changed in this task.

Diff command:

```bash
git diff --check
```

Exit: `0` with no output.
