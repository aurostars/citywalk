import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultAppState } from "../../app/AppState";
import { renderApp } from "../../test/renderApp";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("renders an image-led guide list with a clear all-types filter", async () => {
  const user = userEvent.setup();
  renderApp("/guides");

  const filters = screen.getByRole("group", {
    name: "按活动类型筛选",
  });
  const allFilter = within(filters).getByRole("button", { name: "全部" });
  expect(allFilter).toHaveAttribute("aria-pressed", "true");

  const initialGuides = screen.getAllByRole("article");
  expect(initialGuides).toHaveLength(defaultAppState.guides.length);
  expect(
    within(initialGuides[0]).getByRole("img", {
      name: "798 艺术区红砖厂房与正在看展的年轻人",
    }),
  ).toHaveAttribute(
    "src",
    expect.stringContaining(
      "text_to_image?prompt=Realistic%20editorial%20travel%20photograph",
    ),
  );

  await user.click(
    within(filters).getByRole("button", { name: "市集" }),
  );
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByText("潘家园早市的三个停留点")).toBeVisible();
  expect(allFilter).toHaveAttribute("aria-pressed", "false");

  await user.click(allFilter);
  expect(screen.getAllByRole("article")).toHaveLength(
    defaultAppState.guides.length,
  );
  expect(allFilter).toHaveAttribute("aria-pressed", "true");
});

