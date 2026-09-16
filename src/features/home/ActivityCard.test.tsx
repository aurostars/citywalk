import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  AppStateProvider,
  defaultAppState,
} from "../../app/AppState";
import { activities } from "../../data/activities";
import { ActivityCard } from "./ActivityCard";

beforeEach(() => {
  localStorage.clear();
});

it("toggles the activity favorite without hiding the detail route", async () => {
  const user = userEvent.setup();
  const activity = activities[0];
  render(
    <AppStateProvider initialState={defaultAppState}>
      <MemoryRouter>
        <ActivityCard activity={activity} />
      </MemoryRouter>
    </AppStateProvider>,
  );

  expect(
    screen.getByRole("link", {
      name: `查看${activity.title}详情`,
    }),
  ).toHaveAttribute("href", `/activity/${activity.id}`);

  await user.click(
    screen.getByRole("button", {
      name: `收藏${activity.title}`,
    }),
  );

  expect(
    screen.getByRole("button", {
      name: `取消收藏${activity.title}`,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await waitFor(() => {
    const state = JSON.parse(
      localStorage.getItem("citywalk:v1") ?? "",
    ) as { favoriteActivityIds: string[] };
    expect(state.favoriteActivityIds).toContain(activity.id);
  });
});
