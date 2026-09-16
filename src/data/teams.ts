import type { Team } from "../types/domain";

export const teams: Team[] = [
  {
    id: "team-798-saturday",
    activityId: "798-art-weekend",
    leader: "林一",
    departureTime: "2026-09-19T10:00",
    meetingPoint: "798 艺术区南门",
    capacity: 4,
    memberCount: 2,
    note: "先看主展，再一起找间安静的咖啡店整理照片。",
  },
  {
    id: "team-xiangshan-sunday",
    activityId: "xiangshan-morning-hike",
    leader: "小满",
    departureTime: "2026-09-20T07:30",
    meetingPoint: "香山公园东门",
    capacity: 5,
    memberCount: 4,
    note: "按轻松节奏上山，建议自带水和简单早餐。",
  },
  {
    id: "team-gulou-market",
    activityId: "gulou-weekend-market",
    leader: "阿哲",
    departureTime: "2026-09-19T13:00",
    meetingPoint: "鼓楼地铁站 G 口",
    capacity: 3,
    memberCount: 3,
    note: "主要逛手作和旧书摊，队伍已满。",
  },
  {
    id: "team-wenyu-cycling",
    activityId: "wenyu-river-cycling",
    leader: "许言",
    departureTime: "2026-09-19T09:00",
    meetingPoint: "温榆河公园 6 号门",
    capacity: 6,
    memberCount: 3,
    note: "骑行约两小时，新手也可以跟上，需自行准备车辆。",
  },
];
