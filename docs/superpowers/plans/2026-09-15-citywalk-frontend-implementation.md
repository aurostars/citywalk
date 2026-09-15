# Citywalk Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a polished Beijing weekend discovery prototype with preference-based recommendations, teams, check-ins, guides, and durable browser state.

**Architecture:** Use a Vite React single-page application with hash routing for GitHub Pages compatibility. Keep recommendation logic and persistence as pure, tested modules; expose browser state through one app provider; compose each route from focused feature components.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS v4, Motion, Phosphor Icons, React Router, Vitest, Testing Library, Playwright, GitHub Actions

## Global Constraints

- Product name is `城迹`; the first release contains Beijing data only.
- First visit asks only for one or more activity types and one budget range.
- Recommendation ranking must use activity type, budget, weather suitability, and party size.
- Return visits restore preferences and results from `localStorage`.
- Teams, favorites, check-ins, and user-created guides are interactive and persisted locally.
- Check-in photos are not persisted in the first release.
- Default visual language is a cool-gray editorial surface with charcoal text and one lime accent.
- Use one 8px radius system for cards and media; pill radii are reserved for selection controls.
- Use Phosphor Icons only; do not draw icon SVG paths manually.
- Every web image uses `https://copilot-cn.bytedance.net/api/ide/v1/text_to_image`.
- Support system light/dark preferences, a manual theme override, and reduced motion.
- Use generated Beijing activity images with explicit dimensions and descriptive alt text.
- No em-dash or en-dash characters in visible copy.
- GitHub Pages must work from the `/citywalk/` repository base path.

---

## File Structure

```text
citywalk/
├── .github/workflows/deploy.yml
├── e2e/citywalk.spec.ts
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── AppState.tsx
│   │   ├── app-state.test.tsx
│   │   ├── routes.tsx
│   │   ├── storage.test.ts
│   │   └── storage.ts
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── BottomNav.tsx
│   │   ├── ImageWithFallback.tsx
│   │   └── ThemeToggle.tsx
│   ├── data/
│   │   ├── activities.ts
│   │   ├── guides.ts
│   │   ├── routes.ts
│   │   ├── teams.ts
│   │   └── weather.ts
│   ├── features/
│   │   ├── activities/ActivityDetailPage.tsx
│   │   ├── checkins/CheckinForm.tsx
│   │   ├── checkins/CheckinsPage.test.tsx
│   │   ├── checkins/CheckinsPage.tsx
│   │   ├── guides/GuideComposer.tsx
│   │   ├── guides/GuidesPage.test.tsx
│   │   ├── guides/GuidesPage.tsx
│   │   ├── home/ActivityCard.tsx
│   │   ├── home/HomePage.test.tsx
│   │   ├── home/HomePage.tsx
│   │   ├── home/PreferencePanel.tsx
│   │   ├── home/RecommendationResults.tsx
│   │   ├── home/WeatherSummary.tsx
│   │   ├── recommendations/recommend.test.ts
│   │   ├── recommendations/recommend.ts
│   │   ├── teams/TeamForm.tsx
│   │   ├── teams/TeamsPage.test.tsx
│   │   └── teams/TeamsPage.tsx
│   ├── test/renderApp.tsx
│   ├── test/setup.ts
│   ├── types/domain.ts
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

## Shared Interfaces

```ts
export type ActivityType = "exhibition" | "market" | "show" | "hike";
export type Budget = "free" | "under-100" | "100-300";
export type PartySize = "solo" | "pair" | "group";
export type WeatherKind = "sunny" | "cloudy" | "rain";

export interface Preferences {
  activityTypes: ActivityType[];
  budget: Budget;
  partySize: PartySize;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  price: number;
  district: string;
  venue: string;
  indoor: boolean;
  suitablePartySizes: PartySize[];
  weatherKinds: WeatherKind[];
  schedule: string;
  durationMinutes: number;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  editorOrder: number;
}

export interface WeekendWeather {
  kind: WeatherKind;
  temperature: string;
  summary: string;
}

export interface Team {
  id: string;
  activityId: string;
  leader: string;
  departureTime: string;
  meetingPoint: string;
  capacity: number;
  memberCount: number;
  note: string;
  joined?: boolean;
  createdByUser?: boolean;
}

export interface Checkin {
  id: string;
  activityId: string;
  date: string;
  partySize: PartySize;
  rating: number;
  note: string;
}

