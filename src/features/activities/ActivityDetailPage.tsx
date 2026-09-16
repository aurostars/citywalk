import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  Clock,
  CloudSun,
  Coins,
  Heart,
  MapPin,
  Path,
  UsersThree,
} from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { activities } from "../../data/activities";
import { weekendRoutes } from "../../data/routes";
import { weekendWeather } from "../../data/weather";
import type {
  Activity,
  PartySize,
  WeatherKind,
} from "../../types/domain";
import { activityTypeLabels } from "../home/PreferencePanel";

const partySizeLabels: Record<PartySize, string> = {
  group: "多人同行",
  pair: "两个人",
  solo: "一个人",
};

const weatherLabels: Record<WeatherKind, string> = {
  cloudy: "多云",
  rain: "有雨",
  sunny: "晴朗",
};

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} 分钟`;
  }

  return minutes === 0 ? `${hours} 小时` : `${hours} 小时 ${minutes} 分`;
}

function getWeatherGuidance(activity: Activity) {
  const weatherIsSuitable = activity.weatherKinds.includes(
    weekendWeather.kind,
  );
  const suitability = weatherIsSuitable
    ? "本活动适合当前天气。"
    : "本活动不在建议天气范围内。";

  if (activity.indoor) {
    return `示例天气为${weatherLabels[weekendWeather.kind]}，${suitability}室内场地也便于应对临时降雨。`;
  }

  return weatherIsSuitable
    ? `示例天气为${weatherLabels[weekendWeather.kind]}，${suitability}户外活动建议按体感准备防晒或薄外套。`
    : `示例天气为${weatherLabels[weekendWeather.kind]}，${suitability}出发前请查看预报，并准备替代安排。`;
}

export function ActivityDetailPage() {
  const { activityId } = useParams();
  const { persistenceWarning, state, toggleFavorite } = useAppState();
  const activity = activities.find(({ id }) => id === activityId);

  if (!activity) {
    return (
      <section
        aria-labelledby="activity-not-found-title"
        className="activity-not-found"
      >
        <p className="route-kicker">活动未找到</p>
        <h1 id="activity-not-found-title">
          这条活动不在当前周末清单里
        </h1>
        <p>
          链接可能已失效，也可能是活动已经从本期推荐中移除。
        </p>
        <Link className="primary-action" to="/">
          <ArrowLeft aria-hidden="true" size={19} weight="bold" />
          返回周末推荐
        </Link>
      </section>
    );
  }

  const isFavorite = state.favoriteActivityIds.includes(activity.id);
  const relatedRoute = weekendRoutes
    .filter(({ activityIds }) => activityIds.includes(activity.id))
    .sort((a, b) => a.editorOrder - b.editorOrder)[0];
  const routeTitle = relatedRoute?.title ?? `${activity.venue}单站慢游`;
  const routeDescription = relatedRoute?.summary ?? activity.summary;

  return (
    <article className="activity-detail">
      <Link className="detail-back-link" to="/">
        <ArrowLeft aria-hidden="true" size={18} weight="bold" />
        返回周末推荐
      </Link>

      <header className="activity-detail-hero">
        <div className="activity-detail-copy">
          <p className="home-kicker">
            {activity.district} / {activityTypeLabels[activity.type]}
          </p>
          <h1>{activity.title}</h1>
          <p className="activity-detail-summary">{activity.summary}</p>

          <div className="activity-detail-actions">
            <button
              aria-pressed={isFavorite}
              className="primary-action favorite-action"
              onClick={() => toggleFavorite(activity.id)}
              type="button"
            >
              <Heart
                aria-hidden="true"
                size={20}
                weight={isFavorite ? "fill" : "bold"}
              />
              {isFavorite ? "取消收藏" : "收藏活动"}
            </button>
            <Link
              className="secondary-action"
              to={`/teams?activity=${activity.id}`}
            >
              <UsersThree aria-hidden="true" size={20} weight="bold" />
              找搭子
            </Link>
            <Link
              className="secondary-action"
              to={`/checkins?activity=${activity.id}`}
            >
              <MapPin aria-hidden="true" size={20} weight="bold" />
              记录打卡
            </Link>
          </div>

          {persistenceWarning ? (
            <p className="detail-persistence-warning" role="status">
              {persistenceWarning}
            </p>
          ) : null}
        </div>

        <figure className="activity-detail-media">
          <ImageWithFallback
            alt={activity.imageAlt}
            className="activity-detail-image"
            fallbackLabel={activity.title}
            height={900}
            loading="eager"
            src={activity.imageUrl}
            width={1200}
          />
          <figcaption>
            <span>{activity.venue}</span>
            <span>{activity.schedule}</span>
          </figcaption>
        </figure>
      </header>

      <section
        aria-labelledby="activity-facts-title"
        className="activity-detail-facts"
      >
        <div className="detail-section-heading">
          <p className="section-label">出发前确认</p>
          <h2 id="activity-facts-title">活动信息</h2>
        </div>
        <dl>
          <div>
            <dt>
              <CalendarBlank aria-hidden="true" size={19} weight="bold" />
              时间
            </dt>
            <dd>{activity.schedule}</dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" size={19} weight="bold" />
              地点
            </dt>
            <dd>{activity.venue}</dd>
          </div>
          <div>
            <dt>
              <Coins aria-hidden="true" size={19} weight="bold" />
              费用
            </dt>
            <dd>{activity.price === 0 ? "免费" : `${activity.price} 元`}</dd>
          </div>
          <div>
            <dt>
              <Clock aria-hidden="true" size={19} weight="bold" />
              建议停留
            </dt>
            <dd>{formatDuration(activity.durationMinutes)}</dd>
          </div>
          <div className="activity-party-sizes">
            <dt>
              <UsersThree aria-hidden="true" size={19} weight="bold" />
              适合人数
            </dt>
            <dd>
              {activity.suitablePartySizes
                .map((partySize) => partySizeLabels[partySize])
                .join("、")}
            </dd>
          </div>
        </dl>
      </section>

      <div className="activity-detail-guidance">
        <section
          aria-labelledby="activity-weather-title"
          className="detail-weather"
        >
          <CloudSun aria-hidden="true" size={32} weight="duotone" />
          <div>
            <p className="section-label">天气提示</p>
            <h2 id="activity-weather-title">按本周示例天气准备</h2>
            <p>{getWeatherGuidance(activity)}</p>
          </div>
        </section>

        <section
          aria-labelledby="activity-route-title"
          className="detail-route"
        >
          <Path aria-hidden="true" size={32} weight="duotone" />
          <div>
            <p className="section-label">路线说明</p>
            <h2 id="activity-route-title">{routeTitle}</h2>
            <p>{routeDescription}</p>
            {relatedRoute ? (
              <Link className="text-action" to="/">
                查看完整周末计划
                <ArrowRight aria-hidden="true" size={18} weight="bold" />
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </article>
  );
}
