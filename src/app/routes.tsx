import type { RouteObject } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ActivityDetailPage } from "../features/activities/ActivityDetailPage";
import { CheckinsPage } from "../features/checkins/CheckinsPage";
import { GuidesPage } from "../features/guides/GuidesPage";
import { HomePage } from "../features/home/HomePage";
import { TeamsPage } from "../features/teams/TeamsPage";

export const appRoutes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "activity/:activityId",
        element: <ActivityDetailPage />,
      },
      {
        path: "teams",
        element: <TeamsPage />,
      },
      {
        path: "checkins",
        element: <CheckinsPage />,
      },
      {
        path: "guides",
        element: <GuidesPage />,
      },
    ],
  },
];

export function AppRoutes() {
  return useRoutes(appRoutes);
}
