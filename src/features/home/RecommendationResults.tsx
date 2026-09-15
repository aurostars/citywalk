import {
  ArrowRight,
  BookOpenText,
  CalendarBlank,
  Clock,
  Coins,
  MapPinLine,
  UsersThree,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { activities as allActivities } from "../../data/activities";
import { weekendRoutes } from "../../data/routes";
import type {
  Activity,
  Budget,
  Checkin,
  Guide,
  Preferences,
  Team,
  WeekendRoute,
  WeekendWeather,
} from "../../types/domain";
import { ActivityCard } from "./ActivityCard";
import { WeatherSummary } from "./WeatherSummary";

interface RecommendationResultsProps {
  activities: Activity[];
  checkins: Checkin[];
  guides: Guide[];
  isRelaxed: boolean;
  onShowRelaxed: () => void;
  preferences: Preferences;
  teams: Team[];
  weather: WeekendWeather;
}

const budgetCeilings: Record<Budget, number> = {
  "100-300": 300,
  free: 0,
  "under-100": 100,
};

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return minutes === 0 ? `${hours} 小时` : `${hours} 小时 ${minutes} 分`;
}

function findRoute(
  activity: Activity,
  preferences: Preferences,
  weather: WeekendWeather,
): WeekendRoute | undefined {
  return weekendRoutes
    .filter(
      (route) =>
        route.activityIds.includes(activity.id) &&
        route.totalPrice <= budgetCeilings[preferences.budget] &&
        route.weatherKinds.includes(weather.kind) &&
        route.suitablePartySizes.includes(preferences.partySize),
    )
    .sort((a, b) => a.editorOrder - b.editorOrder)[0];
}

