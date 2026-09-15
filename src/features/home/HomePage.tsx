import { PencilSimple } from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../../app/AppState";
import { ImageWithFallback } from "../../components/ImageWithFallback";
import { activities } from "../../data/activities";
import { weekendWeather } from "../../data/weather";
import { recommendActivities } from "../recommendations/recommend";
import type {
  ActivityType,
  Budget,
  PartySize,
  Preferences,
} from "../../types/domain";
import {
  activityTypeLabels,
  budgetLabels,
  PreferencePanel,
} from "./PreferencePanel";
import { RecommendationResults } from "./RecommendationResults";

const heroImageUrl =
  "https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=Documentary%20street%20photography%20of%20young%20Chinese%20college%20students%20walking%20through%20a%20contemporary%20art%20district%20in%20Beijing%2C%20daylight%2C%20candid%2C%20clean%20editorial%20composition%2C%20realistic%2C%20muted%20colors%2C%20no%20text&image_size=landscape_4_3";

const allActivityTypes: ActivityType[] = [
  "exhibition",
  "market",
  "show",
  "hike",
];

const partySizeOptions: { label: string; value: PartySize }[] = [
  { label: "一个人", value: "solo" },
  { label: "两个人", value: "pair" },
  { label: "多人同行", value: "group" },
];

type HomeMode = "editing" | "loading" | "onboarding" | "results";

function LoadingResults() {
  return (
    <section
      aria-label="正在生成周末计划"
      className="results-loading"
      role="status"
    >
      <span className="visually-hidden">
        正在结合天气、预算和同行人数生成周末计划
      </span>
      <div className="skeleton skeleton-heading" aria-hidden="true" />
      <div className="skeleton skeleton-summary" aria-hidden="true" />
      <div className="skeleton-route" aria-hidden="true">
        <div className="skeleton skeleton-route-copy" />
        <div className="skeleton skeleton-route-image" />
      </div>
    </section>
  );
}

export function HomePage() {
  const { savePreferences, state } = useAppState();
  const reduceMotion = useReducedMotion();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mode, setMode] = useState<HomeMode>(
    state.onboardingComplete ? "results" : "onboarding",
  );
  const [draftActivityTypes, setDraftActivityTypes] = useState<
    ActivityType[]
  >(state.preferences.activityTypes);
  const [draftBudget, setDraftBudget] = useState<Budget | null>(
    state.onboardingComplete ? state.preferences.budget : null,
  );
  const [showRelaxed, setShowRelaxed] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const strictRecommendations = useMemo(
    () =>
      recommendActivities(
        activities,
        state.preferences,
        weekendWeather,
      ),
    [state.preferences],
  );

  const displayedRecommendations = useMemo(() => {
    if (strictRecommendations.length > 0 || !showRelaxed) {
      return strictRecommendations;
    }

    return recommendActivities(
      activities,
      {
        ...state.preferences,
        activityTypes: allActivityTypes,
      },
      weekendWeather,
    );
  }, [showRelaxed, state.preferences, strictRecommendations]);

  function submitPreferences() {
    if (draftActivityTypes.length === 0 || draftBudget === null) {
      return;
    }

    const preferences: Preferences = {
      activityTypes: draftActivityTypes,
      budget: draftBudget,
      partySize: state.preferences.partySize,
    };

    setShowRelaxed(false);
    setMode("loading");
    timeoutRef.current = setTimeout(() => {
      savePreferences(preferences);
      setAnimateResults(true);
      setMode("results");
      timeoutRef.current = null;
    }, reduceMotion ? 0 : 240);
  }

  function editPreferences() {
    setDraftActivityTypes(state.preferences.activityTypes);
    setDraftBudget(state.preferences.budget);
    setAnimateResults(false);
    setMode("editing");
  }

  function changePartySize(partySize: PartySize) {
    setShowRelaxed(false);
    savePreferences({
      ...state.preferences,
      partySize,
    });
  }

  const isPreferenceMode = mode === "onboarding" || mode === "editing";
  const preferenceExit = reduceMotion
    ? { opacity: 1 }
    : { opacity: 0, y: -14 };
  const resultEnter =
    animateResults && !reduceMotion
      ? { opacity: 1, y: 20 }
      : false;

  return (
    <div className="home-page">
      <AnimatePresence initial={false}>
        {isPreferenceMode ? (
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            aria-labelledby="home-title"
            className="onboarding-stage"
            exit={preferenceExit}
            initial={false}
            key={mode}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="onboarding-copy">
              <div className="opening-copy">
                <p className="home-kicker">
                  {mode === "editing" ? "调整本期偏好" : "北京周末编辑推荐"}
                </p>
                <h1 id="home-title">
                  {mode === "editing"
                    ? "换个方向，再排一次。"
                    : "这个周末，换条路走。"}
                </h1>
                <p>
                  选好兴趣和预算，我们会结合示例天气与同行人数排出一份可执行计划。
                </p>
              </div>

              <PreferencePanel
                activityTypes={draftActivityTypes}
                budget={draftBudget}
                isEditing={mode === "editing"}
                onActivityTypesChange={setDraftActivityTypes}
                onBudgetChange={setDraftBudget}
                onSubmit={submitPreferences}
              />
            </div>

            <figure className="onboarding-media">
              <ImageWithFallback
                alt="北京当代艺术街区里结伴散步的大学生"
                className="onboarding-image"
                fallbackLabel="北京周末街区"
                height={930}
                loading="eager"
                src={heroImageUrl}
                width={1240}
              />
              <figcaption>
                <span>本周末示例天气</span>
                <strong>多云 16-23°C</strong>
                <small>适合室内外灵活安排</small>
              </figcaption>
            </figure>
          </motion.section>
        ) : mode === "loading" ? (
          <LoadingResults key="loading" />
        ) : (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="results-stage"
            initial={resultEnter}
            key="results"
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="results-masthead">
              <div>
                <p className="home-kicker">你的本期城市指南</p>
                <h1>为你安排的北京周末</h1>
                <p>
                  先从一条可执行路线出发，再决定组队、记录或继续读攻略。
                </p>
              </div>
              <button
                className="edit-preferences"
                onClick={editPreferences}
                type="button"
              >
                <PencilSimple aria-hidden="true" size={18} weight="bold" />
                调整偏好
              </button>
            </header>

            <section className="preference-summary" aria-label="当前偏好">
              <div className="summary-copy">
                <span>当前方向</span>
                <strong>
                  {state.preferences.activityTypes
                    .map((type) => activityTypeLabels[type])
                    .join("、")}
                </strong>
              </div>
              <div className="summary-copy">
                <span>每人预算</span>
                <strong>{budgetLabels[state.preferences.budget]}</strong>
              </div>
              <fieldset className="party-size-control">
                <legend>同行人数</legend>
                <div className="selection-row">
                  {partySizeOptions.map((option) => (
                    <label className="selection-control" key={option.value}>
                      <input
                        checked={
                          state.preferences.partySize === option.value
                        }
                        name="partySize"
                        onChange={() => changePartySize(option.value)}
                        type="radio"
                        value={option.value}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>

            <RecommendationResults
              activities={displayedRecommendations}
              checkins={state.checkins}
              guides={state.guides}
              isRelaxed={
                showRelaxed && strictRecommendations.length === 0
              }
              onShowRelaxed={() => setShowRelaxed(true)}
              preferences={state.preferences}
              teams={state.teams}
              weather={weekendWeather}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
