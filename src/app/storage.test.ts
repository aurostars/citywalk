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

const nestedState: AppState = {
  ...completedState,
  teams: [
    {
      id: "team-test",
      activityId: "activity-test",
      leader: "领队",
      departureTime: "2026-09-19T10:00",
      meetingPoint: "集合点",
      capacity: 4,
      memberCount: 2,
      note: "周末出发",
      joined: false,
      createdByUser: true,
    },
  ],
  checkins: [
    {
      id: "checkin-test",
      activityId: "activity-test",
      date: "2026-09-19",
      partySize: "pair",
      rating: 5,
      note: "值得再去",
    },
  ],
  guides: [
    {
      id: "guide-test",
      title: "周末路线",
      activityId: "activity-test",
      activityType: "market",
      summary: "从早市开始。",
      audience: "第一次来的人",
      author: "作者",
      saved: false,
      createdByUser: true,
    },
  ],
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

it.each(["teams", "checkins", "guides"] as const)(
  "falls back when %s contains a null record",
  (collection) => {
    localStorage.setItem(
      "citywalk:v1",
      JSON.stringify({ ...nestedState, [collection]: [null] }),
    );

    expect(loadState(localStorage)).toEqual(defaultAppState);
  },
);

it.each([
  ["id", null],
  ["activityId", 1],
  ["leader", false],
  ["departureTime", null],
  ["meetingPoint", []],
  ["capacity", "4"],
  ["memberCount", null],
  ["note", 1],
  ["joined", "false"],
  ["createdByUser", 1],
])("falls back when a team has malformed %s", (field, invalidValue) => {
  const team = {
    ...nestedState.teams[0],
    [field]: invalidValue,
  };
  localStorage.setItem(
    "citywalk:v1",
    JSON.stringify({ ...nestedState, teams: [team] }),
  );

  expect(loadState(localStorage)).toEqual(defaultAppState);
});

it.each([
  ["id", null],
  ["activityId", 1],
  ["date", false],
  ["partySize", "crowd"],
  ["rating", "5"],
  ["note", null],
])("falls back when a check-in has malformed %s", (field, invalidValue) => {
  const checkin = {
    ...nestedState.checkins[0],
    [field]: invalidValue,
  };
  localStorage.setItem(
    "citywalk:v1",
    JSON.stringify({ ...nestedState, checkins: [checkin] }),
  );

  expect(loadState(localStorage)).toEqual(defaultAppState);
});

it.each([
  ["id", null],
  ["title", 1],
  ["activityId", false],
  ["activityType", "walk"],
  ["summary", null],
  ["audience", []],
  ["author", 1],
  ["saved", "false"],
  ["createdByUser", 1],
])("falls back when a guide has malformed %s", (field, invalidValue) => {
  const guide = {
    ...nestedState.guides[0],
    [field]: invalidValue,
  };
  localStorage.setItem(
    "citywalk:v1",
    JSON.stringify({ ...nestedState, guides: [guide] }),
  );

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
