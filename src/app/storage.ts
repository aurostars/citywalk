import { guides } from "../data/guides";
import { teams } from "../data/teams";
import type {
  Checkin,
  Guide,
  Preferences,
  Team,
} from "../types/domain";

const storageKey = "citywalk:v1";

const activityTypes = new Set([
  "exhibition",
  "market",
  "show",
  "hike",
  "entertainment",
]);
const budgets = new Set([
  "free",
  "under-100",
  "100-300",
  "above-300",
  "any",
]);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

function isPreferences(value: unknown): value is Preferences {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.activityTypes) &&
    value.activityTypes.every(
      (activityType) =>
        typeof activityType === "string" &&
        activityTypes.has(activityType),
    ) &&
    typeof value.budget === "string" &&
    budgets.has(value.budget) &&
    typeof value.partySize === "string" &&
    partySizes.has(value.partySize)
  );
}

function isTeam(value: unknown): value is Team {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.activityId === "string" &&
    typeof value.leader === "string" &&
    typeof value.departureTime === "string" &&
    typeof value.meetingPoint === "string" &&
    typeof value.capacity === "number" &&
    typeof value.memberCount === "number" &&
    typeof value.note === "string" &&
    isOptionalBoolean(value.joined) &&
    isOptionalBoolean(value.createdByUser)
  );
}

function isCheckin(value: unknown): value is Checkin {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.activityId === "string" &&
    typeof value.date === "string" &&
    typeof value.partySize === "string" &&
    partySizes.has(value.partySize) &&
    typeof value.rating === "number" &&
    typeof value.note === "string"
  );
}

function isGuide(value: unknown): value is Guide {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.activityId === "string" &&
    typeof value.activityType === "string" &&
    activityTypes.has(value.activityType) &&
    typeof value.summary === "string" &&
    typeof value.audience === "string" &&
    typeof value.author === "string" &&
    isOptionalBoolean(value.saved) &&
    isOptionalBoolean(value.createdByUser)
  );
}

function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.onboardingComplete === "boolean" &&
    isPreferences(value.preferences) &&
    Array.isArray(value.favoriteActivityIds) &&
    value.favoriteActivityIds.every(
      (activityId) => typeof activityId === "string",
    ) &&
    Array.isArray(value.teams) &&
    value.teams.every(isTeam) &&
    Array.isArray(value.checkins) &&
    value.checkins.every(isCheckin) &&
    Array.isArray(value.guides) &&
    value.guides.every(isGuide) &&
    typeof value.theme === "string" &&
    themes.has(value.theme)
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
