import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultAppState } from "../../app/AppState";
import { renderApp } from "../../test/renderApp";

beforeEach(() => {
  localStorage.clear();
});

it("renders saved check-ins as an editorial history", () => {
  renderApp("/checkins", {
    ...defaultAppState,
    checkins: [
      {
        id: "checkin-existing",
        activityId: "gulou-weekend-market",
        date: "2026-09-13",
        partySize: "group",
        rating: 4,
        note: "午后摊位最集中，适合和朋友慢慢逛。",
      },
    ],
  });

  const history = screen.getByRole("region", { name: "打卡历史" });
  const record = within(history).getByRole("article", {
    name: "鼓楼胡同周末市集打卡",
  });

  expect(within(record).getByText("鼓楼胡同周末市集")).toBeVisible();
  expect(within(record).getByText("2026年9月13日")).toBeVisible();
  expect(within(record).getByText("多人同行")).toBeVisible();
  expect(within(record).getByLabelText("评分 4 星")).toBeVisible();
  expect(
    within(record).getByText("午后摊位最集中，适合和朋友慢慢逛。"),
  ).toBeVisible();
});

it("preselects the activity query and moves focus into the dialog", async () => {
  const user = userEvent.setup();
  renderApp("/checkins?activity=798-art-weekend");

  const openButton = screen.getByRole("button", { name: "新增打卡" });
  await user.click(openButton);

  expect(screen.getByRole("dialog", { name: "记录一次出发" }))
    .toBeVisible();
  expect(screen.getByLabelText("活动")).toHaveValue("798-art-weekend");
  expect(screen.getByLabelText("活动")).toHaveFocus();

  await user.click(
    screen.getByRole("button", { name: "关闭打卡窗口" }),
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(openButton).toHaveFocus();
});

it("validates required fields and focuses each first invalid field", async () => {
  const user = userEvent.setup();
  renderApp("/checkins");

  await user.click(screen.getByRole("button", { name: "新增打卡" }));
  await user.click(screen.getByRole("button", { name: "保存打卡" }));

  expect(screen.getByLabelText("活动")).toBeInvalid();
  expect(screen.getByText("请选择活动")).toBeVisible();
  expect(screen.getByLabelText("日期")).toBeInvalid();
  expect(screen.getByText("请选择日期")).toBeVisible();
  expect(screen.getByLabelText("打卡记录")).toBeInvalid();
  expect(screen.getByText("请填写打卡记录")).toBeVisible();
  expect(screen.getByLabelText("活动")).toHaveFocus();

  await user.selectOptions(
    screen.getByLabelText("活动"),
    "798-art-weekend",
  );
  await user.click(screen.getByRole("button", { name: "保存打卡" }));
  expect(screen.getByLabelText("日期")).toHaveFocus();

  await user.type(screen.getByLabelText("日期"), "2026-09-19");
  await user.click(screen.getByRole("button", { name: "保存打卡" }));
  expect(screen.getByLabelText("打卡记录")).toHaveFocus();
});

it("saves a persistent check-in and preserves the success state", async () => {
  const user = userEvent.setup();
  renderApp("/checkins");

  await user.click(screen.getByRole("button", { name: "新增打卡" }));
  await user.selectOptions(
    screen.getByLabelText("活动"),
    "798-art-weekend",
  );
  await user.type(screen.getByLabelText("日期"), "2026-09-19");
  await user.selectOptions(screen.getByLabelText("同行人数"), "pair");
  await user.click(screen.getByRole("radio", { name: "5 星" }));
  await user.type(
    screen.getByLabelText("打卡记录"),
    "展览动线清晰，下午人更多。",
  );
  await user.click(screen.getByRole("button", { name: "保存打卡" }));

  const status = screen.getByRole("status", { name: "打卡已保存" });
  expect(status).toBeVisible();
  expect(status).toHaveFocus();
  expect(screen.getByRole("dialog", { name: "记录一次出发" }))
    .toBeVisible();
  expect(screen.getByLabelText("活动")).toHaveValue("798-art-weekend");
  expect(screen.getByLabelText("日期")).toHaveValue("2026-09-19");
  expect(screen.getByLabelText("同行人数")).toHaveValue("pair");
  expect(screen.getByRole("radio", { name: "5 星" })).toBeChecked();
  expect(screen.getByLabelText("打卡记录")).toHaveValue(
    "展览动线清晰，下午人更多。",
  );
  const dialog = screen.getByRole("dialog", { name: "记录一次出发" });
  expect(
    dialog.querySelector('input[type="file"]'),
  ).not.toBeInTheDocument();
  expect(within(dialog).queryByRole("img")).not.toBeInTheDocument();

  await waitFor(() => {
    const storedState = JSON.parse(
      localStorage.getItem("citywalk:v1") ?? "",
    ) as {
      checkins: Array<{
        activityId: string;
        date: string;
        note: string;
        partySize: string;
        rating: number;
      }>;
    };
    expect(storedState.checkins[0]).toMatchObject({
      activityId: "798-art-weekend",
      date: "2026-09-19",
      note: "展览动线清晰，下午人更多。",
      partySize: "pair",
      rating: 5,
    });
  });
});

it("shows the newly saved check-in first after explicit close", async () => {
  const user = userEvent.setup();
  renderApp("/checkins", {
    ...defaultAppState,
    checkins: [
      {
        id: "checkin-older",
        activityId: "gulou-weekend-market",
        date: "2026-09-13",
        partySize: "group",
        rating: 4,
        note: "较早的一次周末记录。",
      },
    ],
  });

  await user.click(screen.getByRole("button", { name: "新增打卡" }));
  await user.selectOptions(
    screen.getByLabelText("活动"),
    "798-art-weekend",
  );
  await user.type(screen.getByLabelText("日期"), "2026-09-19");
  await user.type(
    screen.getByLabelText("打卡记录"),
    "最新保存的看展记录。",
  );
  await user.click(screen.getByRole("button", { name: "保存打卡" }));
  await user.click(
    screen.getByRole("button", { name: "关闭打卡窗口" }),
  );

  const history = screen.getByRole("region", { name: "打卡历史" });
  const records = within(history).getAllByRole("article");
  expect(records).toHaveLength(2);
  expect(records[0]).toHaveTextContent("最新保存的看展记录。");
  expect(records[1]).toHaveTextContent("较早的一次周末记录。");
});
