import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft,
  LuCircleCheck,
  LuClock,
  LuCircleAlert,
  LuSave,
} from "react-icons/lu";
import moment from "moment";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getErrorMessage } from "../../utils/helper";

const UpdateTaskStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const taskFromState = location.state?.task;

  const [task, setTask] = useState(taskFromState || null);
  const [loading, setLoading] = useState(!taskFromState);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [comment, setComment] = useState("");

  const statusOptions = [
    {
      value: "Pending",
      label: "Pending",
      color: "bg-gray-100 text-gray-700",
      icon: <LuClock />,
    },
    {
      value: "In Progress",
      label: "In Progress",
      color: "bg-blue-100 text-blue-700",
      icon: <LuClock />,
    },
    {
      value: "Completed",
      label: "Completed",
      color: "bg-green-100 text-green-700",
      icon: <LuCircleCheck />,
    },
  ];

  // Fetch task details if not passed from state
  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id));

      if (response.data) {
        setTask(response.data);
        setSelectedStatus(response.data.status);
        setProgress(response.data.progress || 0);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task details");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!task) {
      fetchTaskDetails();
    } else {
      setSelectedStatus(task.status);
      setProgress(task.progress || 0);
    }
  }, [id, task]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    if (selectedStatus === task.status && progress === task.progress) {
      toast.error("No changes detected");
      return;
    }

    setUpdating(true);

    try {
      // Update status
      if (selectedStatus !== task.status) {
        await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK_STATUS(id), {
          status: selectedStatus,
        });
      }

      // If task has todo checklist and is completed, the backend will auto-update

      toast.success("Task status updated successfully!");

      // Navigate back to task details
      navigate(`/member/tasks/${id}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout activeMenu="My Tasks">
        <div className="text-center py-12">
          <LuCircleAlert className="text-5xl text-red-300 mx-auto mb-4" />
          <p className="text-gray-500">Task not found</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = () => {
    if (!task.dueDate || task.status === "Completed") return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <DashboardLayout activeMenu="My Tasks">
      <div className="my-5 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuArrowLeft className="text-xl" />
          </button>
          <h2 className="text-xl md:text-2xl font-medium">
            Update Task Status
          </h2>
        </div>

        {/* Task Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-lg mb-2">{task.title}</h3>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500">Current Status</p>
              <p className="text-sm font-medium mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    task.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {task.status}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                {moment(task.dueDate).format("MMM D, YYYY")}
                {isOverdue() && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    Overdue
                  </span>
                )}
              </p>
            </div>
          </div>

          {task.projectId && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Project</p>
              <p className="text-sm font-medium mt-1">{task.projectId.name}</p>
            </div>
          )}
        </div>

        {/* Update Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="font-semibold mb-4">Update Status</h3>

          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select New Status
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {statusOptions.map((option) => (
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
                    {option.icon}
                  </div>
                  <p className="text-sm font-medium">{option.label}</p>
                  {option.value === task.status && (
                    <p className="text-xs text-gray-400 mt-1">Current</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Progress (optional - if you want manual progress update) */}
          {selectedStatus === "In Progress" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress ({progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Comment (optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              className="input w-full"
              placeholder="Add any notes about this status update..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || selectedStatus === task.status}
              className="btn-primary flex items-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        </form>

        {/* Todo Checklist Summary (if exists) */}
        {task.todoChecklist && task.todoChecklist.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h3 className="font-semibold mb-3">Todo Checklist</h3>
            <div className="space-y-2">
              {task.todoChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    className="w-4 h-4 text-primary"
                  />
                  <span
                    className={`text-sm ${item.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Note: Task auto-completes when all checklist items are done
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UpdateTaskStatus;
