import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuSquareArrowOutUpRight,
  LuCircleCheck,
  LuCircleAlert,
  LuPencil,
  LuBug,
  LuClock,
  LuSave,
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

const TodoCheckList = ({ text, isChecked, onChange, disabled, loading }) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <label className="flex items-center gap-3 flex-1 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          disabled={disabled}
          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded-sm outline-none cursor-pointer disabled:cursor-not-allowed"
        />
        <p
          className={`text-[13px] ${isChecked ? "text-gray-400 line-through" : "text-gray-800"}`}
        >
          {text}
        </p>
      </label>
      {loading && <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></span>}
    </div>
  );
};

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

const InfoBox = ({ label, value }) => {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="text-[12px] md:text-[13px] font-medium text-gray-700 mt-0.5">
        {hasValue ? value : "N/A"}
      </div>
    </div>
  );
};

const STATUS_OPTIONS = [
  {
    value: "Pending",
    label: "Pending",
    color: "bg-gray-100 text-gray-700",
    icon: LuClock,
  },
  {
    value: "In Progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: LuClock,
  },
  {
    value: "Completed",
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: LuCircleCheck,
  },
];

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingTodo, setIsUpdatingTodo] = useState(false);
  const [updatingTodoIndex, setUpdatingTodoIndex] = useState(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState("");
  const [showStatusEditor, setShowStatusEditor] = useState(
    Boolean(location.state?.openStatusEditor),
  );
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusProgress, setStatusProgress] = useState(0);
  const [statusComment, setStatusComment] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

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

  const updateTodoChecklist = async (index) => {
    if (!task || isUpdatingTodo || task.status === "Completed") return;

    const previousChecklist = (task.todoChecklist || []).map((item) => ({
      ...item,
    }));

    const nextChecklist = previousChecklist.map((item, itemIndex) =>
      itemIndex === index ? { ...item, completed: !item.completed } : item,
    );

    setTask((prev) => ({
      ...prev,
      todoChecklist: nextChecklist,
    }));

    setIsUpdatingTodo(true);
    setUpdatingTodoIndex(index);

    try {
      const response = await axiosInstance.put(API_PATHS.TASKS.UPDATE_TODO(id), {
        todoChecklist: nextChecklist,
      });

      const updatedTask = response?.data?.task || response?.data;
      if (updatedTask) {
        setTask(updatedTask);
      }
      toast.success("Checklist updated");
    } catch (apiError) {
      setTask((prev) => ({
        ...prev,
        todoChecklist: previousChecklist,
      }));
      toast.error(getErrorMessage(apiError) || "Failed to update checklist");
    } finally {
      setIsUpdatingTodo(false);
      setUpdatingTodoIndex(null);
    }
  };

  const handleLinkClick = (link) => {
    let safeLink = link;
    if (!/^https?:\/\//i.test(safeLink)) {
      safeLink = `https://${safeLink}`;
    }
    window.open(safeLink, "_blank");
  };

  const openStatusEditor = () => {
    if (!task) return;
    setSelectedStatus(task.status);
    setStatusProgress(task.progress || 0);
    setStatusComment("");
    setShowStatusEditor(true);
  };

  const closeStatusEditor = () => {
    setShowStatusEditor(false);
    setStatusComment("");
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    if (selectedStatus === task.status && statusProgress === (task.progress || 0)) {
      toast.error("No changes detected");
      return;
    }

    setStatusUpdating(true);

    try {
      if (selectedStatus !== task.status) {
        const response = await axiosInstance.put(
          API_PATHS.TASKS.UPDATE_TASK_STATUS(id),
          { status: selectedStatus },
        );
        const updatedTask = response?.data?.task || response?.data;
        if (updatedTask) {
          setTask(updatedTask);
        } else {
          setTask((prev) => ({ ...prev, status: selectedStatus }));
        }
      }

      toast.success("Task status updated successfully!");
      closeStatusEditor();
    } catch (apiError) {
      toast.error(getErrorMessage(apiError));
    } finally {
      setStatusUpdating(false);
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

  useEffect(() => {
    if (task && location.state?.openStatusEditor) {
      setSelectedStatus(task.status);
      setStatusProgress(task.progress || 0);
      setShowStatusEditor(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [task, location.pathname, location.state?.openStatusEditor, navigate]);

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

  const completedTodos =
    task.todoChecklist?.filter((t) => t.completed).length || 0;
  const totalTodos = task.todoChecklist?.length || 0;
  const progress =
    totalTodos > 0
      ? Math.round((completedTodos / totalTodos) * 100)
      : task.progress || 0;
  const isTester = user?.role === "tester";
  const isAssigned = (task.assignedTo || []).some((assignee) => {
    const assigneeId =
      assignee && typeof assignee === "object" ? assignee._id : assignee;
    return String(assigneeId) === String(user?._id);
  });
  const canUpdateStatus =
    user?.role === "teamMember" && isAssigned && task.status !== "Completed";
  const canUpdateTodo =
    user?.role === "teamMember" && isAssigned && task.status !== "Completed";
  const testerId =
    task.tester && typeof task.tester === "object" ? task.tester._id : task.tester;
  const canReview =
    task.status === "In Review" &&
    ((isTester && testerId === user?._id) ||
      user?.role === "admin" ||
      user?.role === "superAdmin" ||
      user?.role === "projectManager");

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuArrowLeft className="text-xl" />
          </button>
          <h2 className="text-xl md:text-2xl font-medium">Task Details</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{task.title}</h1>
                {task.projectId && typeof task.projectId === "object" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Project: {task.projectId.name || "N/A"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusTagColor(task.status)}`}
                >
                  {task.status}
                </span>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                >
                  {task.priority} Priority
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {task.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Description
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {totalTodos > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Progress
                  </h3>
                  <span className="text-sm font-medium text-primary">
                    {progress}%
                  </span>
                </div>
                <ProjectProgressBar progress={progress} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InfoBox
                label="Due Date"
                value={
                  <div className="flex items-center gap-2">
                    <span>{formatDate(task.dueDate)}</span>
                    {isOverdue() && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                }
              />

              <InfoBox label="Created" value={formatDate(task.createdAt)} />

              <div>
                <label className="text-xs font-medium text-slate-500">
                  Assigned Users
                </label>
                <div className="mt-1">
                  <AvatarGroup
                    avatars={
                      task.assignedTo?.map((u) => u.profileImageUrl) || []
                    }
                    names={task.assignedTo?.map((u) => u.name) || []}
                    maxVisible={5}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {task.assignedTo?.map((u) => u.name).join(", ") || "N/A"}
                </p>
              </div>

              <InfoBox label="Status" value={task.status} />
              <InfoBox
                label="Tester"
                value={
                  task.tester && typeof task.tester === "object"
                    ? task.tester.name
                    : "Unassigned"
                }
              />
            </div>

            {task.todoChecklist && task.todoChecklist.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Todo Checklist ({completedTodos}/{totalTodos})
                  </h3>
                  {isUpdatingTodo && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg divide-y">
                  {task.todoChecklist.map((item, index) => (
                    <TodoCheckList
                      key={`${item.text}-${index}`}
                      text={item.text}
                      isChecked={item.completed}
                      onChange={() => updateTodoChecklist(index)}
                      disabled={isUpdatingTodo || task.status === "Completed"}
                      loading={updatingTodoIndex === index}
                    />
                  ))}
                </div>
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
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
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Testing Notes
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
              <div className="mb-6 rounded-lg border border-violet-100 bg-violet-50/40 p-4">
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

            {canUpdateStatus && !showStatusEditor && (
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={openStatusEditor}
                  className="btn-primary flex items-center gap-2"
                >
                  <LuPencil />
                  Update Status
                </button>
              </div>
            )}

            {canUpdateStatus && showStatusEditor && (
              <form
                onSubmit={handleStatusSubmit}
                className="mt-6 rounded-lg border border-gray-100 bg-gray-50/60 p-4"
              >
                <h3 className="text-sm font-medium text-gray-800 mb-4">
                  Update Status
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select New Status
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedStatus(option.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedStatus === option.value
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          disabled={option.value === task.status}
                        >
                          <div
                            className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${option.color}`}
                          >
                            <Icon />
                          </div>
                          <p className="text-sm font-medium">{option.label}</p>
                          {option.value === task.status && (
                            <p className="text-xs text-gray-400 mt-1">Current</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedStatus === "In Progress" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progress ({statusProgress}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={statusProgress}
                      onChange={(e) => setStatusProgress(parseInt(e.target.value, 10))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Comment (Optional)
                  </label>
                  <textarea
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    rows="3"
                    className="input w-full bg-white"
                    placeholder="Add any notes about this status update..."
                    disabled={statusUpdating}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeStatusEditor}
                    className="btn-outline"
                    disabled={statusUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={statusUpdating || selectedStatus === task.status}
                    className="btn-primary flex items-center gap-2"
                  >
                    {statusUpdating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <LuSave />
                        Save Status
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {task.status === "Completed" && (
              <div className="flex items-center justify-end gap-2 text-green-600 pt-4 border-t">
                <LuCircleCheck />
                <span className="text-sm font-medium">Task Completed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TaskDetails;
