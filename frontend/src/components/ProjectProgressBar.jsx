import React from "react";
import { LuCircleCheck, LuClock, LuOctagonAlert } from "react-icons/lu";

const ProjectProgressBar = ({
  progress = 0,
  showLabel = true,
  size = "default",
  animated = false,
  showIcon = false,
  status,
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  // Get color based on progress or status
  const getColor = () => {
    if (status === "Completed") return "bg-green-500";
    if (status === "On Hold") return "bg-orange-500";
    if (status === "Planning") return "bg-purple-500";

    // Color based on progress
    if (normalizedProgress >= 75) return "bg-green-500";
    if (normalizedProgress >= 50) return "bg-blue-500";
    if (normalizedProgress >= 25) return "bg-yellow-500";
    return "bg-gray-400";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (status === "Completed")
      return <LuCircleCheck className="text-green-500" />;
    if (status === "On Hold")
      return <LuOctagonAlert className="text-orange-500" />;
    return <LuClock className="text-blue-500" />;
  };

  // Get height based on size
  const getHeight = () => {
    switch (size) {
      case "sm":
        return "h-1.5";
      case "lg":
        return "h-4";
      default:
        return "h-2.5";
    }
  };

  // Get animation class
  const getAnimationClass = () => {
    return animated ? "transition-all duration-700 ease-out" : "";
  };

  return (
    <div className="w-full space-y-2">
      {/* Label with status */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showIcon && getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">
              {status || "Overall Progress"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {normalizedProgress}%
            </span>
            {normalizedProgress === 100 && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Completed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative">
        <div
          className={`w-full bg-gray-200 rounded-full overflow-hidden ${getHeight()}`}
        >
          <div
            className={`
              ${getColor()} ${getHeight()} rounded-full ${getAnimationClass()}
              relative
            `}
            style={{ width: `${normalizedProgress}%` }}
          >
            {/* Optional inner glow effect */}
            {normalizedProgress > 0 && normalizedProgress < 100 && (
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
            )}
          </div>
        </div>

        {/* Milestone markers (optional) */}
        {size === "lg" && (
          <div className="absolute top-0 left-0 right-0 flex justify-between px-1">
            {[25, 50, 75].map((marker) => (
              <div
                key={marker}
                className={`w-1 h-4 bg-white border-l border-gray-300 ${
                  normalizedProgress >= marker ? "opacity-100" : "opacity-50"
                }`}
                style={{ left: `${marker}%` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mini stats (optional) */}
      {size === "lg" && (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>Start</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>Complete</span>
        </div>
      )}
    </div>
  );
};

// Circular Progress for project cards
export const CircularProjectProgress = ({ progress = 0, size = 80 }) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  const getColor = () => {
    if (normalizedProgress >= 75) return "#10B981";
    if (normalizedProgress >= 50) return "#3B82F6";
    if (normalizedProgress >= 25) return "#F59E0B";
    return "#9CA3AF";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-900">
          {normalizedProgress}%
        </span>
        <span className="text-xs text-gray-500">complete</span>
      </div>
    </div>
  );
};

// Progress with phases
export const PhaseProgress = ({ phases = [] }) => {
  if (!phases.length) return null;

  const completedPhases = phases.filter((p) => p.completed).length;
  const totalPhases = phases.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Project Phases
        </span>
        <span className="text-sm font-semibold text-gray-900">
          {completedPhases}/{totalPhases} completed
        </span>
      </div>

      <div className="space-y-3">
        {phases.map((phase, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{phase.name}</span>
              <span className="text-gray-500">{phase.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  phase.completed ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectProgressBar;
