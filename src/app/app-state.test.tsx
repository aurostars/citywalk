import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { App } from "./App";
import {
  type AppState,
  AppStateProvider,
  defaultAppState,
  useAppState,
} from "./AppState";
import { renderApp } from "../test/renderApp";

const colorSchemeQuery = "(prefers-color-scheme: dark)";

function installMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: colorSchemeQuery,
    onchange: null,
    addEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.add(listener),
    removeEventListener: (
      _type: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.delete(listener),
    addListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeListener: (listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    dispatchEvent: () => true,
  } as MediaQueryList;

  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: colorSchemeQuery } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function AppStateHarness() {
  const {
    state,
    persistenceWarning,
    addCheckin,
    createTeam,
    joinTeam,
    leaveTeam,
    publishGuide,
    savePreferences,
    setTheme,
    toggleFavorite,
    toggleGuideSaved,
  } = useAppState();
  const [createdTeamId, setCreatedTeamId] = useState("");
  const [createdCheckinId, setCreatedCheckinId] = useState("");
  const [createdGuideId, setCreatedGuideId] = useState("");

  return (
    <>
      <output aria-label="应用状态">{JSON.stringify(state)}</output>
      <output aria-label="新队伍 ID">{createdTeamId}</output>
      <output aria-label="新打卡 ID">{createdCheckinId}</output>
      <output aria-label="新攻略 ID">{createdGuideId}</output>
      {persistenceWarning ? <p role="status">{persistenceWarning}</p> : null}

      <button
        onClick={() =>
          savePreferences({
            activityTypes: ["exhibition", "market"],
            budget: "under-100",
            partySize: "pair",
          })
        }
        type="button"
      >
        保存偏好
      </button>
      <button
        onClick={() => toggleFavorite("798-art-weekend")}
        type="button"
      >
        切换收藏
      </button>
      <button
        onClick={() => joinTeam("team-798-saturday")}
        type="button"
      >
        加入队伍
      </button>
      <button
        onClick={() => leaveTeam("team-798-saturday")}
        type="button"
      >
        退出队伍
      </button>
      <button
        onClick={() =>
          setCreatedTeamId(
            createTeam({
              activityId: "798-art-weekend",
              leader: "我",
              departureTime: "2026-09-19T10:00",
              meetingPoint: "798 艺术区南门",
              capacity: 4,
              note: "一起看展，中午附近吃饭",
            }),
          )
        }
        type="button"
      >
        创建队伍
      </button>
      <button
        disabled={!createdTeamId}
        onClick={() => joinTeam(createdTeamId)}
        type="button"
      >
        再次加入新队伍
      </button>
      <button
        onClick={() =>
          setCreatedCheckinId(
            addCheckin({
              activityId: "798-art-weekend",
              date: "2026-09-19",
              partySize: "pair",
              rating: 5,
              note: "展览动线清晰，下午人更多。",
            }),
          )
        }
        type="button"
      >
        添加打卡
      </button>
      <button
        onClick={() =>
          setCreatedGuideId(
            publishGuide({
              title: "雨天也能走的东城路线",
              activityId: "798-art-weekend",
              activityType: "exhibition",
              summary: "从室内展览开始，沿途安排咖啡和书店。",
              audience: "两人同行，喜欢慢慢逛",
            }),
          )
        }
        type="button"
      >
        发布攻略
      </button>
      <button
        onClick={() => toggleGuideSaved("guide-798-rainy-day")}
        type="button"
      >
        切换攻略收藏
      </button>
      <button onClick={() => setTheme("dark")} type="button">
        使用深色主题
      </button>
      <button onClick={() => setTheme("system")} type="button">
        跟随系统主题
      </button>
    </>
  );
}

function renderStateHarness(initialState = defaultAppState) {
  return render(
    <AppStateProvider initialState={initialState}>
      <AppStateHarness />
    </AppStateProvider>,
  );
}

function readRenderedState(): AppState {
  return JSON.parse(
    screen.getByLabelText("应用状态").textContent ?? "",
  ) as AppState;
}

