import {
  BookmarkSimple,
  MapPin,
  PencilSimple,
  UserFocus,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useAppState } from "../../app/AppState";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { activities } from "../../data/activities";
import type { ActivityType, Guide } from "../../types/domain";
import { GuideComposer } from "./GuideComposer";

type GuideFilter = "all" | ActivityType;

const activityById = new Map(
  activities.map((activity) => [activity.id, activity]),
);

const activityTypeLabels: Record<ActivityType, string> = {
  exhibition: "展览",
  market: "市集",
  show: "演出",
  hike: "户外",
};

const guideFilters: Array<{ label: string; value: GuideFilter }> = [
  { label: "全部", value: "all" },
  { label: "展览", value: "exhibition" },
  { label: "市集", value: "market" },
  { label: "演出", value: "show" },
  { label: "户外", value: "hike" },
];

interface GuideRowProps {
  guide: Guide;
  onToggleSaved: (guideId: string) => void;
}

function GuideRow({ guide, onToggleSaved }: GuideRowProps) {
  const activity = activityById.get(guide.activityId);
  if (!activity) {
    return null;
  }

  return (
    <article
      aria-label={guide.title}
      className={
        guide.createdByUser
          ? "guide-editorial-row is-local"
          : "guide-editorial-row"
      }
    >
      <ImageWithFallback
        alt={activity.imageAlt}
        className="guide-row-image"
        fallbackLabel={activity.title}
        height={360}
        src={activity.imageUrl}
        width={480}
      />

      <div className="guide-row-copy">
        <div className="guide-row-meta">
          <span>{activityTypeLabels[guide.activityType]}</span>
          <span>{activity.venue}</span>
          {guide.createdByUser ? (
            <span className="guide-local-status">我的分享</span>
          ) : null}
        </div>

        <h2>{guide.title}</h2>
        <p className="guide-row-summary">{guide.summary}</p>

        <div className="guide-row-footer">
          <div>
            <span>
              <UserFocus aria-hidden="true" size={17} weight="bold" />
              {guide.audience}
            </span>
            <span>作者 {guide.author}</span>
          </div>
          <button
            aria-label={
              guide.saved
                ? `取消收藏《${guide.title}》`
                : `收藏《${guide.title}》`
            }
            aria-pressed={Boolean(guide.saved)}
            className="guide-save-action"
            onClick={() => onToggleSaved(guide.id)}
            type="button"
          >
            <BookmarkSimple
              aria-hidden="true"
              size={19}
              weight={guide.saved ? "fill" : "bold"}
            />
            {guide.saved ? "已收藏" : "收藏"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function GuidesPage() {
  const {
    persistenceWarning,
    publishGuide,
    state,
    toggleGuideSaved,
  } = useAppState();
  const [activeFilter, setActiveFilter] =
    useState<GuideFilter>("all");
  const [isComposing, setIsComposing] = useState(false);

  const visibleGuides = useMemo(() => {
    const orderedGuides = [
      ...state.guides.filter(({ createdByUser }) => createdByUser),
      ...state.guides.filter(({ createdByUser }) => !createdByUser),
    ];
    return activeFilter === "all"
      ? orderedGuides
      : orderedGuides.filter(
          ({ activityType }) => activityType === activeFilter,
        );
  }, [activeFilter, state.guides]);

  const publishAndRevealGuide: typeof publishGuide = (guide) => {
    const result = publishGuide(guide);
    setActiveFilter(guide.activityType);
    return result;
  };

  return (
    <div className="guides-page">
      <header className="results-masthead guides-masthead">
        <div>
          <p className="home-kicker">北京周末路线库</p>
          <h1>走过，再分享</h1>
          <p>
            从真实活动出发，读一条可执行的路线，也留下自己的周末经验。
          </p>
        </div>
        <button
          className="primary-action"
          onClick={() => setIsComposing(true)}
          type="button"
        >
          <PencilSimple aria-hidden="true" size={20} weight="bold" />
          写攻略
        </button>
      </header>

      <section
        aria-labelledby="guide-list-title"
        className="guide-list-section"
      >
        <div className="guide-list-heading">
          <div>
            <p className="section-label">本地路线编辑</p>
            <h2 id="guide-list-title">周末攻略</h2>
          </div>
          <div
            aria-label="按活动类型筛选"
            className="guide-filters"
            role="group"
          >
            {guideFilters.map((filter) => (
              <button
                aria-pressed={activeFilter === filter.value}
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {visibleGuides.length > 0 ? (
          <div className="guide-list">
            {visibleGuides.map((guide) => (
              <GuideRow
                guide={guide}
                key={guide.id}
                onToggleSaved={toggleGuideSaved}
              />
            ))}
          </div>
        ) : (
          <div className="guide-empty">
            <MapPin aria-hidden="true" size={32} weight="duotone" />
            <h3>这个分类还没有攻略</h3>
            <p>切换到全部类型，或分享一条你走过的路线。</p>
          </div>
        )}
      </section>

      {persistenceWarning && !isComposing ? (
        <p className="detail-persistence-warning" role="status">
          {persistenceWarning}
        </p>
      ) : null}

      {isComposing ? (
        <GuideComposer
          activities={activities}
          onClose={() => setIsComposing(false)}
          onPublish={publishAndRevealGuide}
        />
      ) : null}
    </div>
  );
}
