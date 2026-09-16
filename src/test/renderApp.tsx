import { render } from "@testing-library/react";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import {
  AppStateProvider,
  defaultAppState,
  type AppState,
} from "../app/AppState";
import { createAppRoutes } from "../app/routes";
import { ActivityDetailPage } from "../features/activities/ActivityDetailPage";
import { CheckinsPage } from "../features/checkins/CheckinsPage";
import { GuidesPage } from "../features/guides/GuidesPage";
import { HomePage } from "../features/home/HomePage";
import { TeamsPage } from "../features/teams/TeamsPage";

const testRoutes = createAppRoutes({
  activityDetail: <ActivityDetailPage />,
  checkins: <CheckinsPage />,
  guides: <GuidesPage />,
  home: <HomePage />,
  teams: <TeamsPage />,
});

export function renderApp(
  path = "/",
  initialState: AppState = defaultAppState,
) {
  const router = createMemoryRouter(testRoutes, {
    initialEntries: [path],
  });
  return render(
    <AppStateProvider initialState={initialState}>
      <RouterProvider router={router} />
    </AppStateProvider>,
  );
}
