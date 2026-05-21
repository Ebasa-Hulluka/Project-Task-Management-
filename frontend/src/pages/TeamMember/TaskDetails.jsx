import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuSquareArrowOutUpRight,
  LuCircleCheck,
  LuCircleAlert,
  LuBug,
  LuClock,
  LuSave,
  LuCalendar,
  LuUsers,
  LuClipboardList,
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
} from "../../utils/helper";
import { useUser } from "../../context/userContext";
import { isTaskViewOnlyRole } from "../../utils/rolePaths";

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

const DetailTile = ({ icon: Icon, label, children }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 h-full">
    <div className="flex items-center gap-2 mb-2">
      {Icon && (
        <span className="inline-flex p-1.5 rounded-lg bg-white border border-gray-100">
          <Icon className="text-gray-500 text-base" />
        </span>
      )}
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
    </div>
    <div className="text-sm font-medium text-gray-900">{children}</div>
  </div>
);

const Attachment = ({ link, index, onClick }) => {
  return (
    <div
      className="flex justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-md mb-3 mt-2 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs text-gray-400 font-semibold mr-2">
          {index < 9 ? "0" : ""}
          {index + 1}
        </span>
        <p className="text-xs text-black truncate max-w-md">{link}</p>
      </div>
      <LuSquareArrowOutUpRight className="text-gray-400" />
    </div>
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
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id));

      if (response.data) {
        setTask(response.data);
        setDraftChecklist(cloneChecklist(response.data.todoChecklist));
        setError(null);
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

    if (
      checklistSignature(draftChecklist) ===
      checklistSignature(task.todoChecklist)
    ) {
      toast.error("No checklist changes to save");
      return;
    }

    setIsSavingChecklist(true);

    try {
      const response = await axiosInstance.put(API_PATHS.TASKS.UPDATE_TODO(id), {
        todoChecklist: draftChecklist,
      });

      const updatedTask = response?.data?.task || response?.data;
      if (updatedTask) {
        setTask(updatedTask);
        setDraftChecklist(cloneChecklist(updatedTask.todoChecklist));
      }
      toast.success("Task updated successfully");
    } catch (apiError) {
      toast.error(getErrorMessage(apiError) || "Failed to update checklist");
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const handleLinkClick = (link) => {
    let safeLink = link;
    if (!/^https?:\/\//i.test(safeLink)) {
      safeLink = `https://${safeLink}`;
    }
    window.open(safeLink, "_blank");
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
    ((isTester && testerId === user?._id) ||
      user?.role === "projectManager");

  const assignedNames =
    task.assignedTo?.map((u) => u.name).filter(Boolean).join(", ") || "Unassigned";
  const testerName =
    task.tester && typeof task.tester === "object"
      ? task.tester.name
      : "Unassigned";

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-5 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <LuArrowLeft className="text-xl" />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-medium">Task Details</h2>
            {task.projectId && typeof task.projectId === "object" && (
              <p className="text-sm text-gray-500 mt-0.5">
                {task.projectId.name || "Project"}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusTagColor(task.status)}`}
                >
                  {task.status}
                </span>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {isViewOnlyTask && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                View-only access: Super Admins and Admins cannot update task status or
                checklist items.
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description?.trim() || "No description provided."}
              </p>
            </div>

            {totalTodos > 0 && (
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Checklist progress
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {completedTodos} of {totalTodos} items completed
                    </p>
                  </div>
                  <span className="text-2xl font-semibold text-gray-900">{progress}%</span>
                </div>
                <ProjectProgressBar progress={progress} showLabel={false} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  {task.assignedTo?.length > 0 ? (
                    <AvatarGroup
                      users={task.assignedTo}
                      maxVisible={5}
                      showTooltip
                    />
                  ) : null}
                  <p className="text-sm font-normal text-gray-600">{assignedNames}</p>
                </div>
              </DetailTile>

              <DetailTile icon={LuCircleCheck} label="Tester">
                {testerName}
              </DetailTile>
            </div>

            {activeChecklist.length > 0 && (
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <LuClipboardList className="text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-800">
                      Todo checklist
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {completedTodos}/{totalTodos}
                    </span>
                  </div>
                  {hasChecklistChanges && (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Unsaved changes
                    </span>
                  )}
                </div>
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
                    Check items off, then click Update Status to save.
                  </p>
                )}
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Attachments ({task.attachments.length})
                </h3>
                <div className="space-y-2">
                  {task.attachments.map((link, index) => (
                    <Attachment
                      key={`${link}-${index}`}
                      link={link}
                      index={index}
                      onClick={() => handleLinkClick(link)}
                    />
                  ))}
                </div>
              </div>
            )}

            {task.reviewHistory && task.reviewHistory.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Testing notes
                </h3>
                <div className="space-y-2">
                  {task.reviewHistory.map((review, index) => (
                    <div
                      key={review._id || index}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
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
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3">
                  Tester Review
                </h3>
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
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSaveChecklist}
                  disabled={!hasChecklistChanges || isSavingChecklist}
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
