# Citywalk Premium Budgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit premium and unlimited budget choices, a new entertainment interest, and four high-budget Beijing weekend activities with complete routes, supporting content, licensed images, persistence, and browser coverage.

**Architecture:** Centralize all price-range logic in a pure `matchesBudget()` function shared by activity and route recommendation. Extend the existing fixture-driven domain without adding APIs or backend state. Keep the current progressive homepage and static-image pipeline, adding exact Commons provenance for each new WebP.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 5, Testing Library, Playwright, Sharp.

## Global Constraints

- Budget choices are `free`, `under-100`, `100-300`, `above-300`, and `any`.
- `free` matches price 0; `under-100` matches price <=100; `100-300` matches 100<price<=300; `above-300` matches price>300; `any` matches every non-negative price.
- “一键查看相近活动” may relax activity types but must never relax budget.
- Add `entertainment` with UI label “去玩乐” and summary label “玩乐”.
- All prices, schedules, teams, and guides remain clearly synthetic prototype data.
- Preserve the current city-magazine design, 8px geometry, 44px touch targets, Hash Router, and local-only persistence.
- Four new images must be distinct 1600x1200 WebP files, each <=450 KB, with exact provenance in `public/images/SOURCES.md`.
- The 390x844 first viewport must retain all preference choices, validation text, and the primary action without horizontal overflow.

---

### Task 1: Shared Budget Policy and Persisted Domain

**Files:**
- Create: `src/features/recommendations/budget.ts`
- Create: `src/features/recommendations/budget.test.ts`
- Modify: `src/types/domain.ts`
- Modify: `src/app/storage.ts`
- Modify: `src/app/storage.test.ts`
- Modify: `src/features/recommendations/recommend.ts`
- Modify: `src/features/recommendations/recommend.test.ts`

**Interfaces:**
- Produces: `matchesBudget(price: number, budget: Budget): boolean`.
- Produces: `Budget = "free" | "under-100" | "100-300" | "above-300" | "any"`.
- Produces: `ActivityType` including `"entertainment"`.
- Consumers: activity recommendation, route selection, storage validation, and UI labels.

- [ ] **Step 1: Write failing boundary and persistence tests**

Create table-driven tests with literal expectations:

```ts
it.each([
  ["free", 0, true],
  ["free", 1, false],
  ["under-100", 0, true],
  ["under-100", 100, true],
  ["under-100", 101, false],
  ["100-300", 100, false],
  ["100-300", 101, true],
  ["100-300", 300, true],
  ["100-300", 301, false],
  ["above-300", 300, false],
  ["above-300", 301, true],
  ["any", 0, true],
  ["any", 528, true],
] as const)("matches %s against %i", (budget, price, expected) => {
  expect(matchesBudget(price, budget)).toBe(expected);
});
```

Extend storage tests with preferences containing:

```ts
{
  activityTypes: ["entertainment"],
  budget: "above-300",
  partySize: "pair",
}
```

and a separate `"any"` budget case.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm run test:run -- src/features/recommendations/budget.test.ts src/app/storage.test.ts src/features/recommendations/recommend.test.ts --maxWorkers=1
```

Expected: FAIL because new union members and `matchesBudget` do not exist.

- [ ] **Step 3: Implement the shared policy**

Implement:

```ts
export function matchesBudget(price: number, budget: Budget): boolean {
  if (budget === "any") return price >= 0;
  if (budget === "free") return price === 0;
  if (budget === "under-100") return price >= 0 && price <= 100;
  if (budget === "100-300") return price > 100 && price <= 300;
  return price > 300;
}
```

Extend domain unions and storage validation sets. Replace `budgetCeilings` in `recommend.ts` with `matchesBudget`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command.

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/domain.ts src/app/storage.ts src/app/storage.test.ts src/features/recommendations
git commit -m "feat: add premium budget policy"
```

### Task 2: Premium Fixtures and Licensed Images

**Files:**
- Modify: `src/data/activities.ts`
- Modify: `src/data/routes.ts`
- Modify: `src/data/teams.ts`
- Modify: `src/data/guides.ts`
- Modify: `src/data/imageAssets.test.ts`
- Modify: `public/images/SOURCES.md`
- Create: `public/images/activities/universal-beijing-day.webp`
- Create: `public/images/activities/tianqiao-musical-night.webp`
- Create: `public/images/activities/indoor-ski-weekend.webp`
- Create: `public/images/activities/immersive-theatre-weekend.webp`

