import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "../../test/renderApp";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("shows fixture-derived activity facts and persists favorite state", async () => {
  const user = userEvent.setup();
  renderApp("/activity/798-art-weekend");

  expect(
    screen.getByRole("heading", { name: "798 当代艺术周末" }),
  ).toBeVisible();
  expect(
    screen.getByRole("img", {
      name: "798 艺术区入口的红色数字标识",
    }),
  ).toBeVisible();
  const activityFacts = screen.getByRole("region", {
    name: "活动信息",
  });
  expect(
    within(activityFacts).getByText("周六至周日 10:00-18:00"),
  ).toBeVisible();
  expect(within(activityFacts).getByText("798 艺术区")).toBeVisible();
  expect(within(activityFacts).getByText("80 元")).toBeVisible();
  expect(
    within(activityFacts).getByText("一个人、两个人、多人同行"),
  ).toBeVisible();
  expect(
    screen.getByText(
      "示例天气为多云，本活动适合当前天气。室内场地也便于应对临时降雨。",
    ),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "从艺术区走到亮马河" }),
  ).toBeVisible();
  expect(
    screen.getByText(
      "下午看展，傍晚转场到亮马河散步并听一场水岸演出。",
    ),
  ).toBeVisible();

  await user.click(screen.getByRole("button", { name: "收藏活动" }));

  expect(
    screen.getByRole("button", { name: "取消收藏" }),
  ).toHaveAttribute("aria-pressed", "true");
  await waitFor(() => {
    const state = JSON.parse(
      localStorage.getItem("citywalk:v1") ?? "",
    ) as { favoriteActivityIds: string[] };
    expect(state.favoriteActivityIds).toContain("798-art-weekend");
  });
});

it("links the activity into team and check-in planning", () => {
  renderApp("/activity/798-art-weekend");

  expect(screen.getByRole("link", { name: "找搭子" })).toHaveAttribute(
    "href",
    "/teams?activity=798-art-weekend",
  );
  expect(screen.getByRole("link", { name: "记录打卡" })).toHaveAttribute(
    "href",
    "/checkins?activity=798-art-weekend",
  );
});

it("keeps a favorite in session and shows the shell warning when storage fails", async () => {
  const user = userEvent.setup();
  const setItem = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    });
  renderApp("/activity/798-art-weekend");

  await user.click(screen.getByRole("button", { name: "收藏活动" }));

  expect(
    screen.getByRole("button", { name: "取消收藏" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("status", { name: "浏览器存储提示" }),
  ).toHaveTextContent(
    "更改已保留在当前页面，但无法写入浏览器存储。",
  );
  expect(setItem).toHaveBeenCalledTimes(1);
});

it("offers a useful way back for an unknown activity", () => {
  renderApp("/activity/not-in-the-guide");

  expect(
    screen.getByRole("heading", {
      name: "这条活动不在当前周末清单里",
    }),
  ).toBeVisible();
  expect(
    screen.getByText("链接可能已失效，也可能是活动已经从本期推荐中移除。"),
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "返回周末推荐" }),
  ).toHaveAttribute("href", "/");
});
