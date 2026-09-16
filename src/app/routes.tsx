import { lazy, Suspense, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { AppShell } from "../components/AppShell";

const ActivityDetailPage = lazy(() =>
  import("../features/activities/ActivityDetailPage").then((module) => ({
    default: module.ActivityDetailPage,
  })),
);
const CheckinsPage = lazy(() =>
  import("../features/checkins/CheckinsPage").then((module) => ({
    default: module.CheckinsPage,
  })),
);
const GuidesPage = lazy(() =>
  import("../features/guides/GuidesPage").then((module) => ({
    default: module.GuidesPage,
  })),
);
const HomePage = lazy(() =>
  import("../features/home/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const TeamsPage = lazy(() =>
  import("../features/teams/TeamsPage").then((module) => ({
    default: module.TeamsPage,
  })),
);

function lazyRoute(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div aria-label="页面加载中" className="route-loading" role="status">
          <span className="route-loading-mark" />
          <span>正在打开本地内容</span>
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export interface AppRouteElements {
  activityDetail: ReactNode;
  checkins: ReactNode;
  guides: ReactNode;
  home: ReactNode;
  teams: ReactNode;
}

export function createAppRoutes(
  elements: AppRouteElements,
): RouteObject[] {
  return [
    {
      element: <AppShell />,
      children: [
        {
          index: true,
          element: elements.home,
        },
        {
          path: "activity/:activityId",
          element: elements.activityDetail,
        },
        {
          path: "teams",
          element: elements.teams,
        },
        {
          path: "checkins",
          element: elements.checkins,
        },
        {
          path: "guides",
          element: elements.guides,
        },
      ],
    },
  ];
}

export const appRoutes = createAppRoutes({
  activityDetail: lazyRoute(<ActivityDetailPage />),
  checkins: lazyRoute(<CheckinsPage />),
  guides: lazyRoute(<GuidesPage />),
  home: lazyRoute(<HomePage />),
  teams: lazyRoute(<TeamsPage />),
});

export function AppRoutes() {
  return useRoutes(appRoutes);
}