export interface Guide {
  id: string;
  title: string;
  activityId: string;
  activityType: ActivityType;
  summary: string;
  audience: string;
  author: string;
  saved?: boolean;
  createdByUser?: boolean;
}
```

### Task 1: Application Foundation and Shell

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/routes.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/ThemeToggle.tsx`
- Create: `src/index.css`
- Create: `src/test/setup.ts`

**Interfaces:**
- Produces: a runnable Vite app, `HashRouter` route shell, global design tokens, and Vitest setup.
- Consumes: none.

- [ ] **Step 1: Add the project and test configuration**

Create scripts for `dev`, `build`, `preview`, `test`, `test:run`, and `test:e2e`. Configure Vite with `base: "/citywalk/"`, React, Tailwind v4, jsdom, and `src/test/setup.ts`.

```ts
// vite.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/citywalk/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install react react-dom react-router-dom motion @phosphor-icons/react
npm install -D vite typescript @vitejs/plugin-react @tailwindcss/vite tailwindcss vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @playwright/test
```

Expected: `npm install` exits with status 0 and creates `package-lock.json`.

- [ ] **Step 3: Write the shell render test**

Create `src/app/app-state.test.tsx` initially with a smoke assertion:

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the 城迹 navigation", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: "城迹" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "推荐" })).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the test and verify failure**

Run: `npm run test:run -- src/app/app-state.test.tsx`

Expected: FAIL because `App` and the route shell do not exist.

- [ ] **Step 5: Implement the shell**

Build `AppShell` with a one-line desktop header, route outlet, mobile bottom navigation, theme button, semantic landmarks, and skip link. Define CSS variables for light and dark modes and use the lime accent consistently.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm run test:run -- src/app/app-state.test.tsx
npm run build
```

Expected: both commands pass.

Commit:

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json index.html src
git commit -m "feat: scaffold citywalk application shell"
```

### Task 2: Domain Data and Recommendation Engine

**Files:**
- Create: `src/types/domain.ts`
- Create: `src/data/activities.ts`
- Create: `src/data/routes.ts`
- Create: `src/data/weather.ts`
- Create: `src/data/teams.ts`
- Create: `src/data/guides.ts`
- Create: `src/features/recommendations/recommend.ts`
- Test: `src/features/recommendations/recommend.test.ts`

**Interfaces:**
- Produces: `recommendActivities(activities, preferences, weather): Activity[]` and typed Beijing fixtures.
- Consumes: shared domain interfaces.

- [ ] **Step 1: Define fixtures and failing recommendation tests**

Use at least eight activities covering 798, 鼓楼, 亮马河, 国家大剧院, 潘家园, 首钢园, 香山, and 温榆河. Ensure every category, budget band, weather type, and party size has coverage.

```ts
it("prioritizes matching indoor activities on rainy weekends", () => {
  const result = recommendActivities(activities, {
    activityTypes: ["exhibition"],
    budget: "under-100",
    partySize: "pair",
  }, rainyWeekend);

  expect(result[0]).toMatchObject({
    type: "exhibition",
    indoor: true,
  });
  expect(result[0].price).toBeLessThanOrEqual(100);
});

it("returns an empty list when strict filters have no match", () => {
  expect(recommendActivities(impossibleFixtures, strictPreferences, sunnyWeekend)).toEqual([]);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/recommendations/recommend.test.ts`

Expected: FAIL because domain fixtures and `recommendActivities` do not exist.

- [ ] **Step 3: Implement deterministic scoring**

Filter activities outside the budget, then score type match, weather suitability, and party-size suitability. Sort by descending score, then ascending `editorOrder`.

```ts
export function recommendActivities(
  activities: Activity[],
  preferences: Preferences,
  weather: WeekendWeather,
): Activity[] {
  return activities
    .filter((activity) => isWithinBudget(activity.price, preferences.budget))
    .map((activity) => ({
      activity,
      score:
        (preferences.activityTypes.includes(activity.type) ? 4 : 0) +
        (activity.weatherKinds.includes(weather.kind) ? 2 : 0) +
        (activity.suitablePartySizes.includes(preferences.partySize) ? 1 : 0),
    }))
    .filter(({ score }) => score >= 5)
    .sort((a, b) => b.score - a.score || a.activity.editorOrder - b.activity.editorOrder)
    .map(({ activity }) => activity);
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/recommendations/recommend.test.ts`

Expected: all recommendation tests pass.

Commit:

```bash
git add src/types src/data src/features/recommendations
git commit -m "feat: add Beijing activity recommendation model"
```

### Task 3: Persistent Application State

