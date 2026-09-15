import type { RouteObject } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { AppShell } from "../components/AppShell";

interface RoutePlaceholderProps {
  description: string;
  id: string;
  title: string;
}

function RoutePlaceholder({
  description,
  id,
  title,
}: RoutePlaceholderProps) {
  return (
    <section className="route-placeholder" aria-labelledby={`${id}-title`}>
      <p className="route-kicker">北京周末</p>
      <h1 id={`${id}-title`}>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export const appRoutes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <RoutePlaceholder
            description="下一步会把你的兴趣和预算变成一份可执行的北京周末路线。"
            id="recommendations"
            title="这个周末，换条路走。"
          />
        ),
      },
      {
        path: "teams",
        element: (
          <RoutePlaceholder
            description="看看谁也准备出发，找到合适的周末同行者。"
            id="teams"
            title="一起出发"
          />
        ),
      },
      {
        path: "checkins",
        element: (
          <RoutePlaceholder
            description="把去过的地方和当天的心情留在自己的城市记录里。"
            id="checkins"
            title="留下城迹"
          />
        ),
      },
      {
        path: "guides",
        element: (
          <RoutePlaceholder
            description="从真实路线和在地经验里找到下一次出发的灵感。"
            id="guides"
            title="北京攻略"
          />
        ),
      },
    ],
  },
];

export function AppRoutes() {
  return useRoutes(appRoutes);
}
