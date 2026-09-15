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
import { appRoutes } from "../app/routes";

export function renderApp(
  path = "/",
  initialState: AppState = defaultAppState,
) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  });
  return render(
    <AppStateProvider initialState={initialState}>
      <RouterProvider router={router} />
    </AppStateProvider>,
  );
}
