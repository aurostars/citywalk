import {
  ArrowUpRight,
  Clock,
  Heart,
  MapPin,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import type { Activity } from "../../types/domain";
import { activityTypeLabels } from "./PreferencePanel";

interface ActivityCardProps {
  activity: Activity;
  featured?: boolean;
}

function formatPrice(price: number) {
  return price === 0 ? "免费" : `${price} 元`;
}

function formatDuration(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} 分钟`;
  }

  return minutes === 0 ? `${hours} 小时` : `${hours} 小时 ${minutes} 分`;
}

export function ActivityCard({
  activity,
  featured = false,
}: ActivityCardProps) {
  const { state, toggleFavorite } = useAppState();
  const isFavorite = state.favoriteActivityIds.includes(activity.id);

  return (
    <article
      className={featured ? "activity-card is-featured" : "activity-card"}
    >
      <ImageWithFallback
        alt={activity.imageAlt}
        className="activity-card-image"
        fallbackLabel={activity.title}
        height={featured ? 720 : 540}
        loading={featured ? "eager" : "lazy"}
        src={activity.imageUrl}
        width={featured ? 960 : 720}
      />

      <div className="activity-card-copy">
        <div className="activity-card-meta">
          <span>{activityTypeLabels[activity.type]}</span>
          <span>{formatPrice(activity.price)}</span>
        </div>
        <h3>{activity.title}</h3>
        <p>{activity.summary}</p>
        <dl className="activity-facts">
          <div>
            <dt>
              <MapPin aria-hidden="true" size={17} weight="bold" />
              地点
            </dt>
            <dd>{activity.venue}</dd>
          </div>
          <div>
            <dt>
              <Clock aria-hidden="true" size={17} weight="bold" />
              时长
            </dt>
            <dd>{formatDuration(activity.durationMinutes)}</dd>
          </div>
        </dl>
        <div className="activity-card-actions">
          <Link
            aria-label={`查看${activity.title}详情`}
            className="text-action"
            to={`/activity/${activity.id}`}
          >
            查看活动
            <ArrowUpRight aria-hidden="true" size={18} weight="bold" />
          </Link>
          <button
            aria-label={`${isFavorite ? "取消收藏" : "收藏"}${activity.title}`}
            aria-pressed={isFavorite}
            className="activity-card-favorite"
            onClick={() => toggleFavorite(activity.id)}
            title={`${isFavorite ? "取消收藏" : "收藏"}${activity.title}`}
            type="button"
          >
            <Heart
              aria-hidden="true"
              size={19}
              weight={isFavorite ? "fill" : "bold"}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
