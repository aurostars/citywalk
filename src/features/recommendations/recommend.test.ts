vi.hoisted(() => {
  vi.stubEnv("BASE_URL", "/citywalk/");
});

import { activities } from "../../data/activities";
import { guides } from "../../data/guides";
import { weekendRoutes } from "../../data/routes";
import { teams } from "../../data/teams";
import { rainyWeekend, sunnyWeekend } from "../../data/weather";
import type {
  Activity,
  Budget,
  Preferences,
  WeatherKind,
} from "../../types/domain";
import { recommendActivities } from "./recommend";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "test-activity",
    title: "测试活动",
    type: "exhibition",
    price: 80,
    district: "朝阳区",
    venue: "测试场馆",
    indoor: true,
    suitablePartySizes: ["pair"],
    weatherKinds: ["rain"],
    availableWeekdays: ["saturday"],
    startTime: "10:00",
    schedule: "周六 10:00-18:00",
    durationMinutes: 120,
    imageUrl:
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=Realistic%20editorial%20photograph%20of%20a%20Beijing%20gallery&image_size=landscape_4_3",
    imageAlt: "北京室内展览空间",
    summary: "用于验证推荐规则的活动。",
    editorOrder: 1,
    ...overrides,
  };
}

function scheduleIncludesDeparture(
  schedule: string,
  departureTime: string,
): boolean {
  const [dayRange, timeRange] = schedule.split(" ");
  const [startDay, endDay = startDay] = dayRange.split("至");
  const [startTime, endTime] = timeRange.split("-");
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const departureDay = weekdays[
    new Date(`${departureTime.slice(0, 10)}T00:00:00Z`).getUTCDay()
  ];
  const departureClock = departureTime.slice(11, 16);
  const startDayIndex = weekdays.indexOf(startDay);
  const endDayIndex = weekdays.indexOf(endDay);
  const departureDayIndex = weekdays.indexOf(departureDay);
  const includesDay =
    startDayIndex <= endDayIndex
      ? departureDayIndex >= startDayIndex &&
        departureDayIndex <= endDayIndex
      : departureDayIndex >= startDayIndex ||
        departureDayIndex <= endDayIndex;

  return (
    includesDay &&
    departureClock >= startTime &&
    departureClock <= endTime
  );
}

const strictPreferences: Preferences = {
  activityTypes: ["exhibition"],
  budget: "free",
  partySize: "pair",
};

const impossibleFixtures: Activity[] = [
  makeActivity({
    id: "sunny-solo-hike",
    type: "hike",
    price: 0,
    indoor: false,
    suitablePartySizes: ["solo"],
    weatherKinds: ["sunny"],
  }),
];

it("prioritizes matching indoor activities on rainy weekends", () => {
  const result = recommendActivities(
    activities,
    {
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    },
    rainyWeekend,
  );

  expect(result[0]).toMatchObject({
    type: "exhibition",
    indoor: true,
  });
  expect(result[0].price).toBeLessThanOrEqual(100);
});

it("returns an empty list when strict filters have no match", () => {
  expect(
    recommendActivities(
      impossibleFixtures,
      strictPreferences,
      sunnyWeekend,
    ),
  ).toEqual([]);
});

it.each<{
  budget: Budget;
  expectedIds: string[];
}>([
  { budget: "free", expectedIds: ["free"] },
  { budget: "under-100", expectedIds: ["free", "at-limit"] },
  { budget: "100-300", expectedIds: ["upper-limit"] },
  { budget: "above-300", expectedIds: ["over-limit"] },
  {
    budget: "any",
    expectedIds: ["free", "at-limit", "upper-limit", "over-limit"],
  },
])("applies the $budget budget policy", ({ budget, expectedIds }) => {
  const budgetFixtures = [
    makeActivity({ id: "free", price: 0, editorOrder: 1 }),
    makeActivity({ id: "at-limit", price: 100, editorOrder: 2 }),
    makeActivity({ id: "upper-limit", price: 300, editorOrder: 3 }),
    makeActivity({ id: "over-limit", price: 301, editorOrder: 4 }),
  ];

  const result = recommendActivities(
    budgetFixtures,
    {
      activityTypes: ["exhibition"],
      budget,
      partySize: "pair",
    },
    rainyWeekend,
  );

  expect(result.map(({ id }) => id)).toEqual(expectedIds);
});

