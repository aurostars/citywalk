import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Checkin,
  Guide,
  Preferences,
  Team,
} from "../types/domain";
import {
  defaultAppState,
  loadState,
  saveState,
  type AppState,
  type ThemePreference,
} from "./storage";

export {
  defaultAppState,
  type AppState,
  type ThemePreference,
} from "./storage";

const persistenceWarning =
  "更改已保留在当前页面，但无法写入浏览器存储。";

export type AppActions = {
  savePreferences: (preferences: Preferences) => void;
  toggleFavorite: (activityId: string) => void;
  joinTeam: (teamId: string) => void;
  leaveTeam: (teamId: string) => void;
  createTeam: (
    team: Omit<
      Team,
      "id" | "memberCount" | "joined" | "createdByUser"
    >,
  ) => string;
  addCheckin: (checkin: Omit<Checkin, "id">) => string;
  publishGuide: (
    guide: Omit<Guide, "id" | "author" | "createdByUser">,
  ) => string;
  toggleGuideSaved: (guideId: string) => void;
  setTheme: (theme: "system" | "light" | "dark") => void;
};

interface AppStateContextValue extends AppActions {
  state: AppState;
  persistenceWarning: string | null;
}

interface AppStateProviderProps {
  children: ReactNode;
  initialState?: AppState;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function createId(prefix: "checkin" | "guide" | "team") {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

export function AppStateProvider({
  children,
  initialState,
}: AppStateProviderProps) {
  const [storage] = useState(getBrowserStorage);
  const [state, setState] = useState<AppState>(() =>
    initialState ?? (storage ? loadState(storage) : defaultAppState),
  );
  const [storageWarning, setStorageWarning] = useState<string | null>(
    storage ? null : persistenceWarning,
  );

  useEffect(() => {
    if (!storage || !saveState(storage, state)) {
      setStorageWarning(persistenceWarning);
      return;
    }

    setStorageWarning(null);
  }, [state, storage]);

  const savePreferences = useCallback((preferences: Preferences) => {
    setState((currentState) => ({
      ...currentState,
      onboardingComplete: true,
      preferences,
    }));
  }, []);

  const toggleFavorite = useCallback((activityId: string) => {
    setState((currentState) => {
      const isFavorite =
        currentState.favoriteActivityIds.includes(activityId);
      return {
        ...currentState,
        favoriteActivityIds: isFavorite
          ? currentState.favoriteActivityIds.filter(
              (favoriteId) => favoriteId !== activityId,
            )
          : [...currentState.favoriteActivityIds, activityId],
      };
    });
  }, []);

  const joinTeam = useCallback((teamId: string) => {
    setState((currentState) => ({
      ...currentState,
      teams: currentState.teams.map((team) => {
        if (
          team.id !== teamId ||
          team.joined ||
          team.memberCount >= team.capacity
        ) {
          return team;
        }

        return {
          ...team,
          joined: true,
          memberCount: team.memberCount + 1,
        };
      }),
    }));
  }, []);

  const leaveTeam = useCallback((teamId: string) => {
    setState((currentState) => ({
      ...currentState,
      teams: currentState.teams.map((team) => {
        if (team.id !== teamId || !team.joined) {
          return team;
        }

        return {
          ...team,
          joined: false,
          memberCount: Math.max(0, team.memberCount - 1),
        };
      }),
    }));
  }, []);

  const createTeam = useCallback<AppActions["createTeam"]>((team) => {
    const id = createId("team");
    setState((currentState) => ({
      ...currentState,
      teams: [
        {
          ...team,
          id,
          memberCount: 1,
          joined: true,
          createdByUser: true,
        },
        ...currentState.teams,
      ],
    }));
    return id;
  }, []);

  const addCheckin = useCallback<AppActions["addCheckin"]>((checkin) => {
    const id = createId("checkin");
    setState((currentState) => ({
      ...currentState,
      checkins: [{ ...checkin, id }, ...currentState.checkins],
    }));
    return id;
  }, []);

  const publishGuide = useCallback<AppActions["publishGuide"]>((guide) => {
    const id = createId("guide");
    setState((currentState) => ({
      ...currentState,
      guides: [
        {
          ...guide,
          id,
          author: "我",
          createdByUser: true,
        },
        ...currentState.guides,
      ],
    }));
    return id;
  }, []);

  const toggleGuideSaved = useCallback((guideId: string) => {
    setState((currentState) => ({
      ...currentState,
      guides: currentState.guides.map((guide) =>
        guide.id === guideId
          ? { ...guide, saved: !guide.saved }
          : guide,
      ),
    }));
  }, []);

  const setTheme = useCallback((theme: ThemePreference) => {
    setState((currentState) => ({ ...currentState, theme }));
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      persistenceWarning: storageWarning,
      savePreferences,
      toggleFavorite,
      joinTeam,
      leaveTeam,
      createTeam,
      addCheckin,
      publishGuide,
      toggleGuideSaved,
      setTheme,
    }),
    [
      addCheckin,
      createTeam,
      joinTeam,
      leaveTeam,
      publishGuide,
      savePreferences,
      setTheme,
      state,
      storageWarning,
      toggleFavorite,
      toggleGuideSaved,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return value;
}
