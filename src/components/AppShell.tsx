import { MapPin } from "@phosphor-icons/react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

const navigationItems = [
  { label: "推荐", to: "/" },
  { label: "组队", to: "/teams" },
  { label: "打卡", to: "/checkins" },
  { label: "攻略", to: "/guides" },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <header className="site-header">
        <div className="shell-container header-row">
          <Link className="brand-link" to="/">
            城迹
          </Link>

          <span className="city-label" aria-label="当前城市：北京">
            <MapPin aria-hidden="true" size={18} weight="bold" />
            北京
          </span>

          <nav className="desktop-nav" aria-label="主导航">
            <ul>
              {navigationItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    className={({ isActive }) =>
                      isActive ? "nav-link is-active" : "nav-link"
                    }
                    end={item.to === "/"}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div className="shell-container">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