it("ranks weather suitability above party-size suitability", () => {
  const result = recommendActivities(
    [
      makeActivity({
        id: "party-match",
        suitablePartySizes: ["pair"],
        weatherKinds: ["sunny"],
        editorOrder: 1,
      }),
      makeActivity({
        id: "weather-match",
        suitablePartySizes: ["solo"],
        weatherKinds: ["rain"],
        editorOrder: 99,
      }),
    ],
    {
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    },
    rainyWeekend,
  );

  expect(result.map(({ id }) => id)).toEqual([
    "weather-match",
    "party-match",
  ]);
});

it("uses ascending editor order to break score ties", () => {
  const result = recommendActivities(
    [
      makeActivity({ id: "second", editorOrder: 2 }),
      makeActivity({ id: "first", editorOrder: 1 }),
    ],
    {
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    },
    rainyWeekend,
  );

  expect(result.map(({ id }) => id)).toEqual(["first", "second"]);
});

it("keeps free and 528 yuan activities before sorting an unlimited budget", () => {
  const result = recommendActivities(
    [
      makeActivity({
        id: "free-weather-mismatch",
        editorOrder: 1,
        price: 0,
        weatherKinds: ["sunny"],
      }),
      makeActivity({
        id: "premium-weather-match",
        editorOrder: 99,
        price: 528,
        weatherKinds: ["rain"],
      }),
    ],
    {
      activityTypes: ["exhibition"],
      budget: "any",
      partySize: "pair",
    },
    rainyWeekend,
  );

  expect(result.map(({ id, price }) => ({ id, price }))).toEqual([
    { id: "premium-weather-match", price: 528 },
    { id: "free-weather-mismatch", price: 0 },
  ]);
});

it("does not mutate the supplied activity order", () => {
  const input = [
    makeActivity({ id: "second", editorOrder: 2 }),
    makeActivity({ id: "first", editorOrder: 1 }),
  ];

  recommendActivities(
    input,
    {
      activityTypes: ["exhibition"],
      budget: "under-100",
      partySize: "pair",
    },
    rainyWeekend,
  );

  expect(input.map(({ id }) => id)).toEqual(["second", "first"]);
});

it("covers all required fixture dimensions", () => {
  expect(activities).toHaveLength(12);
  expect([...new Set(activities.map(({ type }) => type))].sort()).toEqual([
    "entertainment",
    "exhibition",
    "hike",
    "market",
    "show",
  ]);
  expect(
    [
      ...new Set(
        activities.flatMap(({ suitablePartySizes }) => suitablePartySizes),
      ),
    ].sort(),
  ).toEqual(["group", "pair", "solo"]);
  expect(
    [
      ...new Set(
        activities.flatMap(({ weatherKinds }) => weatherKinds),
      ),
    ].sort() satisfies WeatherKind[],
  ).toEqual(["cloudy", "rain", "sunny"]);
  expect(activities.some(({ price }) => price === 0)).toBe(true);
  expect(activities.some(({ price }) => price > 0 && price <= 100)).toBe(
    true,
  );
  expect(activities.some(({ price }) => price > 100 && price <= 300)).toBe(
    true,
  );
});

it("includes the approved premium weekend activities", () => {
  expect(
    activities
      .filter(({ id }) =>
        [
          "universal-beijing-day",
          "tianqiao-musical-night",
          "indoor-ski-weekend",
          "immersive-theatre-weekend",
        ].includes(id),
      )
      .map(({ id, price, type }) => ({ id, price, type })),
  ).toEqual([
    { id: "universal-beijing-day", price: 528, type: "entertainment" },
    { id: "tianqiao-musical-night", price: 480, type: "show" },
    { id: "indoor-ski-weekend", price: 420, type: "entertainment" },
    {
      id: "immersive-theatre-weekend",
      price: 380,
      type: "entertainment",
    },
  ]);
});