**Interfaces:**
- Consumes: `entertainment`, new `Budget` values, and existing activity fixture shape.
- Produces: four new activity IDs and route `west-city-stage-day`.
- Produces: team `team-universal-sunday` and guide `guide-tianqiao-musical`.

- [ ] **Step 1: Extend failing fixture and asset tests**

Assert the four IDs, prices, and types:

```ts
expect(
  activities
    .filter(({ id }) =>
      [
        "universal-beijing-day",
        "tianqiao-musical-night",
        "indoor-ski-weekend",
        "immersive-theatre-weekend",
      ].includes(id),
    )
    .map(({ id, price, type }) => ({ id, price, type })),
).toEqual([
  { id: "universal-beijing-day", price: 528, type: "entertainment" },
  { id: "tianqiao-musical-night", price: 480, type: "show" },
  { id: "indoor-ski-weekend", price: 420, type: "entertainment" },
  { id: "immersive-theatre-weekend", price: 380, type: "entertainment" },
]);
```

Add all four asset paths to `imageAssets.test.ts`. Assert the new route has total price 660 and the new team/guide point to known activities.

- [ ] **Step 2: Run fixture tests and verify RED**

Run:

```bash
npm run test:run -- src/data/imageAssets.test.ts src/features/recommendations/recommend.test.ts --maxWorkers=1
```

Expected: FAIL because fixtures and image files are missing.

- [ ] **Step 3: Add exact activity and related fixtures**

Append the four activities exactly as specified in the approved design:

```ts
{
  id: "universal-beijing-day",
  title: "北京环球度假区一日游",
  type: "entertainment",
  price: 528,
  district: "通州区",
  venue: "北京环球度假区",
  indoor: false,
  suitablePartySizes: ["solo", "pair", "group"],
  weatherKinds: ["sunny", "cloudy"],
  availableWeekdays: ["saturday", "sunday"],
  startTime: "09:30",
  schedule: "周六至周日 09:30-19:30",
  durationMinutes: 600,
  imageUrl: assetPath("images/activities/universal-beijing-day.webp"),
  imageAlt: "北京环球度假区过山车与主题园区",
  summary: "把整天留给主题园区，按体力安排项目、演出和休息时段。",
  editorOrder: 9,
}
```

Use the approved values for the other three IDs, with editor orders 10-12. Add `west-city-stage-day`, `team-universal-sunday`, and `guide-tianqiao-musical`.

- [ ] **Step 4: Acquire and normalize the four licensed sources**

Use these exact source files:

| Asset | Commons source | Creator | License |
| --- | --- | --- | --- |
| Universal | `File:Universal Beijing Resort 3.jpg` | Hhhh2 | CC BY-SA 4.0 |
| Musical | `File:Auditorium of Beijing Tianqiao Performing Arts Center (20200115191246).jpg` | N509FZ | CC BY-SA 4.0 |
| Indoor ski | `File:Ski slopes inside X-Scape - geograph.org.uk - 2950264.jpg` | John Firth | CC BY-SA 2.0 |
| Immersive theatre | `File:Captured, immersive installation by Hanna Haaslahti, 2021.jpg` | Tomumaja | CC BY-SA 4.0 |

Normalize each with:

```js
await sharp(input)
  .rotate()
  .resize(1600, 1200, { fit: "cover", position: "attention" })
  .webp({ quality: 78, effort: 6 })
  .toFile(output);
```

Add file page, original URL, creator, license URL, and modification notice to `SOURCES.md`.

- [ ] **Step 5: Run fixture and asset tests**

Run the Step 2 command.

Expected: PASS, with 13 unique image files.

- [ ] **Step 6: Commit**

```bash
git add src/data public/images
git commit -m "feat: add premium weekend activities"
```

### Task 3: Preference UI and Route Integration

