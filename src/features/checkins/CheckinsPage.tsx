import {
  CalendarBlank,
  MapPinLine,
  Plus,
  Star,
  UsersThree,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import { activities } from "../../data/activities";
import type {
  Checkin,
  PartySize,
} from "../../types/domain";
import { CheckinForm } from "./CheckinForm";

const activityById = new Map(
  activities.map((activity) => [activity.id, activity]),
);

const partySizeLabels: Record<PartySize, string> = {
  group: "多人同行",
  pair: "两个人",
  solo: "一个人",
};

function formatCheckinDate(date: string) {
  const [year = "", month = "", day = ""] = date.split("-");
  if (!year || !month || !day) {
    return date;
  }

  return `${year}年${Number(month)}月${Number(day)}日`;
}

function CheckinRow({ checkin }: { checkin: Checkin }) {
  const activity = activityById.get(checkin.activityId);
  if (!activity) {
    return null;
  }

  return (
    <article
      aria-label={`${activity.title}打卡`}
      className="checkin-row"
    >
      <div className="checkin-row-date">
        <CalendarBlank aria-hidden="true" size={20} weight="bold" />
        <time dateTime={checkin.date}>
          {formatCheckinDate(checkin.date)}
        </time>
      </div>

      <div className="checkin-row-copy">
        <p className="section-label">
          {activity.district} / {activity.venue}
        </p>
        <h3>{activity.title}</h3>
        <p className="checkin-row-note">{checkin.note}</p>
      </div>

      <div className="checkin-row-facts">
        <span>
          <UsersThree aria-hidden="true" size={17} weight="bold" />
          {partySizeLabels[checkin.partySize]}
        </span>
        <span
          aria-label={`评分 ${checkin.rating} 星`}
          className="checkin-row-rating"
        >
          <Star aria-hidden="true" size={17} weight="fill" />
          {checkin.rating} / 5
        </span>
      </div>
    </article>
  );
}

export function CheckinsPage() {
  const { addCheckin, persistenceWarning, state } = useAppState();
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const requestedActivityId = searchParams.get("activity") ?? "";
  const initialActivityId = activityById.has(requestedActivityId)
    ? requestedActivityId
    : "";
  const visibleCheckins = state.checkins.filter((checkin) =>
    activityById.has(checkin.activityId),
  );

  return (
    <div className="checkins-page">
      <header className="results-masthead checkins-masthead">
        <div>
          <p className="home-kicker">我的北京周末</p>
          <h1>留下城迹</h1>
          <p>
            把去过的活动、同行的人和现场感受，整理成自己的城市履历。
          </p>
        </div>
        <button
          className="primary-action"
          onClick={() => setIsCreating(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={20} weight="bold" />
          新增打卡
        </button>
      </header>

      <section
        aria-labelledby="checkin-history-title"
        className="checkin-history"
      >
        <div className="checkin-history-heading">
          <div className="section-heading">
            <p className="section-label">按保存顺序</p>
            <h2 id="checkin-history-title">打卡历史</h2>
          </div>
          <p>{visibleCheckins.length} 条本地记录</p>
        </div>

        {visibleCheckins.length > 0 ? (
          <ol className="checkin-list">
            {visibleCheckins.map((checkin) => (
              <li key={checkin.id}>
                <CheckinRow checkin={checkin} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="checkin-empty">
            <MapPinLine aria-hidden="true" size={34} weight="duotone" />
            <h3>还没有打卡记录</h3>
            <p>从一次真实出发开始，记下之后还会用到的路线和感受。</p>
            <button
              className="secondary-action"
              onClick={() => setIsCreating(true)}
              type="button"
            >
              记录第一次出发
            </button>
          </div>
        )}
      </section>

      {persistenceWarning ? (
        <p className="detail-persistence-warning" role="status">
          {persistenceWarning}
        </p>
      ) : null}

      {isCreating ? (
        <CheckinForm
          activities={activities}
          initialActivityId={initialActivityId}
          onClose={() => setIsCreating(false)}
          onSave={addCheckin}
        />
      ) : null}
    </div>
  );
}
