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
  {
    budget: "100-300",
    expectedIds: ["free", "at-limit", "upper-limit"],
  },
])("enforces the $budget budget ceiling", ({ budget, expectedIds }) => {
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
  expect(activities).toHaveLength(8);
  expect([...new Set(activities.map(({ type }) => type))].sort()).toEqual([
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

it("covers the required Beijing venues with generated editorial images", () => {
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
    const url = new URL(imageUrl);

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image",
    );
    expect(url.searchParams.get("prompt")).toBeTruthy();
    expect(url.searchParams.get("image_size")).toBe("landscape_4_3");
    expect(imageUrl).not.toContain(" ");
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
});
