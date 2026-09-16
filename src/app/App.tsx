import { HashRouter } from "react-router-dom";
import { AppStateProvider } from "./AppState";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppStateProvider>
  );
}
