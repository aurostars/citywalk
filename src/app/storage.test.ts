import {
  type AppState,
  defaultAppState,
} from "./AppState";
import { loadState, saveState } from "./storage";

const completedState: AppState = {
  ...defaultAppState,
  onboardingComplete: true,
  preferences: {
    activityTypes: ["exhibition", "market"],
    budget: "under-100",
    partySize: "pair",
  },
};

beforeEach(() => {
  localStorage.clear();
});

it("falls back when stored JSON is corrupt", () => {
  localStorage.setItem("citywalk:v1", "{");
  expect(loadState(localStorage)).toEqual(defaultAppState);
});

it("falls back when stored state is incomplete", () => {
  localStorage.setItem("citywalk:v1", JSON.stringify({ theme: "dark" }));
  expect(loadState(localStorage)).toEqual(defaultAppState);
});

it("restores completed onboarding and preferences", () => {
  saveState(localStorage, completedState);
  expect(loadState(localStorage).onboardingComplete).toBe(true);
  expect(loadState(localStorage).preferences).toEqual(
    completedState.preferences,
  );
});

it("saves state in the versioned citywalk namespace", () => {
  saveState(localStorage, completedState);
  expect(localStorage.getItem("citywalk:v1")).toBe(
    JSON.stringify(completedState),
  );
});
