import {
  CheckCircle,
  FloppyDisk,
  Star,
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
import type {
  Activity,
  PartySize,
} from "../../types/domain";

interface CheckinFormProps {
  activities: Activity[];
  initialActivityId: string;
  onClose: () => void;
  onSave: AppActions["addCheckin"];
}

interface CheckinDraft {
  activityId: string;
  date: string;
  note: string;
  partySize: PartySize;
  rating: number;
}

type RequiredField = "activityId" | "date" | "note";
type SubmissionStatus = "persistent" | "session-only";

const errorMessages: Record<RequiredField, string> = {
  activityId: "请选择活动",
  date: "请选择日期",
  note: "请填写打卡记录",
};

const fieldIds: Record<RequiredField, string> = {
  activityId: "checkin-activity",
  date: "checkin-date",
  note: "checkin-note",
};

export function CheckinForm({
  activities,
  initialActivityId,
  onClose,
  onSave,
}: CheckinFormProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const submissionStatusRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<CheckinDraft>({
    activityId: initialActivityId,
    date: "",
    note: "",
    partySize: "pair",
    rating: 5,
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

  function updateField<Key extends keyof CheckinDraft>(
    field: Key,
    value: CheckinDraft[Key],
  ) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    if (field === "activityId" || field === "date" || field === "note") {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  }

  function submitCheckin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStatus) {
      return;
    }

    const nextErrors: Partial<Record<RequiredField, string>> = {};
    (Object.keys(errorMessages) as RequiredField[]).forEach((field) => {
      const value = draft[field];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[field] = errorMessages[field];
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstInvalidField = (
        Object.keys(errorMessages) as RequiredField[]
      ).find((field) => nextErrors[field]);
      if (firstInvalidField) {
        dialogRef.current
          ?.querySelector<HTMLElement>(`#${fieldIds[firstInvalidField]}`)
          ?.focus();
      }
      return;
    }

    const result = onSave({
      activityId: draft.activityId,
      date: draft.date,
      note: draft.note.trim(),
      partySize: draft.partySize,
      rating: draft.rating,
    });
    setDraft((currentDraft) => ({
      ...currentDraft,
      note: currentDraft.note.trim(),
    }));
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
    <div className="checkin-dialog-backdrop">
      <div
        aria-labelledby="checkin-dialog-title"
        aria-modal="true"
        className="checkin-dialog"
        onKeyDown={trapDialogFocus}
        ref={dialogRef}
        role="dialog"
      >
        <header className="checkin-dialog-header">
          <div>
            <p className="section-label">周末回忆</p>
            <h2 id="checkin-dialog-title">记录一次出发</h2>
          </div>
          <button
            aria-label="关闭打卡窗口"
            className="theme-toggle checkin-dialog-close"
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
                ? "打卡已保存"
                : "打卡仅保留在本次会话"
            }
            className={`checkin-save-status${
              submissionStatus === "session-only"
                ? " checkin-save-status-warning"
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
                  ? "打卡已保存"
                  : "打卡仅保留在本次会话"}
              </strong>
              <span>
                {submissionStatus === "persistent"
                  ? "记录已留在这台设备上，关闭后可在历史中查看。"
                  : "浏览器存储写入失败。本次会话中仍可查看，刷新页面后会丢失。"}
              </span>
            </div>
          </div>
        ) : null}

        <form className="checkin-form" noValidate onSubmit={submitCheckin}>
          <fieldset disabled={submissionStatus !== null}>
            <div className="checkin-form-grid">
              <div className="checkin-form-field checkin-form-field-wide">
                <label htmlFor="checkin-activity">活动</label>
                <select
                  aria-describedby={
                    errors.activityId
                      ? "checkin-activity-error"
                      : undefined
                  }
                  aria-invalid={Boolean(errors.activityId)}
                  id="checkin-activity"
                  onChange={(event) =>
                    updateField("activityId", event.target.value)
                  }
                  ref={firstFieldRef}
                  value={draft.activityId}
                >
                  <option value="">选择去过的活动</option>
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title}
                    </option>
                  ))}
                </select>
                {errors.activityId ? (
                  <p
                    className="checkin-field-error"
                    id="checkin-activity-error"
                  >
                    {errors.activityId}
                  </p>
                ) : null}
              </div>

              <div className="checkin-form-field">
                <label htmlFor="checkin-date">日期</label>
                <input
                  aria-describedby={
                    errors.date ? "checkin-date-error" : undefined
                  }
                  aria-invalid={Boolean(errors.date)}
                  id="checkin-date"
                  onChange={(event) =>
                    updateField("date", event.target.value)
                  }
                  type="date"
                  value={draft.date}
                />
                {errors.date ? (
                  <p
                    className="checkin-field-error"
                    id="checkin-date-error"
                  >
                    {errors.date}
                  </p>
                ) : null}
              </div>

              <div className="checkin-form-field">
                <label htmlFor="checkin-party-size">同行人数</label>
                <select
                  id="checkin-party-size"
                  onChange={(event) =>
                    updateField(
                      "partySize",
                      event.target.value as PartySize,
                    )
                  }
                  value={draft.partySize}
                >
                  <option value="solo">一个人</option>
                  <option value="pair">两个人</option>
                  <option value="group">多人同行</option>
                </select>
              </div>

              <fieldset className="checkin-rating checkin-form-field-wide">
                <legend>评分</legend>
                <div className="checkin-rating-options">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating}>
                      <input
                        aria-label={`${rating} 星`}
                        checked={draft.rating === rating}
                        name="checkin-rating"
                        onChange={() => updateField("rating", rating)}
                        type="radio"
                        value={rating}
                      />
                      <span>
                        <Star aria-hidden="true" size={20} weight="fill" />
                        {rating}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="checkin-form-field checkin-form-field-wide">
                <label htmlFor="checkin-note">打卡记录</label>
                <textarea
                  aria-describedby={
                    errors.note
                      ? "checkin-note-error"
                      : "checkin-note-help"
                  }
                  aria-invalid={Boolean(errors.note)}
                  id="checkin-note"
                  onChange={(event) =>
                    updateField("note", event.target.value)
                  }
                  placeholder="记下路线、现场感受或下次再来的提示"
                  rows={4}
                  value={draft.note}
                />
                {errors.note ? (
                  <p
                    className="checkin-field-error"
                    id="checkin-note-error"
                  >
                    {errors.note}
                  </p>
                ) : (
                  <p
                    className="checkin-field-help"
                    id="checkin-note-help"
                  >
                    只记录文字，不会请求或保存照片。
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          <div className="checkin-form-actions">
            <p>
              {submissionStatus === "persistent"
                ? "本次内容已经保存，请关闭窗口查看最新记录。"
                : submissionStatus === "session-only"
                  ? "记录未写入浏览器存储，请关闭窗口查看本次会话记录。"
                  : "打卡记录仅保存在当前浏览器。"}
            </p>
            <button
              className="primary-action"
              disabled={submissionStatus !== null}
              type="submit"
            >
              <FloppyDisk aria-hidden="true" size={20} weight="bold" />
              保存打卡
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
