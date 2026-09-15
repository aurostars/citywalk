import {
  CloudSun,
  Drop,
  Sun,
} from "@phosphor-icons/react";
import type {
  Activity,
  WeekendWeather,
} from "../../types/domain";

interface WeatherSummaryProps {
  leadActivity?: Activity;
  weather: WeekendWeather;
}

const weatherLabels: Record<WeekendWeather["kind"], string> = {
  cloudy: "多云",
  rain: "有雨",
  sunny: "晴朗",
};

export function WeatherSummary({
  leadActivity,
  weather,
}: WeatherSummaryProps) {
  const WeatherIcon =
    weather.kind === "sunny"
      ? Sun
      : weather.kind === "rain"
        ? Drop
        : CloudSun;
  const recommendationReason = leadActivity
    ? `${leadActivity.venue}适合${weatherLabels[weather.kind]}天气，且符合当前预算与同行人数。`
    : "当前条件没有严格匹配，可以查看同预算下的相近活动。";

  return (
    <section className="weather-summary" aria-labelledby="weather-title">
      <div className="weather-reading">
        <WeatherIcon aria-hidden="true" size={30} weight="duotone" />
        <div>
          <p id="weather-title">本周末示例天气</p>
          <strong>
            {weatherLabels[weather.kind]} {weather.temperature}
          </strong>
        </div>
      </div>
      <p className="weather-copy">{weather.summary}</p>
      <p className="weather-reason">
        <span>推荐理由</span>
        {recommendationReason}
      </p>
    </section>
  );
}
