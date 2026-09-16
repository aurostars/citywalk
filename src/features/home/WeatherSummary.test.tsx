import { render, screen } from "@testing-library/react";
import { activities } from "../../data/activities";
import { weekendWeather } from "../../data/weather";
import { WeatherSummary } from "./WeatherSummary";

it("states party suitability when the recommendation actually matches", () => {
  render(
    <WeatherSummary
      leadActivity={activities[0]}
      partySize="solo"
      weather={weekendWeather}
    />,
  );
  expect(screen.getByRole("region")).toHaveTextContent("适合当前同行人数");
  expect(screen.getByRole("region")).not.toHaveTextContent("不完全匹配");
});

it("does not turn a weather ranking preference into a suitability guarantee", () => {
  render(
    <WeatherSummary
      leadActivity={{ ...activities[0], weatherKinds: ["sunny"] }}
      partySize="solo"
      weather={weekendWeather}
    />,
  );
  expect(screen.getByRole("region")).toHaveTextContent("天气与活动建议不完全匹配");
  expect(screen.getByRole("region")).not.toHaveTextContent("适合多云天气");
});