**Files:**
- Modify: `src/features/home/PreferencePanel.tsx`
- Modify: `src/features/home/HomePage.tsx`
- Modify: `src/features/home/HomePage.test.tsx`
- Modify: `src/features/home/RecommendationResults.tsx`
- Modify: `src/features/guides/GuidesPage.tsx`
- Modify: `src/features/activities/ActivityDetailPage.test.tsx`
- Modify: `src/features/guides/GuidesPage.test.tsx`
- Modify: `src/features/teams/TeamsPage.test.tsx`
- Modify: `src/index.css`
- Modify: `e2e/citywalk.spec.ts`

**Interfaces:**
- Consumes: `matchesBudget`, new domain values, and new fixtures.
- Produces: five activity options, five budget options, and premium route selection.

- [ ] **Step 1: Write failing component and route tests**

Assert the preference panel exposes:

```ts
expect(screen.getByRole("checkbox", { name: "去玩乐" })).toBeVisible();
expect(screen.getByRole("radio", { name: "300 元以上" })).toBeVisible();
expect(screen.getByRole("radio", { name: "不限" })).toBeVisible();
```

Add result-flow tests:

```ts
await user.click(screen.getByRole("checkbox", { name: "去玩乐" }));
await user.click(screen.getByRole("radio", { name: "300 元以上" }));
await user.click(screen.getByRole("button", { name: "生成周末计划" }));
expect(await screen.findByText("北京环球度假区一日游")).toBeVisible();
```

Add a route test proving `west-city-stage-day` is selected for `show + above-300` under cloudy weather, and an `"any"` test proving both 0 and 528 prices survive budget filtering before score sorting.

Add browser tests that:

1. Select “去玩乐” and “300 元以上”, generate, and assert “北京环球度假区一日游” appears.
2. Select “看演出” and “不限”, generate, and assert recommendation images decode without generation endpoint requests.
3. At 390x844, assert the five activity choices, five budget choices, validation copy, and submit button are inside the first viewport.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm run test:run -- src/features/home/HomePage.test.tsx src/features/recommendations/recommend.test.ts src/features/activities/ActivityDetailPage.test.tsx src/features/guides/GuidesPage.test.tsx src/features/teams/TeamsPage.test.tsx --maxWorkers=1
npm run test:e2e -- --grep "premium|unlimited|small-phone" --workers=1
```

Expected: FAIL on missing labels and duplicated route budget logic.

- [ ] **Step 3: Implement UI labels and shared route matching**

Add:

```ts
{ label: "去玩乐", value: "entertainment" }
{ label: "300 元以上", value: "above-300" }
{ label: "不限", value: "any" }
```

Extend `activityTypeLabels` and `budgetLabels`. Add `entertainment` to `allActivityTypes`. Replace `RecommendationResults.tsx` budget ceilings with `matchesBudget(route.totalPrice, preferences.budget)`.

Add the “玩乐” label and filter to `GuidesPage.tsx`. Change the budget helper copy from “活动花费上限” to “活动花费范围”.

Keep 44px controls. Add only the narrow mobile spacing adjustment needed to keep the 390x844 action visible; do not change desktop composition.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run both Step 2 commands.

Expected: all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features src/index.css e2e/citywalk.spec.ts
git commit -m "feat: expose premium budget choices"
```

### Task 4: Browser Acceptance, Full Verification, and Deployment

**Interfaces:**
- Consumes: completed preference controls, premium fixtures, and 13-image static pack.
- Produces: deployment evidence for premium, unlimited, and mobile flows.

- [ ] **Step 1: Run complete verification**

Run:

```bash
npm run test:run -- --maxWorkers=1
npm run build
npm run test:e2e -- --workers=1
node /Users/bytedance/.trae-cn/skills/impeccable/scripts/detect.mjs --json src/features/home/PreferencePanel.tsx src/features/home/HomePage.tsx src/features/home/RecommendationResults.tsx src/index.css
```

Expected: all tests pass, build succeeds, and the detector returns `[]`.

- [ ] **Step 2: Inspect desktop and mobile**

Capture 1440x900 and 390x844 screenshots for onboarding and premium results. Verify no blank images, clipped labels, overlapping text, or horizontal overflow.

- [ ] **Step 3: Merge, push, and verify Pages**

After final review, fast-forward `main`, rerun the complete suite on merged `main`, push, wait for `deploy.yml`, and compare at least one new online WebP SHA-256 with the repository file.