it("covers the required Beijing venues with static editorial images", () => {
  const activityCopy = activities.map(
    ({ summary, title, venue }) => `${title} ${venue} ${summary}`,
  );

  for (const venue of [
    "798",
    "鼓楼",
    "亮马河",
    "国家大剧院",
    "潘家园",
    "首钢园",
    "香山",
    "温榆河",
  ]) {
    expect(activityCopy.some((copy) => copy.includes(venue))).toBe(true);
  }

  for (const { imageUrl } of activities) {
    expect(imageUrl).toMatch(
      /^\/citywalk\/images\/activities\/[a-z0-9-]+\.webp$/,
    );
    expect(imageUrl).not.toContain("text_to_image");
  }
});

it("keeps related fixtures connected to known activities", () => {
  const activityIds = new Set(activities.map(({ id }) => id));

  for (const route of weekendRoutes) {
    expect(route.activityIds.length).toBeGreaterThan(0);
    expect(
      route.activityIds.every((activityId) => activityIds.has(activityId)),
    ).toBe(true);
  }
  expect(teams.every(({ activityId }) => activityIds.has(activityId))).toBe(
    true,
  );
  expect(guides.every(({ activityId }) => activityIds.has(activityId))).toBe(
    true,
  );

  expect(
    weekendRoutes.find(({ id }) => id === "west-city-stage-day"),
  ).toMatchObject({
    activityIds: ["ncpa-weekend-concert", "tianqiao-musical-night"],
    totalPrice: 660,
  });
  expect(
    teams.find(({ id }) => id === "team-universal-sunday"),
  ).toMatchObject({
    activityId: "universal-beijing-day",
  });
  expect(
    guides.find(({ id }) => id === "guide-tianqiao-musical"),
  ).toMatchObject({
    activityId: "tianqiao-musical-night",
  });
});

it("keeps every one-day route on a common weekday in stated order", () => {
  const activitiesById = new Map(
    activities.map((activity) => [activity.id, activity]),
  );
  const weekendDays = ["saturday", "sunday"] as const;
  const invalidRouteIds = weekendRoutes.flatMap((route) => {
    const routeActivities = route.activityIds.flatMap((activityId) => {
      const activity = activitiesById.get(activityId);
      return activity ? [activity] : [];
    });
    const validDays = weekendDays.filter((day) => {
      const startTimes = routeActivities.map(
        (activity) => activity.startTime,
      );

      return (
        routeActivities.length === route.activityIds.length &&
        routeActivities.every((activity) =>
          activity.availableWeekdays.includes(day)
        ) &&
        startTimes.every(
          (startTime, index) =>
            index === 0 || startTimes[index - 1] <= startTime,
        )
      );
    });

    return validDays.length > 0 ? [] : [route.id];
  });

  expect(invalidRouteIds).toEqual([]);
});

it("schedules every team departure during its activity", () => {
  const activitiesById = new Map(
    activities.map((activity) => [activity.id, activity]),
  );
  const conflictingTeamIds = teams
    .filter((team) => {
      const activity = activitiesById.get(team.activityId);

      return (
        !activity ||
        !scheduleIncludesDeparture(activity.schedule, team.departureTime)
      );
    })
    .map(({ id }) => id);

  expect(conflictingTeamIds).toEqual([]);
});

it("advertises only party sizes supported by every route activity", () => {
  const activitiesById = new Map(
    activities.map((activity) => [activity.id, activity]),
  );
  const unsupportedRoutePartySizes = weekendRoutes.flatMap((route) =>
    route.suitablePartySizes.flatMap((partySize) =>
      route.activityIds.flatMap((activityId) => {
        const activity = activitiesById.get(activityId);

        return activity?.suitablePartySizes.includes(partySize)
          ? []
          : [`${route.id}:${partySize}:${activityId}`];
      }),
    ),
  );

  expect(unsupportedRoutePartySizes).toEqual([]);
});
