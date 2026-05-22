import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuCircleAlert,
  LuBug,
  LuClock,
  LuSave,
  LuCalendar,
  LuUsers,
  LuClipboardList,
  LuFolder,
  LuFlag,
  LuPaperclip,
  LuExternalLink,
  LuPackage,
} from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import AvatarGroup from "../../components/AvatarGroup";
import ProjectProgressBar from "../../components/ProjectProgressBar";
import {
  formatDate,
  getPriorityColor,
  getErrorMessage,
  getTaskId,
  getAttachmentLabel,
  resolveAttachmentUrl,
  openAttachment,
  normalizeTaskAttachments,
} from "../../utils/helper";
import { useUser } from "../../context/userContext";
import { isTaskViewOnlyRole } from "../../utils/rolePaths";
import TaskAttachmentsInput from "../../components/Inputs/TaskAttachmentsInput";

const TodoCheckList = ({ text, isChecked, onChange, disabled, loading }) => (
  <label
    className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border border-gray-100 bg-white transition-colors ${
      disabled ? "cursor-default opacity-90" : "cursor-pointer hover:border-primary/30 hover:bg-primary/5"
    }`}
  >
    <span className="flex items-center gap-3 flex-1 min-w-0">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 shrink-0 text-primary bg-gray-100 border-gray-300 rounded outline-none cursor-pointer disabled:cursor-not-allowed"
      />
      <span
        className={`text-sm ${isChecked ? "text-gray-400 line-through" : "text-gray-800"}`}
      >
        {text}
      </span>
    </span>
    {loading && (
      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
    )}
  </label>
);

const MetaChip = ({ label, children }) => (
  <span className="inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-1.5 text-sm">
    <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
      {label}
    </span>
    {children}
  </span>
);

const DetailTile = ({ icon: Icon, label, children }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 h-full">
    <div className="flex items-center gap-2 mb-2">
      {Icon && <Icon className="text-gray-400 text-sm shrink-0" />}
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
    </div>
    <div className="text-sm font-medium text-gray-900">{children}</div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, hint, badge }) => (
  <div className="flex items-start justify-between gap-3 mb-3">
    <div className="flex items-center gap-2 min-w-0">
      {Icon && <Icon className="text-gray-400 text-base shrink-0" />}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 leading-tight">{title}</h3>
        {hint && <p className="text-xs text-gray-500 leading-snug mt-0.5">{hint}</p>}
      </div>
    </div>
    {badge && <div className="flex items-center gap-1.5 shrink-0">{badge}</div>}
  </div>
);

const Attachment = ({ item, index, subtitle }) => {
  const href = resolveAttachmentUrl(item.url);
  const label = item.name || getAttachmentLabel(item.url);

  const handleOpen = (e) => {
    e.preventDefault();
    if (!openAttachment(item)) {
      toast.error("Could not open this attachment");
    }
  };

  return (
    <a
      href={href || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleOpen}
      className="flex items-center justify-between gap-3 bg-white border border-gray-100 px-4 py-3 rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors group"
      title={`Open ${label} in a new tab`}
    >
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-xs text-gray-400 font-semibold shrink-0">
          {index < 9 ? "0" : ""}
          {index + 1}
        </span>
        <LuPaperclip className="text-gray-400 shrink-0 group-hover:text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
          <p className="text-xs text-gray-500 truncate">{item.url}</p>
          {subtitle && (
            <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
        Open
        <LuExternalLink className="text-sm" />
      </span>
    </a>
  );
};

const cloneChecklist = (list = []) =>
  list.map((item) => ({
    ...item,
    completed: Boolean(item.completed),
  }));

const checklistSignature = (list = []) =>
  JSON.stringify(
    list.map((item) => ({
      text: item.text,
      completed: Boolean(item.completed),
    })),
  );

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [task, setTask] = useState(null);
  const [draftChecklist, setDraftChecklist] = useState([]);
  const [draftCompletionAttachments, setDraftCompletionAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState("");

  const getStatusTagColor = (status) => {
    switch (status) {
      case "In Progress":
        return "text-cyan-500 bg-cyan-50 border border-cyan-500/10";
      case "Completed":
        return "text-lime-500 bg-lime-50 border border-lime-500/20";
      case "In Review":
        return "text-violet-600 bg-violet-50 border border-violet-500/20";
      case "Changes Requested":
        return "text-amber-700 bg-amber-50 border border-amber-500/20";
      default:
        return "text-violet-500 bg-violet-50 border border-violet-500/10";
    }
  };

  const getTaskDetailsById = async () => {
    const taskId = getTaskId(id);
    if (!taskId || taskId === "undefined") {
      setError("Invalid task ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(taskId),
      );

      const taskData = response.data?.task ?? response.data;
      if (taskData && getTaskId(taskData)) {
        setTask(taskData);
        setDraftChecklist(cloneChecklist(taskData.todoChecklist));
        setDraftCompletionAttachments(
          normalizeTaskAttachments(taskData.completionAttachments || []),
        );
        setError(null);
      } else {
        setTask(null);
        setError("Task not found");
      }
    } catch (apiError) {
      console.error("Error fetching task:", apiError);
      setError("Failed to load task details");
      toast.error(getErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  };

  const toggleDraftChecklistItem = (index) => {
    if (!task) return;

    setDraftChecklist((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, completed: !item.completed }
          : item,
      ),
    );
  };

  const handleSaveChecklist = async () => {
    if (!task || isSavingChecklist) return;
    if (isTaskViewOnlyRole(user?.role)) {
      toast.error(
        "Super Admins and Admins can only view tasks. Checklist updates are not allowed for your role.",
      );
      return;
    }

    const draftDone =
      draftChecklist.length > 0 &&
      draftChecklist.every((item) => item.completed);
    const checklistChanged =
      checklistSignature(draftChecklist) !==
      checklistSignature(task.todoChecklist);
    const completionChanged =
      JSON.stringify(draftCompletionAttachments) !==
      JSON.stringify(normalizeTaskAttachments(task.completionAttachments || []));

    if (!checklistChanged && !completionChanged) {
      toast.error("No changes to save");
      return;
    }

    const submittingForReview =
      draftDone && task.tester && task.status !== "In Review";

    if (submittingForReview && draftCompletionAttachments.length === 0) {
      toast.error(
        "Add at least one delivery attachment (file or link) before submitting for testing.",
      );
      return;
    }

    setIsSavingChecklist(true);

    try {
      const payload = { todoChecklist: draftChecklist };
      if (completionChanged || draftCompletionAttachments.length > 0) {
        payload.completionAttachments = draftCompletionAttachments;
      }

      const response = await axiosInstance.put(API_PATHS.TASKS.UPDATE_TODO(id), payload);

      const updatedTask = response?.data?.task || response?.data;
      if (updatedTask) {
        setTask(updatedTask);
        setDraftChecklist(cloneChecklist(updatedTask.todoChecklist));
        setDraftCompletionAttachments(
          normalizeTaskAttachments(updatedTask.completionAttachments || []),
        );
      }
      toast.success("Task updated successfully");
    } catch (apiError) {
      toast.error(getErrorMessage(apiError) || "Failed to update checklist");
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const handleReviewTask = async (result) => {
    if (result === "failed" && !reviewComment.trim()) {
      toast.error("Add bug details before sending it back");
      return;
    }

    try {
      setReviewLoading(result);
      const response = await axiosInstance.put(API_PATHS.TASKS.REVIEW_TASK(id), {
        result,
        comment: reviewComment,
      });
      const updatedTask = response?.data?.task || response?.data;
      if (updatedTask) setTask(updatedTask);
      setReviewComment("");
      toast.success(
        result === "passed" ? "Task approved" : "Bug sent back to developer",
      );
    } catch (apiError) {
      toast.error(getErrorMessage(apiError));
    } finally {
      setReviewLoading("");
    }
  };

  const isOverdue = () => {
    if (!task?.dueDate || task.status === "Completed") return false;
    return new Date(task.dueDate) < new Date();
  };

  useEffect(() => {
    if (id) {
      getTaskDetailsById();
    } else {
      setError("No task ID provided");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="text-center py-12">
          <LuCircleAlert className="text-5xl text-red-300 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="text-center py-12">
          <p className="text-gray-500">Task not found</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isTester = user?.role === "tester";
  const isAssigned = (task.assignedTo || []).some((assignee) => {
    const assigneeId =
      assignee && typeof assignee === "object" ? assignee._id : assignee;
    return String(assigneeId) === String(user?._id);
  });
  const canUpdateTodo = user?.role === "teamMember" && isAssigned;
  const activeChecklist = canUpdateTodo ? draftChecklist : task.todoChecklist || [];
  const completedTodos =
    activeChecklist.filter((t) => t.completed).length || 0;
  const totalTodos = activeChecklist.length || 0;
  const progress =
    totalTodos > 0
      ? Math.round((completedTodos / totalTodos) * 100)
      : task.progress || 0;
  const hasChecklistChanges =
    canUpdateTodo &&
    checklistSignature(draftChecklist) !==
      checklistSignature(task.todoChecklist);
  const showCompletedBanner =
    task.status === "Completed" &&
    !hasChecklistChanges &&
    totalTodos > 0 &&
    completedTodos === totalTodos;
  const testerId =
    task.tester && typeof task.tester === "object" ? task.tester._id : task.tester;
  const isViewOnlyTask = isTaskViewOnlyRole(user?.role);
  const canReview =
    !isViewOnlyTask &&
    task.status === "In Review" &&
    isTester &&
    testerId &&
    String(testerId) === String(user?._id);

  const assignedNames =
    task.assignedTo?.map((u) => u.name).filter(Boolean).join(", ") || "Unassigned";
  const testerName =
    task.tester && typeof task.tester === "object"
      ? task.tester.name
      : "Not assigned";
  const projectName =
    task.projectId && typeof task.projectId === "object"
      ? task.projectId.name
      : null;
  const referenceAttachments = normalizeTaskAttachments(task.attachments || []);
  const completionAttachments = normalizeTaskAttachments(
    task.completionAttachments || [],
  );
  const draftChecklistDone =
    draftChecklist.length > 0 && draftChecklist.every((item) => item.completed);
  const canEditCompletion =
    canUpdateTodo && draftChecklistDone && task.status !== "Completed";
  const isTesterView = user?.role === "tester";
  const completionChanged =
    JSON.stringify(draftCompletionAttachments) !==
    JSON.stringify(completionAttachments);
  const hasSaveableChanges =
    hasChecklistChanges || (canUpdateTodo && completionChanged);

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-6 max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <LuArrowLeft className="text-xl" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">
              Task name
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {task.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {projectName && (
                <MetaChip label="Project">
                  <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                    <LuFolder className="text-gray-500 text-sm" />
                    {projectName}
                  </span>
                </MetaChip>
              )}
              <MetaChip label="Status">
                <span
                  className={`font-medium px-2 py-0.5 rounded-full text-xs ${getStatusTagColor(task.status)}`}
                >
                  {task.status}
                </span>
              </MetaChip>
              <MetaChip label="Priority">
                <span
                  className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-xs ${getPriorityColor(task.priority)}`}
                >
                  <LuFlag className="text-[10px] opacity-70" />
                  {task.priority}
                </span>
              </MetaChip>
            </div>
          </div>

          <div className="px-6 py-6 space-y-6">
            {isViewOnlyTask && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                View-only access: Super Admins and Admins cannot update task status or
                checklist items.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <SectionTitle
                    title="Description"
                    hint="What you need to do"
                  />
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-4 min-h-[3.5rem]">
                    {task.description?.trim() || "No description provided."}
                  </p>
                </div>

                {activeChecklist.length > 0 && (
                  <div>
                    <SectionTitle
                      icon={LuClipboardList}
                      title="Todo checklist"
                      badge={
                        <>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {completedTodos}/{totalTodos}
                          </span>
                          {hasChecklistChanges && (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              Unsaved
                            </span>
                          )}
                        </>
                      }
                    />
                    <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/40 p-3">
                      {activeChecklist.map((item, index) => (
                        <TodoCheckList
                          key={`${item.text}-${index}`}
                          text={item.text}
                          isChecked={item.completed}
                          onChange={() => toggleDraftChecklistItem(index)}
                          disabled={!canUpdateTodo || isSavingChecklist}
                        />
                      ))}
                    </div>
                    {canUpdateTodo && (
                      <p className="text-xs text-gray-500 mt-2">
                        Check all items off, add delivery attachments if required, then
                        click Update Status.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <SectionTitle
                    icon={LuPaperclip}
                    title="Reference attachments"
                    hint="From project manager — requirements, repo, specs"
                    badge={
                      referenceAttachments.length > 0 ? (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {referenceAttachments.length}
                        </span>
                      ) : null
                    }
                  />
                  {referenceAttachments.length > 0 ? (
                    <div className="space-y-2">
                      {referenceAttachments.map((item, index) => (
                        <Attachment
                          key={`ref-${item.url}-${index}`}
                          item={item}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 rounded-xl border border-dashed border-gray-200 px-4 py-4">
                      No reference files or links added yet.
                    </p>
                  )}
                </div>

                {(canEditCompletion ||
                  completionAttachments.length > 0 ||
                  (isTesterView && task.status === "In Review")) && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                    <SectionTitle
                      icon={LuPackage}
                      title="Delivery attachments"
                      hint={
                        canEditCompletion
                          ? "Add proof of work (build, demo link, zip) — required before testing"
                          : "Submitted by team member for QA review"
                      }
                      badge={
                        (canEditCompletion
                          ? draftCompletionAttachments
                          : completionAttachments
                        ).length > 0 ? (
                          <span className="text-xs text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                            {(canEditCompletion
                              ? draftCompletionAttachments
                              : completionAttachments
                            ).length}
                          </span>
                        ) : null
                      }
                    />
                    {canEditCompletion ? (
                      <TaskAttachmentsInput
                        attachments={draftCompletionAttachments}
                        onChange={setDraftCompletionAttachments}
                        helperText="Upload or link your completed work. Tester will open these when reviewing."
                      />
                    ) : completionAttachments.length > 0 ? (
                      <div className="space-y-2">
                        {completionAttachments.map((item, index) => (
                          <Attachment
                            key={`del-${item.url}-${index}`}
                            item={item}
                            index={index}
                            subtitle={
                              item.uploadedBy?.name
                                ? `Uploaded by ${item.uploadedBy.name}`
                                : undefined
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Waiting for team member delivery files.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-4">
                {totalTodos > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Checklist
                      </p>
                      <span className="text-xl font-semibold text-gray-900 leading-none">
                        {progress}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {completedTodos}/{totalTodos} done
                    </p>
                    <ProjectProgressBar progress={progress} showLabel={false} />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
              <DetailTile icon={LuCalendar} label="Due date">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{formatDate(task.dueDate)}</span>
                  {isOverdue() && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Overdue
                    </span>
                  )}
                </div>
              </DetailTile>

              <DetailTile icon={LuClock} label="Created">
                {formatDate(task.createdAt)}
              </DetailTile>

              <DetailTile icon={LuUsers} label="Assigned to">
                <div className="flex items-center gap-2 flex-wrap">
                  {task.assignedTo?.length > 0 && (
                    <AvatarGroup
                      users={task.assignedTo}
                      maxVisible={4}
                      showTooltip
                      size="sm"
                    />
                  )}
                  <span className="text-sm font-normal text-gray-600">{assignedNames}</span>
                </div>
              </DetailTile>

              <DetailTile icon={LuCircleCheck} label="Tester (QA)">
                <span title="Person who reviews this task when it is ready">
                  {testerName}
                </span>
              </DetailTile>
                </div>
              </div>
            </div>

            {task.reviewHistory && task.reviewHistory.length > 0 && (
              <div>
                <SectionTitle title="Testing notes" />
                <div className="space-y-3">
                  {task.reviewHistory.map((review, index) => (
                    <div
                      key={review._id || index}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            review.status === "passed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {review.status === "passed" ? "Passed" : "Bug"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {review.tester?.name || "Tester"}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canReview && (
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-5">
                <SectionTitle title="Tester review" />
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows="3"
                  className="input w-full bg-white"
                  placeholder="Bug details or approval note"
                  disabled={Boolean(reviewLoading)}
                />
                <div className="flex justify-end gap-3 mt-3">
                  <button
                    type="button"
                    className="btn-outline flex items-center gap-2"
                    onClick={() => handleReviewTask("failed")}
                    disabled={Boolean(reviewLoading)}
                  >
                    <LuBug />
                    {reviewLoading === "failed" ? "Sending..." : "Send Bug"}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleReviewTask("passed")}
                    disabled={Boolean(reviewLoading)}
                  >
                    {reviewLoading === "passed" ? "Approving..." : "Approve"}
                  </button>
                </div>
              </div>
            )}

            {canUpdateTodo && totalTodos > 0 && (
              <div className="flex justify-end pt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  disabled={!hasSaveableChanges || isSavingChecklist}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingChecklist ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <LuSave />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            )}

            {showCompletedBanner && (
              <div className="flex items-center justify-center gap-2 text-green-700 py-3 px-4 rounded-xl bg-green-50 border border-green-100">
                <LuCircleCheck className="text-lg" />
                <span className="text-sm font-medium">Task completed</span>
              </div>
            )}

            {canUpdateTodo &&
              task.status === "Completed" &&
              hasChecklistChanges &&
              completedTodos < totalTodos && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                  Uncheck items and click Update Status to reopen this task.
                </p>
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaskDetails;
