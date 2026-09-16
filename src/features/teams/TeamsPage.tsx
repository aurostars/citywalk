import {
  CalendarBlank,
  MapPin,
  Plus,
  UserCircle,
  UsersThree,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppState } from "../../app/AppState";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { activities } from "../../data/activities";
import type { Team } from "../../types/domain";
import { TeamForm } from "./TeamForm";

const activityById = new Map(
  activities.map((activity) => [activity.id, activity]),
);

function formatDepartureTime(departureTime: string) {
  const [date = "", time = ""] = departureTime.split("T");
  const [, month = "", day = ""] = date.split("-");

  if (!month || !day || !time) {
    return departureTime;
  }

  return `${Number(month)}月${Number(day)}日 ${time}`;
}

interface TeamRowProps {
  onJoin: (teamId: string) => void;
  onLeave: (teamId: string) => void;
  team: Team;
}

function TeamRow({ onJoin, onLeave, team }: TeamRowProps) {
  const activity = activityById.get(team.activityId);
  if (!activity) {
    return null;
  }

  const isFull = team.memberCount >= team.capacity;

  return (
    <article
      aria-label={`${activity.title}组队`}
      className={team.joined ? "team-row is-joined" : "team-row"}
    >
      <ImageWithFallback
        alt={activity.imageAlt}
        className="team-row-image"
        fallbackLabel={activity.title}
        height={180}
        src={activity.imageUrl}
        width={240}
      />

      <div className="team-row-copy">
        <div className="team-row-heading">
          <div>
            <p className="section-label">
              {activity.district} / {activity.venue}
            </p>
            <h2>{activity.title}</h2>
          </div>
          <div className="team-statuses">
            {team.createdByUser ? <span>我发起</span> : null}
            {team.joined ? <span>已加入</span> : null}
            {!team.joined && isFull ? <span>已满</span> : null}
          </div>
        </div>

        <dl className="team-row-facts">
          <div>
            <dt>
              <CalendarBlank aria-hidden="true" size={17} weight="bold" />
              出发
            </dt>
            <dd>{formatDepartureTime(team.departureTime)}</dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" size={17} weight="bold" />
              集合
            </dt>
            <dd>{team.meetingPoint}</dd>
          </div>
          <div>
            <dt>
              <UsersThree aria-hidden="true" size={17} weight="bold" />
              人数
            </dt>
            <dd>{team.memberCount} / {team.capacity} 人</dd>
          </div>
          <div>
            <dt>
              <UserCircle aria-hidden="true" size={17} weight="bold" />
              队长
            </dt>
            <dd>{team.leader}</dd>
          </div>
        </dl>

        <p className="team-row-note">{team.note}</p>
      </div>

      <div className="team-row-action">
        {team.joined ? (
          <button
            className="secondary-action"
            onClick={() => onLeave(team.id)}
            type="button"
          >
            退出队伍
          </button>
        ) : (
          <button
            className="primary-action"
            disabled={isFull}
            onClick={() => onJoin(team.id)}
            type="button"
          >
            {isFull ? "队伍已满" : "加入队伍"}
          </button>
        )}
      </div>
    </article>
  );
}

export function TeamsPage() {
  const {
    createTeam,
    joinTeam,
    leaveTeam,
    state,
  } = useAppState();
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const requestedActivityId = searchParams.get("activity") ?? "";
  const initialActivityId = activityById.has(requestedActivityId)
    ? requestedActivityId
    : "";
  const availableTeamCount = state.teams.filter(
    (team) => team.memberCount < team.capacity || team.joined,
  ).length;

  return (
    <div className="teams-page">
      <header className="results-masthead teams-masthead">
        <div>
          <p className="home-kicker">北京周末同行计划</p>
          <h1>一起出发</h1>
          <p>
            从本周活动里选一支合适的队伍，或按自己的时间发起新计划。
          </p>
        </div>
        <button
          className="primary-action"
          onClick={() => setIsCreating(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={20} weight="bold" />
          发起队伍
        </button>
      </header>

      <section aria-labelledby="team-list-title" className="team-list-section">
        <div className="team-list-heading">
          <div className="section-heading">
            <p className="section-label">近期出发</p>
            <h2 id="team-list-title">可加入的本地队伍</h2>
          </div>
          <p>{availableTeamCount} 支队伍仍可安排</p>
        </div>

        <div className="team-list">
          {state.teams.map((team) => (
            <TeamRow
              key={team.id}
              onJoin={joinTeam}
              onLeave={leaveTeam}
              team={team}
            />
          ))}
        </div>
      </section>

      {isCreating ? (
        <TeamForm
          activities={activities}
          initialActivityId={initialActivityId}
          onClose={() => setIsCreating(false)}
          onCreate={createTeam}
        />
      ) : null}
    </div>
  );
}
