import type {
  Activity,
  Preferences,
  WeekendWeather,
} from "../../types/domain";
import { matchesBudget } from "./budget";

export function recommendActivities(
  activities: Activity[],
  preferences: Preferences,
  weather: WeekendWeather,
): Activity[] {
  return activities
    .filter((activity) => matchesBudget(activity.price, preferences.budget))
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