**Files:**
- Create: `src/app/storage.ts`
- Create: `src/app/storage.test.ts`
- Create: `src/app/AppState.tsx`
- Modify: `src/app/App.tsx`
- Create: `src/test/renderApp.tsx`
- Test: `src/app/app-state.test.tsx`

**Interfaces:**
- Produces: `useAppState()`, `loadState(storage)`, `saveState(storage, state)`, and `renderApp(path, initialState?)`.
- Consumes: `Preferences`, `Team`, `Checkin`, and `Guide`.

- [ ] **Step 1: Write persistence failure tests**

```ts
it("falls back when stored JSON is corrupt", () => {
  localStorage.setItem("citywalk:v1", "{");
  expect(loadState(localStorage)).toEqual(defaultAppState);
});

it("restores completed onboarding and preferences", () => {
  saveState(localStorage, completedState);
  expect(loadState(localStorage).preferences).toEqual(completedState.preferences);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/app/storage.test.ts src/app/app-state.test.tsx`

Expected: FAIL because storage and provider APIs do not exist.

- [ ] **Step 3: Implement storage and provider**

Use the key `citywalk:v1`. Wrap JSON parsing and writes in `try/catch`. Keep unsaved state in React when browser storage is unavailable and expose a non-blocking persistence warning.

Provider actions:

```ts
type AppActions = {
  savePreferences: (preferences: Preferences) => void;
  toggleFavorite: (activityId: string) => void;
  joinTeam: (teamId: string) => void;
  leaveTeam: (teamId: string) => void;
  createTeam: (team: Omit<Team, "id" | "memberCount" | "createdByUser">) => string;
  addCheckin: (checkin: Omit<Checkin, "id">) => string;
  publishGuide: (guide: Omit<Guide, "id" | "author" | "createdByUser">) => string;
  toggleGuideSaved: (guideId: string) => void;
  setTheme: (theme: "system" | "light" | "dark") => void;
};
```

Create a shared route-aware test renderer:

```tsx
export function renderApp(path = "/", initialState = defaultAppState) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <AppStateProvider initialState={initialState}>
      <RouterProvider router={router} />
    </AppStateProvider>,
  );
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/app/storage.test.ts src/app/app-state.test.tsx`

Expected: persistence and provider tests pass.

Commit:

```bash
git add src/app
git commit -m "feat: add durable local application state"
```

### Task 4: Progressive Home Recommendation Flow

**Files:**
- Create: `src/features/home/HomePage.tsx`
- Create: `src/features/home/HomePage.test.tsx`
- Create: `src/features/home/PreferencePanel.tsx`
- Create: `src/features/home/WeatherSummary.tsx`
- Create: `src/features/home/RecommendationResults.tsx`
- Create: `src/features/home/ActivityCard.tsx`
- Create: `src/components/ImageWithFallback.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces: first-visit onboarding, result restoration, preference editing, party-size updates, and recommendation cards.
- Consumes: `useAppState()`, `recommendActivities`, static fixtures, and `ImageWithFallback`.

- [ ] **Step 1: Write failing home-flow tests**

```tsx
it("requires an activity type and budget before generating", async () => {
  const user = userEvent.setup();
  renderApp("/");
  const submit = screen.getByRole("button", { name: "生成周末计划" });
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  expect(submit).toBeEnabled();
});