export function RecommendationResults({
  activities,
  checkins,
  guides,
  isRelaxed,
  onShowRelaxed,
  preferences,
  teams,
  weather,
}: RecommendationResultsProps) {
  const leadActivity = activities[0];
  const route = leadActivity
    ? findRoute(leadActivity, preferences, weather)
    : undefined;
  const activityById = new Map(
    allActivities.map((activity) => [activity.id, activity]),
  );

  if (!leadActivity) {
    return (
      <>
        <WeatherSummary weather={weather} />
        <section className="empty-results" aria-labelledby="empty-title">
          <p>当前筛选保留不变</p>
          <h2 id="empty-title">这组条件暂时没有匹配</h2>
          <p>
            可以提高预算或增加活动类型，也可以先看同预算下适合本周天气的活动。
          </p>
          <button
            className="secondary-action"
            onClick={onShowRelaxed}
            type="button"
          >
            一键查看相近活动
            <ArrowRight aria-hidden="true" size={19} weight="bold" />
          </button>
        </section>
      </>
    );
  }

  const routeActivities = route
    ? route.activityIds.flatMap((activityId) => {
        const activity = activityById.get(activityId);
        return activity ? [activity] : [];
      })
    : [leadActivity];
  const routeTitle = route?.title ?? `${leadActivity.venue}单站慢游`;
  const routeSummary =
    route?.summary ??
    `把${leadActivity.title}作为主行程，按现场节奏留出休息和返程时间。`;
  const routePrice = route?.totalPrice ?? leadActivity.price;
  const routeDuration =
    route?.durationMinutes ?? leadActivity.durationMinutes;
  const matchingTeams = teams
    .filter((team) =>
      activities.some((activity) => activity.id === team.activityId),
    )
    .slice(0, 2);
  const previewTeams =
    matchingTeams.length > 0 ? matchingTeams : teams.slice(0, 2);
  const matchingGuide =
    guides.find((guide) => guide.activityId === leadActivity.id) ??
    guides[0];
  const latestCheckin = checkins[0];

  return (
    <>
      <WeatherSummary leadActivity={leadActivity} weather={weather} />

      {isRelaxed ? (
        <p className="relaxed-notice" role="status">
          正在展示同预算下更接近的活动，原偏好没有改变。
        </p>
      ) : null}

      <section className="lead-route" aria-labelledby="route-title">
        <div className="route-copy">
          <p className="section-label">本期路线</p>
          <h2 id="route-title">{routeTitle}</h2>
          <p className="route-summary">{routeSummary}</p>

          <dl className="route-facts">
            <div>
              <dt>
                <Coins aria-hidden="true" size={18} weight="bold" />
                预算
              </dt>
              <dd>{routePrice === 0 ? "免费" : `${routePrice} 元`}</dd>
            </div>
            <div>
              <dt>
                <Clock aria-hidden="true" size={18} weight="bold" />
                时长
              </dt>
              <dd>{formatDuration(routeDuration)}</dd>
            </div>
            <div>
              <dt>
                <CalendarBlank aria-hidden="true" size={18} weight="bold" />
                天气
              </dt>
              <dd>适合本周示例天气</dd>
            </div>
          </dl>

          <ol className="route-stops" aria-label="路线活动">
            {routeActivities.map((activity, index) => (
              <li key={activity.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.schedule}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <article className="lead-activity" aria-label="首选活动">
          <ImageWithFallback
            alt={leadActivity.imageAlt}
            className="lead-activity-image"
            fallbackLabel={leadActivity.title}
            height={780}
            loading="eager"
            src={leadActivity.imageUrl}
            width={1040}
          />
          <div className="lead-activity-copy">
            <p>
              {leadActivity.district} / {leadActivity.venue}
            </p>
            <h3>{leadActivity.title}</h3>
            <Link
              aria-label={`查看${leadActivity.title}详情`}
              className="light-action"
              to={`/activity/${leadActivity.id}`}
            >
              查看首选活动
              <ArrowRight aria-hidden="true" size={19} weight="bold" />
            </Link>
          </div>
        </article>
      </section>

      {activities.length > 1 ? (
        <section className="alternatives" aria-labelledby="alternatives-title">
          <div className="section-heading">
            <h2 id="alternatives-title">还可以这样过</h2>
            <p>同样符合预算和天气，按当前同行人数重新排序。</p>
          </div>
          <div className="activity-grid">
            {activities.slice(1, 5).map((activity) => (
              <ActivityCard activity={activity} key={activity.id} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="weekend-previews" aria-label="继续安排周末">
        <article className="team-preview">
          <div className="preview-heading">
            <UsersThree aria-hidden="true" size={25} weight="duotone" />
            <div>
              <p>近期出发</p>
              <h2>找人同行</h2>
            </div>
          </div>
          <div className="team-lines">
            {previewTeams.map((team) => {
              const activity = activityById.get(team.activityId);
              return (
                <div key={team.id}>
                  <strong>{activity?.title ?? "北京周末活动"}</strong>
                  <span>
                    {team.memberCount}/{team.capacity} 人，{team.meetingPoint}
                  </span>
                </div>
              );
            })}
          </div>
          <Link className="text-action" to="/teams">
            查看组队
            <ArrowRight aria-hidden="true" size={18} weight="bold" />
          </Link>
        </article>

        <article className="checkin-preview">
          <div className="preview-heading">
            <MapPinLine aria-hidden="true" size={25} weight="duotone" />
            <div>
              <p>城市记录</p>
              <h2>{latestCheckin ? "最近一次打卡" : "留下第一条城迹"}</h2>
            </div>
          </div>
          <p>
            {latestCheckin
              ? latestCheckin.note
              : "出发回来后，把地点、同行人数和当天感受留在本机。"}
          </p>
          <Link className="text-action" to="/checkins">
            去打卡
            <ArrowRight aria-hidden="true" size={18} weight="bold" />
          </Link>
        </article>

        <article className="guide-preview">
          <div className="preview-heading">
            <BookOpenText aria-hidden="true" size={25} weight="duotone" />
            <div>
              <p>精选攻略</p>
              <h2>{matchingGuide?.title ?? "北京周末路线笔记"}</h2>
            </div>
          </div>
          <p>
            {matchingGuide?.summary ??
              "查看本地整理的路线顺序和出发建议。"}
          </p>
          <Link className="text-action" to="/guides">
            阅读攻略
            <ArrowRight aria-hidden="true" size={18} weight="bold" />
          </Link>
        </article>
      </section>
    </>
  );
}
