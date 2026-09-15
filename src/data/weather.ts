import type { WeekendWeather } from "../types/domain";

export const sunnyWeekend: WeekendWeather = {
  kind: "sunny",
  temperature: "18-27°C",
  summary: "示例天气为晴朗，适合公园、胡同和水岸活动。",
};

export const cloudyWeekend: WeekendWeather = {
  kind: "cloudy",
  temperature: "16-23°C",
  summary: "示例天气为多云，体感舒适，室内外路线都容易安排。",
};

export const rainyWeekend: WeekendWeather = {
  kind: "rain",
  temperature: "14-19°C",
  summary: "示例天气有雨，优先考虑展馆、剧场等室内活动。",
};

export const weekendWeather = cloudyWeekend;
