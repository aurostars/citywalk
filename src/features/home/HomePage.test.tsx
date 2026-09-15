import { fireEvent, screen, within } from "@testing-library/react";
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

it("requires an activity type and budget before generating", async () => {
  const user = userEvent.setup();
  renderApp("/");
  const submit = screen.getByRole("button", { name: "生成周末计划" });

  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  expect(submit).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  expect(submit).toBeEnabled();
});

it("reveals recommendations and supports editing saved preferences", async () => {
  const user = userEvent.setup();
  renderApp("/");

  await user.click(screen.getByRole("checkbox", { name: "看展" }));
  await user.click(screen.getByRole("radio", { name: "100 元内" }));
  await user.click(screen.getByRole("button", { name: "生成周末计划" }));

  expect(screen.getByRole("status", { name: "正在生成周末计划" })).toBeVisible();
  expect(
    await screen.findByRole("heading", { name: "为你安排的北京周末" }),
  ).toBeVisible();

  await user.click(screen.getByRole("button", { name: "调整偏好" }));
  expect(screen.getByRole("checkbox", { name: "看展" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "100 元内" })).toBeChecked();
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

it("keeps media dimensions and names the activity when an image fails", () => {
  renderApp(
    "/",
    completedState({
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    }),
  );

  const image = screen.getByRole("img", {
    name: "798 艺术区红砖厂房与正在看展的年轻人",
  });
  fireEvent.error(image);

  expect(
    screen.getByRole("img", { name: "798 当代艺术周末图片暂不可用" }),
  ).toBeVisible();
});
