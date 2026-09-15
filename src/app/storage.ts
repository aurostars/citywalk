import { guides } from "../data/guides";
import { teams } from "../data/teams";
import type {
  Checkin,
  Guide,
  Preferences,
  Team,
} from "../types/domain";

const storageKey = "citywalk:v1";

const activityTypes = new Set(["exhibition", "market", "show", "hike"]);
const budgets = new Set(["free", "under-100", "100-300"]);
const partySizes = new Set(["solo", "pair", "group"]);
const themes = new Set(["system", "light", "dark"]);

export type ThemePreference = "system" | "light" | "dark";

export interface AppState {
  onboardingComplete: boolean;
  preferences: Preferences;
  favoriteActivityIds: string[];
  teams: Team[];
  checkins: Checkin[];
  guides: Guide[];
  theme: ThemePreference;
}

export const defaultAppState: AppState = {
  onboardingComplete: false,
  preferences: {
    activityTypes: [],
    budget: "under-100",
    partySize: "pair",
  },
  favoriteActivityIds: [],
  teams,
  checkins: [],
  guides,
  theme: "system",
};

function isPreferences(value: unknown): value is Preferences {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Preferences>;
  return (
    Array.isArray(candidate.activityTypes) &&
    candidate.activityTypes.every(
      (activityType) =>
        typeof activityType === "string" &&
        activityTypes.has(activityType),
    ) &&
    typeof candidate.budget === "string" &&
    budgets.has(candidate.budget) &&
    typeof candidate.partySize === "string" &&
    partySizes.has(candidate.partySize)
  );
}

function isAppState(value: unknown): value is AppState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AppState>;
  return (
    typeof candidate.onboardingComplete === "boolean" &&
    isPreferences(candidate.preferences) &&
    Array.isArray(candidate.favoriteActivityIds) &&
    candidate.favoriteActivityIds.every(
      (activityId) => typeof activityId === "string",
    ) &&
    Array.isArray(candidate.teams) &&
    Array.isArray(candidate.checkins) &&
    Array.isArray(candidate.guides) &&
    typeof candidate.theme === "string" &&
    themes.has(candidate.theme)
  );
}

export function loadState(storage: Storage): AppState {
  try {
    const storedState = storage.getItem(storageKey);
    if (storedState === null) {
      return defaultAppState;
    }

    const parsedState: unknown = JSON.parse(storedState);
    return isAppState(parsedState) ? parsedState : defaultAppState;
  } catch {
    return defaultAppState;
  }
}

export function saveState(storage: Storage, state: AppState): boolean {
  try {
    storage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