function readPersistedState(): AppState {
  return JSON.parse(localStorage.getItem("citywalk:v1") ?? "") as AppState;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("renders the 城迹 navigation through the production app", () => {
  render(<App />);
  expect(screen.getByRole("link", { name: "城迹" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "推荐" })).toBeInTheDocument();
});

it("follows system theme changes without setting a root override", () => {
  const colorScheme = installMatchMedia(false);

  renderApp();

  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(
    screen.getByRole("button", { name: "切换至深色主题" }),
  ).toBeInTheDocument();

  act(() => colorScheme.setMatches(true));

  expect(document.documentElement).not.toHaveAttribute("data-theme");
  expect(
    screen.getByRole("button", { name: "切换至浅色主题" }),
  ).toBeInTheDocument();
});

it("persists a manual theme override and restores it on remount", async () => {
  const user = userEvent.setup();
  const colorScheme = installMatchMedia(true);
  const firstRender = render(<App />);

  await user.click(
    screen.getByRole("button", { name: "切换至浅色主题" }),
  );
  expect(document.documentElement).toHaveAttribute("data-theme", "light");

  act(() => colorScheme.setMatches(false));
  act(() => colorScheme.setMatches(true));
  expect(document.documentElement).toHaveAttribute("data-theme", "light");

  await waitFor(() => {
    expect(readPersistedState().theme).toBe("light");
  });

  firstRender.unmount();
  delete document.documentElement.dataset.theme;
  render(<App />);

  await waitFor(() => {
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });
});

it("saves preferences and completes onboarding", async () => {
  const user = userEvent.setup();
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "保存偏好" }));

  expect(readRenderedState()).toMatchObject({
    onboardingComplete: true,
    preferences: {
      activityTypes: ["exhibition", "market"],
      budget: "under-100",
      partySize: "pair",
    },
  });
  await waitFor(() => {
    expect(readPersistedState().onboardingComplete).toBe(true);
  });
});

it("toggles a favorite activity", async () => {
  const user = userEvent.setup();
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "切换收藏" }));
  expect(readRenderedState().favoriteActivityIds).toEqual([
    "798-art-weekend",
  ]);

  await user.click(screen.getByRole("button", { name: "切换收藏" }));
  expect(readRenderedState().favoriteActivityIds).toEqual([]);
});

it("joins and leaves an available team", async () => {
  const user = userEvent.setup();
  renderStateHarness();
  const initialMemberCount = defaultAppState.teams[0].memberCount;

  await user.click(screen.getByRole("button", { name: "加入队伍" }));
  expect(readRenderedState().teams[0]).toMatchObject({
    joined: true,
    memberCount: initialMemberCount + 1,
  });

  await user.click(screen.getByRole("button", { name: "退出队伍" }));
  expect(readRenderedState().teams[0]).toMatchObject({
    joined: false,
    memberCount: initialMemberCount,
  });
});

it("creates a joined user-owned team without double counting a later join", async () => {
  const user = userEvent.setup();
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "创建队伍" }));

  const createdId = screen.getByLabelText("新队伍 ID").textContent ?? "";
  expect(createdId).toMatch(/^team-/);
  expect(readRenderedState().teams[0]).toMatchObject({
    id: createdId,
    joined: true,
    memberCount: 1,
    createdByUser: true,
  });

  await user.click(
    screen.getByRole("button", { name: "再次加入新队伍" }),
  );
  expect(readRenderedState().teams[0]).toMatchObject({
    id: createdId,
    joined: true,
    memberCount: 1,
  });
});

it("adds a check-in and returns its ID", async () => {
  const user = userEvent.setup();
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "添加打卡" }));

  const createdId = screen.getByLabelText("新打卡 ID").textContent ?? "";
  expect(createdId).toMatch(/^checkin-/);
  expect(readRenderedState().checkins[0]).toMatchObject({
    id: createdId,
    activityId: "798-art-weekend",
    rating: 5,
  });
});

it("publishes a user guide first and toggles saved guides", async () => {
  const user = userEvent.setup();
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  const createdId = screen.getByLabelText("新攻略 ID").textContent ?? "";
  expect(createdId).toMatch(/^guide-/);
  expect(readRenderedState().guides[0]).toMatchObject({
    id: createdId,
    author: "我",
    createdByUser: true,
  });

  await user.click(
    screen.getByRole("button", { name: "切换攻略收藏" }),
  );
  expect(
    readRenderedState().guides.find(
      ({ id }) => id === "guide-798-rainy-day",
    ),
  ).toMatchObject({ saved: true });
});

it("supports persisted system and dark theme preferences", async () => {
  const user = userEvent.setup();
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "使用深色主题" }));
  expect(readRenderedState().theme).toBe("dark");
  await waitFor(() => {
    expect(readPersistedState().theme).toBe("dark");
  });

  await user.click(screen.getByRole("button", { name: "跟随系统主题" }));
  expect(readRenderedState().theme).toBe("system");
  await waitFor(() => {
    expect(readPersistedState().theme).toBe("system");
  });
});

it("keeps state in React and exposes a warning when storage is unavailable", async () => {
  const user = userEvent.setup();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Storage unavailable", "QuotaExceededError");
  });
  renderStateHarness();

  await user.click(screen.getByRole("button", { name: "切换收藏" }));

  expect(readRenderedState().favoriteActivityIds).toEqual([
    "798-art-weekend",
  ]);
  expect(
    await screen.findByText("更改已保留在当前页面，但无法写入浏览器存储。"),
  ).toHaveAttribute("role", "status");
});
