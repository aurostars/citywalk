import {
  BookOpenText,
  Compass,
  MapPinLine,
  UsersThree,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface BottomNavItem {
  icon: ReactNode;
  label: string;
  to: string;
}

const navigationItems: BottomNavItem[] = [
  {
    icon: <Compass aria-hidden="true" size={22} weight="bold" />,
    label: "推荐",
    to: "/",
  },
  {
    icon: <UsersThree aria-hidden="true" size={22} weight="bold" />,
    label: "组队",
    to: "/teams",
  },
  {
    icon: <MapPinLine aria-hidden="true" size={22} weight="bold" />,
    label: "打卡",
    to: "/checkins",
  },
  {
    icon: <BookOpenText aria-hidden="true" size={22} weight="bold" />,
    label: "攻略",
    to: "/guides",
  },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="移动端导航">
      {navigationItems.map((item) => (
        <NavLink
          aria-label={`移动端${item.label}`}
          className={({ isActive }) =>
            isActive ? "bottom-nav-link is-active" : "bottom-nav-link"
          }
          end={item.to === "/"}
          key={item.to}
          to={item.to}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
