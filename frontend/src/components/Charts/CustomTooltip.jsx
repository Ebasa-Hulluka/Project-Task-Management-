import React from "react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const name = payload[0].name || data.name || label;
    const color = payload[0].color || data.color || "#8D51FF";
    const percentage =
      data.percentage ||
      payload[0].payload.percentage ||
      (data.total ? Math.round((value / data.total) * 100) : null);

    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200 min-w-[150px]">
        {/* Header with color indicator */}
        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <p className="text-xs font-medium text-gray-700">{name}</p>
        </div>

        {/* Value */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Value:</span>
          <span className="text-sm font-semibold text-gray-900">
            {value.toLocaleString()}
          </span>
        </div>

        {/* Percentage if available */}
        {percentage !== null && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Percentage:</span>
            <span className="text-xs font-medium text-gray-700">
              {percentage}%
            </span>
          </div>
        )}

        {/* Additional data fields */}
        {data.count !== undefined && data.count !== value && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">Count:</span>
            <span className="text-xs font-medium text-gray-700">
              {data.count}
            </span>
          </div>
        )}

        {/* Status or priority badge */}
        {data.status && (
          <div className="mt-2 pt-1 border-t border-gray-100">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                data.status === "Completed"
                  ? "bg-green-100 text-green-700"
                  : data.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : data.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {data.status}
            </span>
          </div>
        )}

        {data.priority && (
          <div className="mt-2 pt-1 border-t border-gray-100">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                data.priority === "High"
                  ? "bg-red-100 text-red-700"
                  : data.priority === "Medium"
                    ? "bg-orange-100 text-orange-700"
                    : data.priority === "Low"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
              }`}
            >
              {data.priority} Priority
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
