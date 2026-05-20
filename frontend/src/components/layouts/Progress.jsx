import React from "react";
import { LuCircleCheck, LuClock, LuCircleAlert } from "react-icons/lu";

const Progress = ({
  progress = 0,
  status,
  showLabel = false,
  size = "default",
  animated = false,
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  // Get color based on status or progress
  const getColor = () => {
    if (status) {
      switch (status) {
        case "Completed":
          return "bg-green-500";
        case "In Progress":
          return "bg-blue-500";
        case "In Review":
          return "bg-violet-500";
        case "Changes Requested":
          return "bg-amber-500";
        case "Pending":
          return "bg-yellow-500";
        default:
          return "bg-primary";
      }
    }

    // Color based on progress if no status
    if (normalizedProgress >= 80) return "bg-green-500";
    if (normalizedProgress >= 50) return "bg-blue-500";
    if (normalizedProgress >= 20) return "bg-yellow-500";
    return "bg-gray-400";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (status === "Completed")
      return <LuCircleCheck className="text-green-500" />;
    if (status === "In Progress") return <LuClock className="text-blue-500" />;
    if (status === "In Review") return <LuClock className="text-violet-500" />;
    if (status === "Changes Requested")
      return <LuCircleAlert className="text-amber-500" />;
    if (status === "Pending") return <LuClock className="text-yellow-500" />;
    return null;
  };

  // Get height based on size
  const getHeight = () => {
    switch (size) {
      case "sm":
        return "h-1";
      case "lg":
        return "h-3";
      default:
        return "h-2";
    }
  };

  // Get animation class
  const getAnimationClass = () => {
    return animated ? "transition-all duration-500 ease-out" : "";
  };

  return (
    <div className="w-full">
      {/* Label with status */}
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {getStatusIcon()}
            <span className="text-xs font-medium text-gray-700">
              {status || "Progress"}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-900">
            {normalizedProgress}%
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${getHeight()}`}
      >
        <div
          className={`${getColor()} ${getHeight()} rounded-full ${getAnimationClass()}`}
          style={{ width: `${normalizedProgress}%` }}
        >
          {/* Optional inner glow effect */}
          {normalizedProgress > 0 && (
            <div className="w-full h-full bg-white/20 rounded-full"></div>
          )}
        </div>
      </div>

      {/* Mini label for compact view */}
      {!showLabel && normalizedProgress > 0 && (
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">{normalizedProgress}%</span>
        </div>
      )}
    </div>
  );
};

// Circular Progress Component
export const CircularProgress = ({
  progress = 0,
  size = 60,
  strokeWidth = 4,
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#8D51FF"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-gray-700">
        {normalizedProgress}%
      </span>
    </div>
  );
};

// Progress with steps
export const StepProgress = ({ steps = [], currentStep = 0 }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 text-center">
            <div
              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </div>
            <p className="text-xs mt-1 text-gray-600">{step}</p>
          </div>
        ))}
      </div>
      <div className="relative w-full h-1 bg-gray-200 rounded-full">
        <div
          className="absolute h-1 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;
