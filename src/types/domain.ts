export type ActivityType = "exhibition" | "market" | "show" | "hike";
export type Budget = "free" | "under-100" | "100-300";
export type PartySize = "solo" | "pair" | "group";
export type WeatherKind = "sunny" | "cloudy" | "rain";

export interface Preferences {
  activityTypes: ActivityType[];
  budget: Budget;
  partySize: PartySize;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  price: number;
  district: string;
  venue: string;
  indoor: boolean;
  suitablePartySizes: PartySize[];
  weatherKinds: WeatherKind[];
  schedule: string;
  durationMinutes: number;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  editorOrder: number;
}

export interface WeekendWeather {
  kind: WeatherKind;
  temperature: string;
  summary: string;
}

export interface Team {
  id: string;
  activityId: string;
  leader: string;
  departureTime: string;
  meetingPoint: string;
  capacity: number;
  memberCount: number;
  note: string;
  joined?: boolean;
  createdByUser?: boolean;
}

export interface Checkin {
  id: string;
  activityId: string;
  date: string;
  partySize: PartySize;
  rating: number;
  note: string;
}

export interface Guide {
  id: string;
  title: string;
  activityId: string;
  activityType: ActivityType;
  summary: string;
  audience: string;
  author: string;
  saved?: boolean;
  createdByUser?: boolean;
}

export interface WeekendRoute {
  id: string;
  title: string;
  activityIds: string[];
  summary: string;
  totalPrice: number;
  durationMinutes: number;
  weatherKinds: WeatherKind[];
  suitablePartySizes: PartySize[];
  editorOrder: number;
}
