import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultAppState, type AppState } from "../../app/AppState";
import { renderApp } from "../../test/renderApp";

function completedState(
  preferences: AppState["preferences"],
): AppState {
  return {
    ...defaultAppState,
    onboardingComplete: true,
    preferences,
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("renders the home hero from the static image pack", () => {
  renderApp("/");

  const hero = screen.getByRole("img", {
    name: "北京校园街道上结伴步行的学生",
  });
  expect(hero).toHaveAttribute(
    "src",
    expect.stringMatching(/\/images\/hero\/beijing-weekend\.webp$/),
  );
  expect(hero).not.toHaveAttribute(
    "src",
    expect.stringContaining("text_to_image"),
  );
});

it("requires an activity type and budget before generating", async () => {
  const user = userEvent.setup();
  renderApp("/");
  const submit = screen.getByRole("button", { name: "生成周末计划" });

  expect(screen.getByRole("checkbox", { name: "去玩乐" })).toBeVisible();
  expect(screen.getByRole("radio", { name: "300 元以上" })).toBeVisible();
  expect(screen.getByRole("radio", { name: "不限" })).toBeVisible();
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  expect(submit).toBeEnabled();
});

it("generates a premium entertainment plan", async () => {
  const user = userEvent.setup();
  renderApp("/");

  await user.click(screen.getByRole("checkbox", { name: "去玩乐" }));
  await user.click(screen.getByRole("radio", { name: "300 元以上" }));
  await user.click(screen.getByRole("button", { name: "生成周末计划" }));

  expect(
    await screen.findByRole("heading", {
      name: "北京环球度假区一日游",
    }),
  ).toBeVisible();
  expect(screen.getByLabelText("当前偏好")).toHaveTextContent("玩乐");
  expect(screen.getByLabelText("当前偏好")).toHaveTextContent("300 元以上");
});

it("selects the premium west-city route for a cloudy show plan", () => {
  renderApp(
    "/",
    completedState({
      activityTypes: ["show"],
      budget: "above-300",
      partySize: "pair",
    }),
  );

  expect(
    screen.getByRole("heading", { name: "西城舞台艺术日" }),
  ).toBeVisible();
  expect(screen.getByText("660 元")).toBeVisible();
});

it("reveals recommendations and supports editing saved preferences", async () => {
  const user = userEvent.setup();
  renderApp("/");

  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  await user.click(screen.getByRole("button", { name: "生成周末计划" }));

  expect(screen.getByRole("status", { name: "周末计划状态" })).toHaveTextContent(
    "正在结合天气、预算和同行人数生成周末计划",
  );
  expect(
    await screen.findByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();

  await user.click(screen.getByRole("button", { name: "调整偏好" }));
  expect(screen.getByRole("checkbox", { name: "看展" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "100 元内" })).toBeChecked();
});

it("shows a shell warning when onboarding preferences cannot persist", async () => {
  const user = userEvent.setup();
  const setItem = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    });
  renderApp("/");

  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  await user.click(screen.getByRole("button", { name: "生成周末计划" }));

  expect(
    await screen.findByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();
  expect(
    screen.getByRole("status", { name: "浏览器存储提示" }),
  ).toHaveTextContent(
    "更改已保留在当前页面，但无法写入浏览器存储。",
  );
  expect(setItem).toHaveBeenCalledTimes(1);
});

it("restores saved results on a return visit", () => {
  renderApp(
    "/",
    completedState({
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    }),
  );

  expect(
    screen.getByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "生成周末计划" })).not.toBeInTheDocument();
});

it("reranks recommendations when party size changes", async () => {
  const user = userEvent.setup();
  renderApp(
    "/",
    completedState({
      activityTypes: ["market"],
      budget: "under-100",
      partySize: "pair",
    }),
  );

  const leadRecommendation = screen.getByLabelText("首选活动");
  expect(
    within(leadRecommendation).getByRole("heading", {
      name: "鼓楼胡同周末市集",
    }),
  ).toBeVisible();

  await user.click(screen.getByRole("radio", { name: "一个人" }));

  expect(screen.getByRole("radio", { name: "一个人" })).toHaveFocus();
  expect(
    within(screen.getByLabelText("首选活动")).getByRole("heading", {
      name: "潘家园旧物早市",
    }),
  ).toBeVisible();
});

it("offers nearby matches without changing empty-result preferences", async () => {
  const user = userEvent.setup();
  renderApp(
    "/",
    completedState({
      activityTypes: ["exhibition"],
      budget: "free",
      partySize: "group",
    }),
  );

  expect(screen.getByRole("heading", { name: "这组条件暂时没有匹配" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "一键查看相近活动" }));

  expect(screen.getByLabelText("当前偏好")).toHaveTextContent("看展");
  expect(screen.getByLabelText("当前偏好")).toHaveTextContent("免费");
  expect(screen.getByRole("heading", { name: "亮马河水岸音乐现场" })).toBeVisible();
});

it("names the activity when an image fails", () => {
  renderApp(
    "/",
    completedState({
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    }),
  );

  const image = screen.getByRole("img", {
    name: "798 艺术空间内参观展览的年轻人",
  });
  fireEvent.error(image);

  expect(
    screen.getByRole("img", { name: "798 当代艺术周末图片暂不可用" }),
  ).toBeVisible();
});

it.each([
  { budget: "100 元内", announcement: /周末计划已生成/ },
  { budget: "免费", announcement: /没有匹配/ },
])("keeps keyboard context and announces generation for $budget", async ({
  budget,
  announcement,
}) => {
  const user = userEvent.setup();
  renderApp("/");
  const status = screen.getByRole("status", { name: "周末计划状态" });
  expect(status).toBeEmptyDOMElement();

  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  await user.click(screen.getByRole("radio", { name: budget }));
  await user.tab();
  expect(screen.getByRole("button", { name: "生成周末计划" })).toHaveFocus();
  await user.keyboard("{Enter}");

  const heading = await screen.findByRole("heading", {
    name: "为你安排的北京周末",
  });
  await waitFor(() => expect(heading).toHaveFocus());
  expect(screen.getByRole("status", { name: "周末计划状态" })).toBe(status);
  expect(status).toHaveTextContent(announcement);

  await user.tab();
  expect(screen.getByRole("button", { name: "调整偏好" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("heading", { name: "换个方向，再排一次。" })).toHaveFocus();
  expect(status).toBeEmptyDOMElement();
  await user.tab();
  expect(screen.getByRole("checkbox", { name: "看展" })).toHaveFocus();
});

it("explains a partial party-size match without changing the lead ranking", () => {
  renderApp(
    "/",
    completedState({
      activityTypes: ["hike"],
      budget: "free",
      partySize: "solo",
    }),
  );

  expect(
    within(screen.getByLabelText("首选活动")).getByRole("heading", {
      name: "温榆河公园骑行",
    }),
  ).toBeVisible();
  const weather = screen.getByRole("region", { name: "本周末示例天气" });
  expect(weather).toHaveTextContent("人数与活动建议不完全匹配");
  expect(weather).not.toHaveTextContent("符合当前预算与同行人数");
});
