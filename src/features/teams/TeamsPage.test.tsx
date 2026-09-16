import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "../../test/renderApp";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("renders fixture details and joins and leaves an available team", async () => {
  const user = userEvent.setup();
  renderApp("/teams");

  const team = screen.getByRole("article", {
    name: "798 当代艺术周末组队",
  });
  expect(
    within(team).getByRole("img", {
      name: "798 艺术区红砖厂房与正在看展的年轻人",
    }),
  ).toBeVisible();
  expect(within(team).getByText("9月19日 10:00")).toBeVisible();
  expect(within(team).getByText("798 艺术区南门")).toBeVisible();
  expect(within(team).getByText("2 / 4 人")).toBeVisible();
  expect(within(team).getByText("林一")).toBeVisible();

  await user.click(
    within(team).getByRole("button", { name: "加入队伍" }),
  );
  expect(within(team).getByText("已加入")).toBeVisible();
  expect(within(team).getByText("3 / 4 人")).toBeVisible();

  await user.click(
    within(team).getByRole("button", { name: "退出队伍" }),
  );
  expect(
    within(team).getByRole("button", { name: "加入队伍" }),
  ).toBeVisible();
  expect(within(team).getByText("2 / 4 人")).toBeVisible();
});

it("disables joining when a fixture team is full", () => {
  renderApp("/teams");

  const fullTeam = screen.getByRole("article", {
    name: "鼓楼胡同周末市集组队",
  });
  expect(
    within(fullTeam).getByRole("button", { name: "队伍已满" }),
  ).toBeDisabled();
  expect(within(fullTeam).getByText("3 / 3 人")).toBeVisible();
});

it("preselects the activity supplied by the detail page query", async () => {
  const user = userEvent.setup();
  renderApp("/teams?activity=798-art-weekend");

  await user.click(screen.getByRole("button", { name: "发起队伍" }));

  expect(screen.getByRole("dialog", { name: "创建周末队伍" }))
    .toBeVisible();
  expect(screen.getByLabelText("活动")).toHaveValue("798-art-weekend");
});

it("shows inline validation errors with visible form labels", async () => {
  const user = userEvent.setup();
  renderApp("/teams");

  await user.click(screen.getByRole("button", { name: "发起队伍" }));
  await user.click(screen.getByRole("button", { name: "创建队伍" }));

  expect(screen.getByLabelText("活动")).toHaveFocus();
  expect(screen.getByLabelText("活动")).toBeInvalid();
  expect(screen.getByText("请选择活动")).toBeVisible();
  expect(screen.getByLabelText("出发时间")).toBeInvalid();
  expect(screen.getByText("请选择出发时间")).toBeVisible();
  expect(screen.getByLabelText("集合点")).toBeInvalid();
  expect(screen.getByText("请填写集合点")).toBeVisible();
  expect(screen.getByLabelText("人数上限")).toBeVisible();
  expect(screen.getByLabelText("队伍说明")).toBeInvalid();
  expect(screen.getByText("请填写队伍说明")).toBeVisible();
});

