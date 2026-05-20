import React from "react";
import {
  LuClipboardList,
  LuClock,
  LuCircleCheck,
  LuCircleAlert,
  LuLayers,
} from "react-icons/lu";

const TaskStatusTabs = ({
  tabs = [],
  activeTab,
  setActiveTab,
  variant = "default",
  showIcons = true,
  size = "default",
}) => {
  // Default tabs if none provided
  const defaultTabs = [
    { label: "All", count: 0, icon: LuLayers },
    { label: "Pending", count: 0, icon: LuClock },
    { label: "In Progress", count: 0, icon: LuCircleAlert },
    { label: "In Review", count: 0, icon: LuClipboardList },
    { label: "Changes Requested", count: 0, icon: LuCircleAlert },
    { label: "Completed", count: 0, icon: LuCircleCheck },
  ];

  const displayTabs = tabs.length > 0 ? tabs : defaultTabs;

  // Get icon for tab
  const getTabIcon = (tab) => {
    if (!showIcons) return null;

    switch (tab.label?.toLowerCase()) {
      case "all":
        return <LuLayers className="text-lg" />;
      case "pending":
        return <LuClock className="text-lg" />;
      case "in progress":
        return <LuCircleAlert className="text-lg" />;
      case "in review":
        return <LuClipboardList className="text-lg" />;
      case "changes requested":
        return <LuCircleAlert className="text-lg" />;
      case "completed":
        return <LuCircleCheck className="text-lg" />;
      default:
        return <LuClipboardList className="text-lg" />;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: {
      tab: "px-3 py-1.5 text-xs",
      count: "ml-1.5 px-1.5 py-0.5 text-xs",
    },
    default: {
      tab: "px-4 py-2 text-sm",
      count: "ml-2 px-2 py-0.5 text-xs",
    },
    lg: {
      tab: "px-6 py-3 text-base",
      count: "ml-3 px-3 py-1 text-sm",
    },
  };

  // Variant styles
  const getTabStyles = (tab) => {
    const isActive = activeTab === tab.label;

    switch (variant) {
      case "pills":
        return isActive
          ? "bg-primary text-white shadow-md"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200";

      case "underline":
        return isActive
          ? "text-primary border-b-2 border-primary font-medium"
          : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent";

      case "rounded":
        return isActive
          ? "bg-primary text-white shadow-md rounded-full"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full";

      default:
        return isActive
          ? "text-primary bg-primary/10 font-medium"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg">
      {displayTabs.map((tab, index) => {
        const isActive = activeTab === tab.label;

        return (
          <button
            key={tab.label || index}
            onClick={() => setActiveTab(tab.label)}
            className={`
              flex items-center whitespace-nowrap rounded-md transition-all duration-200
              ${sizeClasses[size].tab}
              ${getTabStyles(tab)}
              ${isActive ? "cursor-default" : "cursor-pointer"}
            `}
          >
            {/* Icon */}
            {getTabIcon(tab) && (
              <span className="mr-1.5">{getTabIcon(tab)}</span>
            )}

            {/* Label */}
            <span>{tab.label}</span>

            {/* Count Badge */}
            {tab.count !== undefined && (
              <span
                className={`
                  rounded-full ${sizeClasses[size].count}
                  ${
                    isActive
                      ? variant === "pills" || variant === "rounded"
                        ? "bg-white/20 text-white"
                        : "bg-primary/20 text-primary"
                      : "bg-gray-200/70 text-gray-600"
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Compact version for mobile/sidebar
export const CompactTaskTabs = ({ tabs = [], activeTab, setActiveTab }) => {
  const getActiveTabData = () => {
    return tabs.find((t) => t.label === activeTab) || tabs[0];
  };

  const activeData = getActiveTabData();

  return (
    <div className="space-y-3">
      {/* Active Tab Display */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {activeData?.label}
          </span>
          <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
            {activeData?.count || 0}
          </span>
        </div>
        <span className="text-xs text-gray-500">Tap to change</span>
      </div>

      {/* Tab Grid */}
      <div className="grid grid-cols-2 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`
              px-3 py-2 rounded-lg text-xs font-medium transition-colors
              ${
                activeTab === tab.label
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span>{tab.label}</span>
              <span
                className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${
                  activeTab === tab.label
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-600"
                }
              `}
              >
                {tab.count}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Status badges for Kanban view
export const StatusBadge = ({ status, count }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in review":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "changes requested":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div
      className={`px-3 py-1.5 rounded-lg border ${getStatusColor()} flex items-center gap-2`}
    >
      <span className="text-sm font-medium">{status}</span>
      {count !== undefined && (
        <span className="text-xs font-semibold bg-white/50 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
};

export default TaskStatusTabs;
