import { MapPin } from "@phosphor-icons/react";
import { useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAppState } from "../app/AppState";
import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

const navigationItems = [
  { label: "推荐", to: "/" },
  { label: "组队", to: "/teams" },
  { label: "打卡", to: "/checkins" },
  { label: "攻略", to: "/guides" },
];

export function AppShell() {
  const mainContentRef = useRef<HTMLElement>(null);
  const { persistenceWarning } = useAppState();

  return (
    <div className="app-shell">
      <button
        className="skip-link"
        onClick={() => mainContentRef.current?.focus()}
        type="button"
      >
        跳到主要内容
      </button>

      <header className="site-header">
        <div className="shell-container header-row">
          <Link className="brand-link" to="/">
            城迹
          </Link>

          <span className="city-label" aria-label="当前城市：北京">
            <MapPin aria-hidden="true" size={18} weight="bold" />
            北京
          </span>
          <span
            aria-label="示例数据：活动、路线、天气、队伍和攻略均为体验数据"
            className="sample-data-label"
            title="活动、路线、天气、队伍和攻略均为体验数据"
          >
            示例数据
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

      <main id="main-content" ref={mainContentRef} tabIndex={-1}>
        <div className="shell-container">
          {persistenceWarning ? (
            <p
              aria-label="浏览器存储提示"
              className="shell-persistence-warning"
              role="status"
            >
              {persistenceWarning}
            </p>
          ) : null}
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
