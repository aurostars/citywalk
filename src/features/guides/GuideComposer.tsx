import {
  CheckCircle,
  PaperPlaneTilt,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { AppActions } from "../../app/AppState";
import type { Activity } from "../../types/domain";

interface GuideComposerProps {
  activities: Activity[];
  onClose: () => void;
  onPublish: AppActions["publishGuide"];
}

interface GuideDraft {
  activityId: string;
  audience: string;
  summary: string;
  title: string;
}

type RequiredField = keyof GuideDraft;
type SubmissionStatus = "persistent" | "session-only";

const errorMessages: Record<RequiredField, string> = {
  title: "请填写标题",
  activityId: "请选择关联活动",
  summary: "请填写正文摘要",
  audience: "请填写适合人群",
};

const fieldIds: Record<RequiredField, string> = {
  title: "guide-title",
  activityId: "guide-activity",
  summary: "guide-summary",
  audience: "guide-audience",
};

const requiredFields: RequiredField[] = [
  "title",
  "activityId",
  "summary",
  "audience",
];

export function GuideComposer({
  activities,
  onClose,
  onPublish,
}: GuideComposerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const submissionStatusRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<GuideDraft>({
    title: "",
    activityId: "",
    summary: "",
    audience: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<RequiredField, string>>
  >({});
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    if (submissionStatus) {
      submissionStatusRef.current?.focus();
    }
  }, [submissionStatus]);

  function updateField(field: RequiredField, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  }

  function submitGuide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStatus) {
      return;
    }

    const nextErrors: Partial<Record<RequiredField, string>> = {};
    requiredFields.forEach((field) => {
      if (!draft[field].trim()) {
        nextErrors[field] = errorMessages[field];
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = requiredFields.find(
        (field) => nextErrors[field],
      );
      if (firstInvalidField) {
        dialogRef.current
          ?.querySelector<HTMLElement>(`#${fieldIds[firstInvalidField]}`)
          ?.focus();
      }
      return;
    }

    const activity = activities.find(
      ({ id }) => id === draft.activityId,
    );
    if (!activity) {
      setErrors({ activityId: errorMessages.activityId });
      dialogRef.current
        ?.querySelector<HTMLElement>(`#${fieldIds.activityId}`)
        ?.focus();
      return;
    }

    const submittedDraft = {
      title: draft.title.trim(),
      activityId: draft.activityId,
      summary: draft.summary.trim(),
      audience: draft.audience.trim(),
    };
    const result = onPublish({
      ...submittedDraft,
      activityType: activity.type,
    });
    setDraft(submittedDraft);
    setSubmissionStatus(
      result.persisted ? "persistent" : "session-only",
    );
  }

  function trapDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled])",
      ) ?? [],
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    const activeElement = document.activeElement;

    if (!focusableElements.includes(activeElement as HTMLElement)) {
      event.preventDefault();
      (event.shiftKey ? lastElement : firstElement)?.focus();
    } else if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  return (
    <div className="guide-dialog-backdrop">
      <div
        aria-labelledby="guide-dialog-title"
        aria-modal="true"
        className="guide-dialog"
        onKeyDown={trapDialogFocus}
        ref={dialogRef}
        role="dialog"
      >
        <header className="guide-dialog-header">
          <div>
            <p className="section-label">本地发布</p>
            <h2 id="guide-dialog-title">分享周末攻略</h2>
          </div>
          <button
            aria-label="关闭攻略窗口"
            className="theme-toggle guide-dialog-close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={20} weight="bold" />
          </button>
        </header>

        {submissionStatus ? (
          <div
            aria-label={
              submissionStatus === "persistent"
                ? "攻略已发布"
                : "攻略仅保留在本次会话"
            }
            className={`guide-publish-status${
              submissionStatus === "session-only"
                ? " guide-publish-status-warning"
                : ""
            }`}
            ref={submissionStatusRef}
            role={
              submissionStatus === "persistent" ? "status" : "alert"
            }
            tabIndex={-1}
          >
            {submissionStatus === "persistent" ? (
              <CheckCircle aria-hidden="true" size={24} weight="fill" />
            ) : (
              <WarningCircle aria-hidden="true" size={24} weight="fill" />
            )}
            <div>
              <strong>
                {submissionStatus === "persistent"
                  ? "攻略已发布"
                  : "攻略仅保留在本次会话"}
              </strong>
              <span>
                {submissionStatus === "persistent"
                  ? "内容已保存在这台设备上，完成后可在列表顶部查看。"
                  : "浏览器存储写入失败。当前页面仍会保留内容，刷新后会丢失。"}
              </span>
            </div>
          </div>
        ) : null}

        <form className="guide-form" noValidate onSubmit={submitGuide}>
          <fieldset disabled={submissionStatus !== null}>
            <div className="guide-form-grid">
              <div className="guide-form-field guide-form-field-wide">
                <label htmlFor="guide-title">标题</label>
                <input
                  aria-describedby={
                    errors.title ? "guide-title-error" : undefined
                  }
                  aria-invalid={Boolean(errors.title)}
                  id="guide-title"
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  placeholder="用一句话说清这条路线"
                  ref={firstFieldRef}
                  type="text"
                  value={draft.title}
                />
                {errors.title ? (
                  <p className="guide-field-error" id="guide-title-error">
                    {errors.title}
                  </p>
                ) : null}
              </div>

              <div className="guide-form-field">
                <label htmlFor="guide-activity">关联地点</label>
                <select
                  aria-describedby={
                    errors.activityId
                      ? "guide-activity-error"
                      : undefined
                  }
                  aria-invalid={Boolean(errors.activityId)}
                  id="guide-activity"
                  onChange={(event) =>
                    updateField("activityId", event.target.value)
                  }
                  value={draft.activityId}
                >
                  <option value="">选择相关活动</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title}
                    </option>
                  ))}
                </select>
                {errors.activityId ? (
                  <p
                    className="guide-field-error"
                    id="guide-activity-error"
                  >
                    {errors.activityId}
                  </p>
                ) : null}
              </div>

              <div className="guide-form-field guide-form-field-wide">
                <label htmlFor="guide-summary">正文摘要</label>
                <textarea
                  aria-describedby={
                    errors.summary
                      ? "guide-summary-error"
                      : "guide-summary-help"
                  }
                  aria-invalid={Boolean(errors.summary)}
                  id="guide-summary"
                  onChange={(event) =>
                    updateField("summary", event.target.value)
                  }
                  placeholder="写下顺序、停留方式和最值得提醒的细节"
                  rows={5}
                  value={draft.summary}
                />
                {errors.summary ? (
                  <p
                    className="guide-field-error"
                    id="guide-summary-error"
                  >
                    {errors.summary}
                  </p>
                ) : (
                  <p
                    className="guide-field-help"
                    id="guide-summary-help"
                  >
                    分享会保存在当前浏览器，不会上传到服务器。
                  </p>
                )}
              </div>

              <div className="guide-form-field guide-form-field-wide">
                <label htmlFor="guide-audience">适合人群</label>
                <input
                  aria-describedby={
                    errors.audience
                      ? "guide-audience-error"
                      : undefined
                  }
                  aria-invalid={Boolean(errors.audience)}
                  id="guide-audience"
                  onChange={(event) =>
                    updateField("audience", event.target.value)
                  }
                  placeholder="例如：第一次去、两人同行"
                  type="text"
                  value={draft.audience}
                />
                {errors.audience ? (
                  <p
                    className="guide-field-error"
                    id="guide-audience-error"
                  >
                    {errors.audience}
                  </p>
                ) : null}
              </div>
            </div>
          </fieldset>

          <div className="guide-form-actions">
            <p>
              {submissionStatus === "persistent"
                ? "内容已经保存，选择完成返回攻略列表。"
                : submissionStatus === "session-only"
                  ? "内容未写入浏览器存储，本次会话中仍可查看。"
                  : "提交后会显示在攻略列表顶部。"}
            </p>
            <button
              className="primary-action"
              disabled={submissionStatus !== null}
              type="submit"
            >
              <PaperPlaneTilt
                aria-hidden="true"
                size={20}
                weight="bold"
              />
              发布攻略
            </button>
            {submissionStatus ? (
              <button
                className="secondary-action"
                onClick={onClose}
                type="button"
              >
                完成
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
