import { ArrowRight } from "@phosphor-icons/react";
import type { FormEvent } from "react";
import type {
  ActivityType,
  Budget,
  Preferences,
} from "../../types/domain";

const activityOptions: {
  label: string;
  value: ActivityType;
}[] = [
  { label: "看展", value: "exhibition" },
  { label: "逛市集", value: "market" },
  { label: "看演出", value: "show" },
  { label: "去徒步", value: "hike" },
  { label: "去玩乐", value: "entertainment" },
];

const budgetOptions: { label: string; value: Budget }[] = [
  { label: "免费", value: "free" },
  { label: "100 元内", value: "under-100" },
  { label: "100-300 元", value: "100-300" },
  { label: "300 元以上", value: "above-300" },
  { label: "不限", value: "any" },
];

interface PreferencePanelProps {
  activityTypes: ActivityType[];
  budget: Budget | null;
  isEditing: boolean;
  onActivityTypesChange: (activityTypes: ActivityType[]) => void;
  onBudgetChange: (budget: Budget) => void;
  onSubmit: () => void;
}

export function PreferencePanel({
  activityTypes,
  budget,
  isEditing,
  onActivityTypesChange,
  onBudgetChange,
  onSubmit,
}: PreferencePanelProps) {
  const isComplete = activityTypes.length > 0 && budget !== null;

  function toggleActivity(activityType: ActivityType) {
    onActivityTypesChange(
      activityTypes.includes(activityType)
        ? activityTypes.filter((value) => value !== activityType)
        : [...activityTypes, activityType],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isComplete) {
      onSubmit();
    }
  }

  return (
    <form className="preference-panel" onSubmit={handleSubmit}>
      <fieldset aria-describedby="activity-help">
        <legend>想做什么</legend>
        <p className="field-help" id="activity-help">
          可多选，至少选择一项
        </p>
        <div className="selection-row">
          {activityOptions.map((option) => (
            <label className="selection-control" key={option.value}>
              <input
                checked={activityTypes.includes(option.value)}
                name="activityTypes"
                onChange={() => toggleActivity(option.value)}
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset aria-describedby="budget-help">
        <legend>预算范围</legend>
        <p className="field-help" id="budget-help">
          选择每人的活动花费范围
        </p>
        <div className="selection-row">
          {budgetOptions.map((option) => (
            <label className="selection-control" key={option.value}>
              <input
                checked={budget === option.value}
                name="budget"
                onChange={() => onBudgetChange(option.value)}
                type="radio"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="preference-action">
        <p aria-live="polite" className="validation-message">
          {isComplete
            ? "条件已齐，可以生成计划。"
            : "请选择活动类型和预算后继续。"}
        </p>
        <button
          className="primary-action"
          disabled={!isComplete}
          type="submit"
        >
          <span>{isEditing ? "更新周末计划" : "生成周末计划"}</span>
          <ArrowRight aria-hidden="true" size={20} weight="bold" />
        </button>
      </div>
    </form>
  );
}

export const activityTypeLabels: Record<
  Preferences["activityTypes"][number],
  string
> = {
  entertainment: "玩乐",
  exhibition: "看展",
  hike: "徒步",
  market: "市集",
  show: "演出",
};

export const budgetLabels: Record<Budget, string> = {
  "100-300": "100-300 元",
  "above-300": "300 元以上",
  any: "不限",
  free: "免费",
  "under-100": "100 元内",
};