it("keeps the creation dialog open after success until explicit close", async () => {
  const user = userEvent.setup();
  renderApp("/teams?activity=798-art-weekend");

  await user.click(screen.getByRole("button", { name: "发起队伍" }));
  await user.type(
    screen.getByLabelText("出发时间"),
    "2026-09-19T10:00",
  );
  await user.type(screen.getByLabelText("集合点"), "798 艺术区南门");
  await user.selectOptions(screen.getByLabelText("人数上限"), "4");
  await user.type(
    screen.getByLabelText("队伍说明"),
    "一起看展，中午附近吃饭",
  );
  await user.click(screen.getByRole("button", { name: "创建队伍" }));

  expect(screen.getByRole("status")).toHaveTextContent("队伍已创建");
  expect(screen.getByLabelText("活动")).toHaveValue("798-art-weekend");
  expect(screen.getByLabelText("出发时间")).toHaveValue(
    "2026-09-19T10:00",
  );
  expect(screen.getByLabelText("集合点")).toHaveValue("798 艺术区南门");
  expect(screen.getByLabelText("人数上限")).toHaveValue("4");
  expect(screen.getByLabelText("队伍说明")).toHaveValue(
    "一起看展，中午附近吃饭",
  );
  expect(
    screen.getByRole("button", { name: "查看我的队伍" }),
  ).toHaveFocus();
  expect(screen.getByRole("dialog", { name: "创建周末队伍" }))
    .toBeVisible();

  await user.click(
    screen.getByRole("button", { name: "关闭创建窗口" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("rejects a departure weekday outside the selected activity schedule", async () => {
  const user = userEvent.setup();
  renderApp("/teams?activity=798-art-weekend");

  await user.click(screen.getByRole("button", { name: "发起队伍" }));
  await user.type(
    screen.getByLabelText("出发时间"),
    "2026-09-21T10:30",
  );
  await user.type(screen.getByLabelText("集合点"), "798 艺术区南门");
  await user.type(screen.getByLabelText("队伍说明"), "周一出发测试");
  await user.click(screen.getByRole("button", { name: "创建队伍" }));

  expect(screen.getByLabelText("出发时间")).toBeInvalid();
  expect(screen.getByLabelText("出发时间")).toHaveFocus();
  expect(
    screen.getByText("所选活动仅在周六、周日开放，请调整出发日期"),
  ).toBeVisible();
  expect(screen.queryByText("队伍已创建")).not.toBeInTheDocument();
});

it("keeps a failed team creation in session with an explicit warning", async () => {
  const user = userEvent.setup();
  const setItem = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    });
  renderApp("/teams?activity=798-art-weekend");

  await user.click(screen.getByRole("button", { name: "发起队伍" }));
  await user.type(
    screen.getByLabelText("出发时间"),
    "2026-09-19T10:00",
  );
  await user.type(screen.getByLabelText("集合点"), "798 艺术区南门");
  await user.type(
    screen.getByLabelText("队伍说明"),
    "只在本次会话保留的队伍",
  );
  await user.click(screen.getByRole("button", { name: "创建队伍" }));

  const dialog = screen.getByRole("dialog", { name: "创建周末队伍" });
  expect(
    within(dialog).getByRole("alert", {
      name: "队伍仅保留在本次会话",
    }),
  ).toBeVisible();
  expect(
    within(dialog).queryByRole("status", { name: "队伍已创建" }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("活动")).toHaveValue("798-art-weekend");
  expect(screen.getByLabelText("出发时间")).toHaveValue(
    "2026-09-19T10:00",
  );
  expect(screen.getByLabelText("集合点")).toHaveValue("798 艺术区南门");
  expect(screen.getByLabelText("队伍说明")).toHaveValue(
    "只在本次会话保留的队伍",
  );
  expect(
    screen.getByRole("button", { name: "创建队伍" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "查看我的队伍" }),
  ).toBeEnabled();
  expect(setItem).toHaveBeenCalledTimes(1);
});

it("shows a created team as joined with one member", async () => {
  const user = userEvent.setup();
  renderApp("/teams?activity=798-art-weekend");

  await user.click(screen.getByRole("button", { name: "发起队伍" }));
  await user.type(
    screen.getByLabelText("出发时间"),
    "2026-09-19T11:00",
  );
  await user.type(screen.getByLabelText("集合点"), "尤伦斯北门");
  await user.selectOptions(screen.getByLabelText("人数上限"), "4");
  await user.type(screen.getByLabelText("队伍说明"), "回归测试新队伍");
  await user.click(screen.getByRole("button", { name: "创建队伍" }));
  await user.click(
    screen.getByRole("button", { name: "关闭创建窗口" }),
  );

  const createdTeam = screen.getByText("回归测试新队伍").closest("article");
  expect(createdTeam).not.toBeNull();
  expect(within(createdTeam as HTMLElement).getByText("1 / 4 人"))
    .toBeVisible();
  expect(within(createdTeam as HTMLElement).getByText("已加入"))
    .toBeVisible();
  expect(
    within(createdTeam as HTMLElement).getByRole("button", {
      name: "退出队伍",
    }),
  ).toBeVisible();
});
