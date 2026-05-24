import React from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  LuCalendar,
  LuUsers,
  LuFolder,
  LuCircleCheck,
  LuClock,
  LuCircleAlert,
  LuPencil,
  LuTrash2,
} from "react-icons/lu";

import AvatarGroup from "../AvatarGroup";
import ProjectProgressBar from "../ProjectProgressBar";
import { getStatusColor } from "../../utils/helper";
import { getProjectTeamDisplay } from "../../utils/projectTeam";
import { getProjectDisplayName } from "../../utils/projectDisplay";

const ProjectCard = ({
  project,
  onClick,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const navigate = useNavigate();

  if (!project) return null;

  const {
    _id,
    name,
    description,
    status,
    progress,
    startDate,
    endDate,
    team = [],
    tasks = [],
    createdBy,
    createdAt,
  } = project;

  const safeTeam = Array.isArray(team) ? team : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const { teamNames, users: teamMemberUsers } = getProjectTeamDisplay(safeTeam);

  const apiSummary = project.taskSummary;
  const taskSummary = apiSummary
    ? {
        total: apiSummary.total ?? 0,
        completed: apiSummary.completed ?? 0,
      }
    : {
        total: safeTasks.length,
        completed: safeTasks.filter((t) => t.status === "Completed").length,
      };

  const displayName = getProjectDisplayName(name);
  const effectiveStatus =
    taskSummary.total > 0 && taskSummary.completed === taskSummary.total
      ? "Completed"
      : status;
  const isActive = effectiveStatus === "Active";
  const isCompleted = effectiveStatus === "Completed";
  const isOnHold = effectiveStatus === "On Hold";

  const getStatusIcon = () => {
    if (isCompleted) return <LuCircleCheck className="text-green-600" />;
    if (isActive) return <LuClock className="text-blue-600" />;
    if (isOnHold) return <LuCircleAlert className="text-orange-600" />;
    return <LuFolder className="text-purple-600" />;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(_id);
    } else {
      navigate(`/manager/projects/${_id}`);
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

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isActive
                ? "bg-blue-100"
                : isCompleted
                  ? "bg-green-100"
                  : isOnHold
                    ? "bg-orange-100"
                    : "bg-purple-100"
            }`}
          >
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 line-clamp-1">{displayName}</h3>
            <p className="text-xs text-gray-400">
              Created {moment(createdAt).fromNow()}
            </p>
          </div>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(effectiveStatus)}`}
        >
          {effectiveStatus}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 line-clamp-2 mb-4">
        {description || "No description provided"}
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-700">{progress}%</span>
        </div>
        <ProjectProgressBar
          progress={progress}
          status={effectiveStatus}
          showLabel={false}
        />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-3 mb-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100/50">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Timeline</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <LuCalendar className="text-gray-400 shrink-0" />
            <span className="truncate">
              {startDate ? moment(startDate).format("MMM D") : "N/A"} -{" "}
              {endDate ? moment(endDate).format("MMM D, YYYY") : "N/A"}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Tasks</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <LuCircleCheck className="text-green-500 shrink-0" />
            <span className="truncate">
              {taskSummary.completed}/{taskSummary.total} completed
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Project Manager</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
            <span className="w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold shrink-0">
              {(createdBy && typeof createdBy === "object" ? createdBy.name : "U").charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-gray-600" title={createdBy && typeof createdBy === "object" ? createdBy.name : "Unknown Manager"}>
              {createdBy && typeof createdBy === "object" ? createdBy.name : "Unknown Manager"}
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Assigned Teams ({teamNames.length})</p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <LuUsers className="text-gray-400 shrink-0" />
            <span className="truncate font-medium text-gray-700" title={teamNames.join(", ")}>
              {teamNames.length > 0 ? teamNames.join(", ") : "None assigned"}
            </span>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
          <button
            onClick={handleEdit}
            className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <LuPencil className="text-xs" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <LuTrash2 className="text-xs" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
