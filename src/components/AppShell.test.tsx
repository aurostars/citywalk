import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../app/App";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(
    null,
    "",
    "#/teams?activity=798-art-weekend",
  );
});

afterEach(() => {
  window.history.replaceState(null, "", "#/");
});

it("moves keyboard focus to main content without replacing the route hash", async () => {
  const user = userEvent.setup();
  render(<App />);
  const skipAction = screen.getByRole("button", {
    name: "跳到主要内容",
  });

  await user.tab();
  expect(skipAction).toHaveFocus();
  await user.keyboard("{Enter}");

  expect(screen.getByRole("main")).toHaveFocus();
  expect(window.location.hash).toBe(
    "#/teams?activity=798-art-weekend",
  );
  expect(
    await screen.findByRole("heading", { name: "一起出发" }),
  ).toBeVisible();
  expect(screen.getByText("示例数据")).toBeVisible();
});
