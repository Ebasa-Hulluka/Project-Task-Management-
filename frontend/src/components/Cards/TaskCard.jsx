import React from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  LuPaperclip,
  LuClock,
  LuCircleCheck,
  LuCircleAlert,
  LuCalendar,
  LuUsers,
} from "react-icons/lu";

import Progress from "../layouts/Progress";
import AvatarGroup from "../AvatarGroup";
import { getPriorityColor, getStatusColor } from "../../utils/helper";

const TaskCard = ({
  task,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
  compact = false,
}) => {
  const navigate = useNavigate();

  if (!task) return null;

  const {
    _id,
    title,
    description,
    priority,
    status,
    progress,
    createdAt,
    dueDate,
    assignedTo = [],
    attachments = [],
    todoChecklist = [],
    projectId,
  } = task;

  const completedTodos = todoChecklist.filter((item) => item.completed).length;
  const totalTodos = todoChecklist.length;

  const isOverdue = () => {
    if (!dueDate || status === "Completed") return false;
    return new Date(dueDate) < new Date();
  };

  const handleClick = () => {
    if (onClick) {
      onClick(_id);
    } else {
      navigate(`/member/tasks/${_id}`);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(_id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(_id);
    }
  };

  // Compact view for lists/grids
  if (compact) {
    return (
      <div
        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-800 line-clamp-1">{title}</h4>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(priority)}`}
          >
            {priority}
          </span>
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{description}</p>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <LuCalendar className="text-gray-400" />
            <span>{moment(dueDate).format("MMM D")}</span>
          </div>

          {isOverdue() && (
            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs">
              Overdue
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div
      className="bg-white rounded-xl py-4 shadow-md shadow-gray-100 border border-gray-200/50 cursor-pointer hover:shadow-lg transition-all"
      onClick={handleClick}
    >
      {/* Status and Priority Tags */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full ${getStatusColor(status)}`}
        >
          {status}
        </span>
        <span
          className={`text-[11px] font-medium px-3 py-1 rounded-full ${getPriorityColor(priority)}`}
        >
          {priority} Priority
        </span>
        {isOverdue() && (
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
            <LuCircleAlert className="text-xs" />
            Overdue
          </span>
        )}
      </div>

      {/* Project Name (if available) */}
      {projectId && typeof projectId === "object" && (
        <div className="px-4 mb-2">
          <span className="text-xs text-gray-400">Project:</span>
          <span className="text-xs font-medium text-gray-600 ml-2">
            {projectId.name}
          </span>
        </div>
      )}

      {/* Task Content */}
      <div
        className={`px-4 border-l-[3px] ${
          status === "In Progress"
            ? "border-cyan-500"
            : status === "Completed"
              ? "border-lime-500"
              : "border-violet-500"
        }`}
      >
        {/* Title */}
        <p className="text-sm font-medium text-gray-800 line-clamp-2">
          {title}
        </p>

        {/* Description */}
        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-[18px]">
          {description || "No description provided"}
        </p>

        {/* Todo Progress */}
        {totalTodos > 0 && (
          <div className="mt-3 mb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Task Progress</span>
              <span className="font-medium text-gray-700">
                {completedTodos}/{totalTodos} completed
              </span>
            </div>
            <Progress progress={progress} status={status} />
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="px-4 mt-3 space-y-3">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">Start Date</label>
            <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <LuClock className="text-gray-400" />
              {moment(createdAt).format("MMM D, YYYY")}
            </p>
          </div>
          <div>
            <label className="text-xs text-gray-400">Due Date</label>
            <p
              className={`text-xs font-medium flex items-center gap-1 ${
                isOverdue() ? "text-red-600" : "text-gray-700"
              }`}
            >
              <LuCalendar
                className={isOverdue() ? "text-red-400" : "text-gray-400"}
              />
              {moment(dueDate).format("MMM D, YYYY")}
            </p>
          </div>
        </div>

        {/* Assigned Users */}
        {assignedTo.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuUsers className="text-gray-400" />
              <span className="text-xs text-gray-500">Assigned to:</span>
            </div>
            <AvatarGroup users={assignedTo} maxVisible={3} size="sm" />
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-lg">
            <LuPaperclip className="text-blue-500 text-xs" />
            <span className="text-xs text-gray-700">
              {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons (for managers/admin) */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 px-4 mt-3 pt-2 border-t border-gray-100">
          <button
            onClick={handleEdit}
            className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
