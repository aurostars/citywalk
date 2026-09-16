import {
  CheckCircle,
  UsersThree,
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
  WeekendDay,
} from "../../types/domain";

interface TeamFormProps {
  activities: Activity[];
  initialActivityId: string;
  onClose: () => void;
  onCreate: AppActions["createTeam"];
}

interface TeamDraft {
  activityId: string;
  capacity: string;
  departureTime: string;
  meetingPoint: string;
  note: string;
}

type RequiredField =
  | "activityId"
  | "departureTime"
  | "meetingPoint"
  | "note";
type SubmissionStatus = "persistent" | "session-only";

const errorMessages: Record<RequiredField, string> = {
  activityId: "请选择活动",
  departureTime: "请选择出发时间",
  meetingPoint: "请填写集合点",
  note: "请填写队伍说明",
};

const fieldIds: Record<RequiredField, string> = {
  activityId: "team-activity",
  departureTime: "team-departure",
  meetingPoint: "team-meeting-point",
  note: "team-note",
};

const weekdayLabels: Record<WeekendDay, string> = {
  saturday: "周六",
  sunday: "周日",
};

function getWeekendDay(departureTime: string): WeekendDay | null {
  const [datePart = ""] = departureTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const weekday = new Date(year, month - 1, day).getDay();
  if (weekday === 6) {
    return "saturday";
  }
  if (weekday === 0) {
    return "sunday";
  }
  return null;
}