it("toggles a saved guide and persists the result", async () => {
  const user = userEvent.setup();
  renderApp("/guides");

  const saveButton = screen.getByRole("button", {
    name: "收藏《下雨也能慢慢逛的 798 顺序》",
  });
  await user.click(saveButton);

  expect(
    screen.getByRole("button", {
      name: "取消收藏《下雨也能慢慢逛的 798 顺序》",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await waitFor(() => {
    const storedState = JSON.parse(
      localStorage.getItem("citywalk:v1") ?? "",
    ) as typeof defaultAppState;
    expect(storedState.guides[0]).toMatchObject({
      id: "guide-798-rainy-day",
      saved: true,
    });
  });
});

it("moves focus into the composer and validates required fields in order", async () => {
  const user = userEvent.setup();
  renderApp("/guides");

  const openButton = screen.getByRole("button", { name: "写攻略" });
  await user.click(openButton);

  expect(screen.getByRole("dialog", { name: "分享周末攻略" }))
    .toBeVisible();
  expect(screen.getByLabelText("标题")).toHaveFocus();

  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  expect(screen.getByText("请填写标题")).toBeVisible();
  expect(screen.getByText("请选择关联活动")).toBeVisible();
  expect(screen.getByText("请填写正文摘要")).toBeVisible();
  expect(screen.getByText("请填写适合人群")).toBeVisible();
  expect(screen.getByLabelText("标题")).toHaveFocus();

  await user.type(screen.getByLabelText("标题"), "雨天路线");
  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  expect(screen.getByLabelText("关联地点")).toHaveFocus();

  await user.selectOptions(
    screen.getByLabelText("关联地点"),
    "798-art-weekend",
  );
  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  expect(screen.getByLabelText("正文摘要")).toHaveFocus();

  await user.type(screen.getByLabelText("正文摘要"), "从室内开始。");
  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  expect(screen.getByLabelText("适合人群")).toHaveFocus();
});

it("publishes a guide first, retains values, and restores focus on completion", async () => {
  const user = userEvent.setup();
  renderApp("/guides");

  const openButton = screen.getByRole("button", { name: "写攻略" });
  await user.click(openButton);
  await user.type(
    screen.getByLabelText("标题"),
    "雨天也能走的东城路线",
  );
  await user.selectOptions(
    screen.getByLabelText("关联地点"),
    "798-art-weekend",
  );
  await user.type(
    screen.getByLabelText("正文摘要"),
    "从室内展览开始，沿途安排咖啡和书店。",
  );
  await user.type(
    screen.getByLabelText("适合人群"),
    "两人同行，喜欢慢慢逛",
  );
  await user.click(screen.getByRole("button", { name: "发布攻略" }));

  const status = screen.getByRole("status", { name: "攻略已发布" });
  expect(status).toBeVisible();
  expect(status).toHaveFocus();
  expect(screen.getByRole("dialog", { name: "分享周末攻略" }))
    .toBeVisible();
  expect(screen.getByLabelText("标题")).toHaveValue(
    "雨天也能走的东城路线",
  );
  expect(screen.getByLabelText("关联地点")).toHaveValue(
    "798-art-weekend",
  );
  expect(screen.getByLabelText("正文摘要")).toHaveValue(
    "从室内展览开始，沿途安排咖啡和书店。",
  );
  expect(screen.getByLabelText("适合人群")).toHaveValue(
    "两人同行，喜欢慢慢逛",
  );

  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog", { name: "分享周末攻略" }))
    .toBeVisible();
  expect(
    screen.queryByRole("button", { name: "关闭攻略窗口" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "完成" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(openButton).toHaveFocus();

  const firstGuide = screen.getAllByRole("article")[0];
  expect(firstGuide).toHaveTextContent("雨天也能走的东城路线");
  expect(firstGuide).toHaveTextContent("我的分享");
});

it("shows a guide published under another type first after completion", async () => {
  const user = userEvent.setup();
  renderApp("/guides");

  const filters = screen.getByRole("group", {
    name: "按活动类型筛选",
  });
  await user.click(
    within(filters).getByRole("button", { name: "市集" }),
  );
  await user.click(screen.getByRole("button", { name: "写攻略" }));
  await user.type(
    screen.getByLabelText("标题"),
    "跨分类发布的展览路线",
  );
  await user.selectOptions(
    screen.getByLabelText("关联地点"),
    "798-art-weekend",
  );
  await user.type(
    screen.getByLabelText("正文摘要"),
    "从市集筛选中发布一条展览攻略。",
  );
  await user.type(
    screen.getByLabelText("适合人群"),
    "周末看展的人",
  );
  await user.click(screen.getByRole("button", { name: "发布攻略" }));
  await user.click(screen.getByRole("button", { name: "完成" }));

  expect(
    within(filters).getByRole("button", { name: "展览" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("article")[0]).toHaveTextContent(
    "跨分类发布的展览路线",
  );
});

it("keeps a failed publication in session without claiming success or writing twice", async () => {
  const user = userEvent.setup();
  const setItem = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    });
  renderApp("/guides");

  const filters = screen.getByRole("group", {
    name: "按活动类型筛选",
  });
  await user.click(
    within(filters).getByRole("button", { name: "市集" }),
  );
  const openButton = screen.getByRole("button", { name: "写攻略" });
  await user.click(openButton);
  await user.type(
    screen.getByLabelText("标题"),
    "只在本次会话保留的路线",
  );
  await user.selectOptions(
    screen.getByLabelText("关联地点"),
    "798-art-weekend",
  );
  await user.type(
    screen.getByLabelText("正文摘要"),
    "存储不可用时也保留当前输入。",
  );
  await user.type(
    screen.getByLabelText("适合人群"),
    "喜欢慢慢看展的人",
  );
  await user.click(screen.getByRole("button", { name: "发布攻略" }));

  const dialog = screen.getByRole("dialog", { name: "分享周末攻略" });
  const warning = within(dialog).getByRole("alert", {
    name: "攻略仅保留在本次会话",
  });
  expect(warning).toBeVisible();
  expect(warning).toHaveFocus();
  expect(
    within(dialog).queryByRole("status", { name: "攻略已发布" }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("标题")).toHaveValue(
    "只在本次会话保留的路线",
  );
  expect(screen.getByLabelText("关联地点")).toHaveValue(
    "798-art-weekend",
  );
  expect(screen.getByLabelText("正文摘要")).toHaveValue(
    "存储不可用时也保留当前输入。",
  );
  expect(screen.getByLabelText("适合人群")).toHaveValue(
    "喜欢慢慢看展的人",
  );
  expect(screen.getByRole("button", { name: "发布攻略" }))
    .toBeDisabled();
  expect(screen.getByRole("button", { name: "完成" })).toBeEnabled();
  expect(setItem).toHaveBeenCalledTimes(1);

  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog", { name: "分享周末攻略" }))
    .toBeVisible();
  expect(
    screen.queryByRole("button", { name: "关闭攻略窗口" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "完成" }));
  expect(openButton).toHaveFocus();
  expect(
    within(filters).getByRole("button", { name: "展览" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("article")[0]).toHaveTextContent(
    "只在本次会话保留的路线",
  );
});
