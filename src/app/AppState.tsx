import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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

export interface AddCheckinResult {
  id: string;
  persisted: boolean;
}

export interface PublishGuideResult {
  id: string;
  persisted: boolean;
}

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
  addCheckin: (checkin: Omit<Checkin, "id">) => AddCheckinResult;
  publishGuide: (
    guide: Omit<Guide, "id" | "author" | "createdByUser">,
  ) => PublishGuideResult;
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
  const stateRef = useRef(state);
  const [storageWarning, setStorageWarning] = useState<string | null>(
    storage ? null : persistenceWarning,
  );

  const commitState = useCallback(
    (update: (currentState: AppState) => AppState) => {
      const nextState = update(stateRef.current);
      stateRef.current = nextState;
      setState(nextState);

      const persisted = storage ? saveState(storage, nextState) : false;
      setStorageWarning(persisted ? null : persistenceWarning);
      return persisted;
    },
    [storage],
  );

  const savePreferences = useCallback((preferences: Preferences) => {
    commitState((currentState) => ({
      ...currentState,
      onboardingComplete: true,
      preferences,
    }));
  }, [commitState]);

  const toggleFavorite = useCallback((activityId: string) => {
    commitState((currentState) => {
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
  }, [commitState]);

  const joinTeam = useCallback((teamId: string) => {
    commitState((currentState) => ({
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
  }, [commitState]);

  const leaveTeam = useCallback((teamId: string) => {
    commitState((currentState) => ({
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
  }, [commitState]);

  const createTeam = useCallback<AppActions["createTeam"]>((team) => {
    const id = createId("team");
    commitState((currentState) => ({
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
  }, [commitState]);

  const addCheckin = useCallback<AppActions["addCheckin"]>((checkin) => {
    const id = createId("checkin");
    const persisted = commitState((currentState) => ({
      ...currentState,
      checkins: [{ ...checkin, id }, ...currentState.checkins],
    }));
    return { id, persisted };
  }, [commitState]);

  const publishGuide = useCallback<AppActions["publishGuide"]>((guide) => {
    const id = createId("guide");
    const persisted = commitState((currentState) => ({
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
    return { id, persisted };
  }, [commitState]);

  const toggleGuideSaved = useCallback((guideId: string) => {
    commitState((currentState) => ({
      ...currentState,
      guides: currentState.guides.map((guide) =>
        guide.id === guideId
          ? { ...guide, saved: !guide.saved }
          : guide,
      ),
    }));
  }, [commitState]);

  const setTheme = useCallback((theme: ThemePreference) => {
    commitState((currentState) => ({ ...currentState, theme }));
  }, [commitState]);

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