it("reveals recommendations and supports editing saved preferences", async () => {
  const user = userEvent.setup();
  renderApp("/");
  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  await user.click(screen.getByRole("button", { name: "生成周末计划" }));
  expect(await screen.findByRole("heading", { name: "为你安排的北京周末" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "调整偏好" }));
  expect(screen.getByRole("checkbox", { name: "看展" })).toBeChecked();
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/home/HomePage.test.tsx`

Expected: FAIL because home components do not exist.

- [ ] **Step 3: Implement the first-visit state**

Build the asymmetric editorial hero with a real generated Beijing photo, visible labels, multi-select activity controls, single-select budget controls, inline validation, and a disabled submit state. Use semantic `fieldset` and `legend`.

- [ ] **Step 4: Implement the result state**

Render the weather summary, one lead route, an asymmetric activity grid, team preview, check-in preview, and guide preview. Keep the current preference summary at the top and recompute results when party size changes.

- [ ] **Step 5: Implement transitions and error states**

Use Motion layout transitions for onboarding-to-results and CSS skeletons for loading. Respect `useReducedMotion`. Implement empty results and image-failure fallbacks without changing layout dimensions.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm run test:run -- src/features/home/HomePage.test.tsx
npm run build
```

Expected: tests and build pass.

Commit:

```bash
git add src/features/home src/components/ImageWithFallback.tsx src/app/routes.tsx src/index.css
git commit -m "feat: build progressive weekend recommendation flow"
```

### Task 5: Activity Detail and Favorites

**Files:**
- Create: `src/features/activities/ActivityDetailPage.tsx`
- Create: `src/features/activities/ActivityDetailPage.test.tsx`
- Modify: `src/app/routes.tsx`
- Modify: `src/features/home/ActivityCard.tsx`

**Interfaces:**
- Produces: `#/activity/:activityId`, favorite toggling, team and check-in entry links.
- Consumes: activity fixtures and `useAppState()`.

- [ ] **Step 1: Write failing detail tests**

```tsx
it("shows activity facts and persists favorite state", async () => {
  const user = userEvent.setup();
  renderApp("/activity/798-art-weekend");
  expect(screen.getByRole("heading", { name: /798/ })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "收藏活动" }));
  expect(screen.getByRole("button", { name: "取消收藏" })).toBeVisible();
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/activities/ActivityDetailPage.test.tsx`

Expected: FAIL because the activity detail route does not exist.

- [ ] **Step 3: Implement detail route**

Render image, schedule, venue, price, weather guidance, suitable party sizes, route description, favorite button, “找搭子” link, and “记录打卡” link. Unknown IDs render a useful not-found state with a return link.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/activities/ActivityDetailPage.test.tsx`

Expected: detail and favorite tests pass.

Commit:

```bash
git add src/features/activities src/features/home/ActivityCard.tsx src/app/routes.tsx
git commit -m "feat: add activity details and favorites"
```

### Task 6: Team Planning

**Files:**
- Create: `src/features/teams/TeamsPage.tsx`
- Create: `src/features/teams/TeamForm.tsx`
- Test: `src/features/teams/TeamsPage.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Produces: team browsing, joining, leaving, and creation.
- Consumes: team fixtures, activity fixtures, and team actions from `useAppState()`.

- [ ] **Step 1: Write failing team tests**

```tsx
it("joins and leaves an available team", async () => {
  const user = userEvent.setup();
  renderApp("/teams");
  await user.click(screen.getByRole("button", { name: "加入队伍" }));
  expect(screen.getByText("已加入")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "退出队伍" }));
  expect(screen.getByRole("button", { name: "加入队伍" })).toBeVisible();
});

it("keeps the creation dialog open with success feedback", async () => {
  const user = userEvent.setup();
  renderApp("/teams");
  await user.selectOptions(screen.getByLabelText("活动"), "798-art-weekend");
  await user.type(screen.getByLabelText("出发时间"), "2026-09-19T10:00");
  await user.type(screen.getByLabelText("集合点"), "798 艺术区南门");
  await user.selectOptions(screen.getByLabelText("人数上限"), "4");
  await user.type(screen.getByLabelText("队伍说明"), "一起看展，中午附近吃饭");
  await user.click(screen.getByRole("button", { name: "创建队伍" }));
  expect(screen.getByText("队伍已创建")).toBeVisible();
  expect(screen.getByRole("dialog")).toBeVisible();
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/teams/TeamsPage.test.tsx`

Expected: FAIL because team components do not exist.

- [ ] **Step 3: Implement team flows**

Build a compact editorial list with activity image, time, meeting point, capacity, and leader. Add validated creation dialog and disabled state for full teams. Keep the dialog open after success until explicit close.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/teams/TeamsPage.test.tsx`

Expected: team tests pass.

Commit:

```bash
git add src/features/teams src/app/routes.tsx
git commit -m "feat: add local team planning"
```

### Task 7: Check-in Records

**Files:**
- Create: `src/features/checkins/CheckinsPage.tsx`
- Create: `src/features/checkins/CheckinForm.tsx`
- Test: `src/features/checkins/CheckinsPage.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Produces: check-in history and persistent check-in creation.
- Consumes: activity fixtures and `addCheckin` from `useAppState()`.

- [ ] **Step 1: Write failing check-in tests**

```tsx
it("saves a check-in and preserves the success state", async () => {
  const user = userEvent.setup();
  renderApp("/checkins");
  await user.selectOptions(screen.getByLabelText("活动"), "798-art-weekend");
  await user.type(screen.getByLabelText("日期"), "2026-09-19");
  await user.selectOptions(screen.getByLabelText("同行人数"), "pair");
  await user.click(screen.getByRole("radio", { name: "5 星" }));
  await user.type(screen.getByLabelText("打卡记录"), "展览动线清晰，下午人更多。");
  await user.click(screen.getByRole("button", { name: "保存打卡" }));
  expect(screen.getByText("打卡已保存")).toBeVisible();
  expect(screen.getByRole("dialog")).toBeVisible();
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/checkins/CheckinsPage.test.tsx`

Expected: FAIL because check-in components do not exist.

- [ ] **Step 3: Implement check-in flows**

Create the history view and a labeled form for activity, date, party size, rating, and note. Keep the successful form open with saved values and an explicit close action. Do not request or persist photos.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/checkins/CheckinsPage.test.tsx`

Expected: check-in tests pass.

Commit:

```bash
git add src/features/checkins src/app/routes.tsx
git commit -m "feat: add persistent check-in records"
```

### Task 8: Guide Browsing and Publishing

**Files:**
- Create: `src/features/guides/GuidesPage.tsx`
- Create: `src/features/guides/GuideComposer.tsx`
- Test: `src/features/guides/GuidesPage.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**
- Produces: guide filtering, saving, and local publishing.
- Consumes: guide fixtures and guide actions from `useAppState()`.

- [ ] **Step 1: Write failing guide tests**

```tsx
it("publishes a guide and places it first", async () => {
  const user = userEvent.setup();
  renderApp("/guides");
  await user.type(screen.getByLabelText("标题"), "雨天也能走的东城路线");
  await user.selectOptions(screen.getByLabelText("关联地点"), "798-art-weekend");
  await user.type(screen.getByLabelText("正文摘要"), "从室内展览开始，沿途安排咖啡和书店。");
  await user.type(screen.getByLabelText("适合人群"), "两人同行，喜欢慢慢逛");
  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  expect(screen.getByText("攻略已发布")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "完成" }));
  expect(screen.getAllByRole("article")[0]).toHaveTextContent("雨天也能走的东城路线");
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:run -- src/features/guides/GuidesPage.test.tsx`

Expected: FAIL because guide components do not exist.

- [ ] **Step 3: Implement guide flows**

Create an image-led editorial list, category filters, save buttons, and a validated composer for title, activity, summary, and audience. Keep the composer open after publishing and mark locally created entries as “我的分享”.

- [ ] **Step 4: Verify and commit**

Run: `npm run test:run -- src/features/guides/GuidesPage.test.tsx`

Expected: guide tests pass.

Commit:

```bash
git add src/features/guides src/app/routes.tsx
git commit -m "feat: add local guide publishing"
```

### Task 9: Responsive QA, Accessibility, and Deployment

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/citywalk.spec.ts`
- Create: `.github/workflows/deploy.yml`
- Modify: `src/index.css`
- Modify: affected components from Tasks 4-8 as defects require

**Interfaces:**
- Produces: browser-level acceptance coverage and automated GitHub Pages deployment.
- Consumes: the complete app.

- [ ] **Step 1: Write end-to-end acceptance tests**

```ts
test("first visit generates and restores a weekend plan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("checkbox", { name: "看展" }).check();
  await page.getByRole("radio", { name: "100 元内" }).check();
  await page.getByRole("button", { name: "生成周末计划" }).click();
  await expect(page.getByRole("heading", { name: "为你安排的北京周末" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "为你安排的北京周末" })).toBeVisible();
});
```

Add tests for preference editing, team creation and exit, check-in creation, guide publishing, theme switching, mobile navigation, unknown activity handling, and absence of horizontal overflow at 390x844 and 1440x900.

- [ ] **Step 2: Run browser tests and capture initial failures**

Run:

```bash
npx playwright install chromium
npm run test:e2e
```

Expected: any remaining integration or layout defects are reported by exact test.

- [ ] **Step 3: Fix defects in one bounded pass**

Use Playwright screenshots at 390x844 and 1440x900. Correct clipping, focus order, inaccessible labels, contrast, dark-mode parity, missing reduced-motion fallbacks, and image aspect ratio shifts discovered by the tests.

- [ ] **Step 4: Add deployment workflow**

Configure GitHub Actions to install with `npm ci`, run `npm run test:run`, run `npm run build`, upload `dist`, and deploy through `actions/deploy-pages`.

- [ ] **Step 5: Run final verification**

Run:

```bash
npm run test:run
npm run build
npm run test:e2e
```

Expected: all commands pass, no horizontal overflow is reported, and `dist/index.html` references `/citywalk/` assets.

- [ ] **Step 6: Commit**

```bash
git add .github playwright.config.ts e2e src
git commit -m "test: verify responsive flows and Pages deployment"
```