export function TeamForm({
  activities,
  initialActivityId,
  onClose,
  onCreate,
}: TeamFormProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const successButtonRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<TeamDraft>({
    activityId: initialActivityId,
    capacity: "4",
    departureTime: "",
    meetingPoint: "",
    note: "",
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
      successButtonRef.current?.focus();
    }
  }, [submissionStatus]);

  function updateField(field: keyof TeamDraft, value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    if (field !== "capacity") {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  }

  function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStatus) {
      return;
    }
    const nextErrors: Partial<Record<RequiredField, string>> = {};

    (Object.keys(errorMessages) as RequiredField[]).forEach((field) => {
      if (!draft[field].trim()) {
        nextErrors[field] = errorMessages[field];
      }
    });
    const activity = activities.find(
      ({ id }) => id === draft.activityId,
    );
    const departureDay = getWeekendDay(draft.departureTime);
    if (
      activity &&
      draft.departureTime &&
      (
        departureDay === null ||
        !activity.availableWeekdays.includes(departureDay)
      )
    ) {
      const availableDays = activity.availableWeekdays
        .map((day) => weekdayLabels[day])
        .join("、");
      nextErrors.departureTime =
        `所选活动仅在${availableDays}开放，请调整出发日期`;
    }

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

    const result = onCreate({
      activityId: draft.activityId,
      leader: "我",
      departureTime: draft.departureTime,
      meetingPoint: draft.meetingPoint.trim(),
      capacity: Number(draft.capacity),
      note: draft.note.trim(),
    });
    setDraft((currentDraft) => ({
      ...currentDraft,
      meetingPoint: currentDraft.meetingPoint.trim(),
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

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  }

  return (
    <div className="team-dialog-backdrop">
      <div
        aria-labelledby="team-dialog-title"
        aria-modal="true"
        className="team-dialog"
        onKeyDown={trapDialogFocus}
        ref={dialogRef}
        role="dialog"
      >
        <header className="team-dialog-header">
          <div>
            <p className="section-label">本地组队</p>
            <h2 id="team-dialog-title">创建周末队伍</h2>
          </div>
          <button
            aria-label="关闭创建窗口"
            className="theme-toggle team-dialog-close"
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
                ? "队伍已创建"
                : "队伍仅保留在本次会话"
            }
            className={`team-create-status${
              submissionStatus === "session-only"
                ? " team-create-status-warning"
                : ""
            }`}
            role={
              submissionStatus === "persistent" ? "status" : "alert"
            }
          >
            {submissionStatus === "persistent" ? (
              <CheckCircle aria-hidden="true" size={24} weight="fill" />
            ) : (
              <WarningCircle aria-hidden="true" size={24} weight="fill" />
            )}
            <div>
              <strong>
                {submissionStatus === "persistent"
                  ? "队伍已创建"
                  : "队伍仅保留在本次会话"}
              </strong>
              <span>
                {submissionStatus === "persistent"
                  ? "队伍已保存在这台设备上，当前人数从你开始计算。"
                  : "浏览器存储写入失败。本次会话中仍可查看，刷新页面后会丢失。"}
              </span>
            </div>
          </div>
        ) : null}

        <form className="team-form" noValidate onSubmit={submitTeam}>
            <div className="team-form-field team-form-field-wide">
              <label htmlFor="team-activity">活动</label>
              <select
                aria-describedby={
                  errors.activityId ? "team-activity-error" : undefined
                }
                aria-invalid={Boolean(errors.activityId)}
                disabled={submissionStatus !== null}
                id="team-activity"
                onChange={(event) =>
                  updateField("activityId", event.target.value)
                }
                ref={firstFieldRef}
                value={draft.activityId}
              >
                <option value="">选择本周活动</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
              {errors.activityId ? (
                <p className="team-field-error" id="team-activity-error">
                  {errors.activityId}
                </p>
              ) : null}
            </div>

            <div className="team-form-field">
              <label htmlFor="team-departure">出发时间</label>
              <input
                aria-describedby={
                  errors.departureTime
                    ? "team-departure-error"
                    : undefined
                }
                aria-invalid={Boolean(errors.departureTime)}
                disabled={submissionStatus !== null}
                id="team-departure"
                onChange={(event) =>
                  updateField("departureTime", event.target.value)
                }
                type="datetime-local"
                value={draft.departureTime}
              />
              {errors.departureTime ? (
                <p className="team-field-error" id="team-departure-error">
                  {errors.departureTime}
                </p>
              ) : null}
            </div>

            <div className="team-form-field">
              <label htmlFor="team-capacity">人数上限</label>
              <select
                disabled={submissionStatus !== null}
                id="team-capacity"
                onChange={(event) =>
                  updateField("capacity", event.target.value)
                }
                value={draft.capacity}
              >
                {[2, 3, 4, 5, 6].map((capacity) => (
                  <option key={capacity} value={capacity}>
                    {capacity} 人
                  </option>
                ))}
              </select>
            </div>

            <div className="team-form-field team-form-field-wide">
              <label htmlFor="team-meeting-point">集合点</label>
              <input
                aria-describedby={
                  errors.meetingPoint
                    ? "team-meeting-point-error"
                    : undefined
                }
                aria-invalid={Boolean(errors.meetingPoint)}
                disabled={submissionStatus !== null}
                id="team-meeting-point"
                onChange={(event) =>
                  updateField("meetingPoint", event.target.value)
                }
                placeholder="例如 798 艺术区南门"
                type="text"
                value={draft.meetingPoint}
              />
              {errors.meetingPoint ? (
                <p
                  className="team-field-error"
                  id="team-meeting-point-error"
                >
                  {errors.meetingPoint}
                </p>
              ) : null}
            </div>

            <div className="team-form-field team-form-field-wide">
              <label htmlFor="team-note">队伍说明</label>
              <textarea
                aria-describedby={
                  errors.note ? "team-note-error" : "team-note-help"
                }
                aria-invalid={Boolean(errors.note)}
                disabled={submissionStatus !== null}
                id="team-note"
                onChange={(event) => updateField("note", event.target.value)}
                placeholder="说明大致安排、同行节奏或需要准备的物品"
                rows={4}
                value={draft.note}
              />
              {errors.note ? (
                <p className="team-field-error" id="team-note-error">
                  {errors.note}
                </p>
              ) : (
                <p className="team-field-help" id="team-note-help">
                  不要填写手机号或其他敏感信息。
                </p>
              )}
            </div>

            <div className="team-form-actions">
              <p>
                {submissionStatus === "persistent"
                  ? "队伍已经保存，请关闭窗口查看我的队伍。"
                  : submissionStatus === "session-only"
                    ? "队伍未写入浏览器存储，请关闭窗口查看本次会话队伍。"
                    : "创建后你会成为队长，并作为第 1 位成员加入。"}
              </p>
              <button
                className="primary-action"
                disabled={submissionStatus !== null}
                type="submit"
              >
                <UsersThree aria-hidden="true" size={20} weight="bold" />
                创建队伍
              </button>
              {submissionStatus ? (
                <button
                  className="secondary-action"
                  onClick={onClose}
                  ref={successButtonRef}
                  type="button"
                >
                  查看我的队伍
                </button>
              ) : null}
            </div>
          </form>
      </div>
    </div>
  );
}
