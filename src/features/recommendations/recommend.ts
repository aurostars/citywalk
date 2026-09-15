import type {
  Activity,
  Budget,
  Preferences,
  WeekendWeather,
} from "../../types/domain";

const budgetCeilings: Record<Budget, number> = {
  free: 0,
  "under-100": 100,
  "100-300": 300,
};

function isWithinBudget(price: number, budget: Budget): boolean {
  return price <= budgetCeilings[budget];
}

export function recommendActivities(
  activities: Activity[],
  preferences: Preferences,
  weather: WeekendWeather,
): Activity[] {
  return activities
    .filter((activity) => isWithinBudget(activity.price, preferences.budget))
    .map((activity) => ({
      activity,
      score:
        (preferences.activityTypes.includes(activity.type) ? 4 : 0) +
        (activity.weatherKinds.includes(weather.kind) ? 2 : 0) +
        (activity.suitablePartySizes.includes(preferences.partySize) ? 1 : 0),
    }))
    .filter(({ score }) => score >= 5)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.activity.editorOrder - b.activity.editorOrder,
    )
    .map(({ activity }) => activity);
}
