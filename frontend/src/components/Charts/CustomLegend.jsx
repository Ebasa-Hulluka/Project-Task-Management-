import React from "react";

const CustomLegend = ({ payload, layout = "horizontal", align = "center" }) => {
  if (!payload || !payload.length) return null;

  const getIconShape = (entry) => {
    // You can customize icon shape based on data type
    if (entry.payload?.status === "Completed") return "✓";
    if (entry.payload?.priority === "High") return "▲";
    if (entry.payload?.priority === "Low") return "▼";
    return "●";
  };

  return (
    <div
      className={`flex flex-wrap gap-3 mt-4 ${
        layout === "horizontal" ? "flex-row" : "flex-col"
      } justify-${align}`}
    >
      {payload.map((entry, index) => {
        const value = entry.value || entry.name;
        const color = entry.color || entry.payload?.fill || "#8D51FF";
        const count = entry.payload?.count || entry.payload?.value || 0;
        const percentage =
          entry.payload?.percentage ||
          (entry.payload?.total
            ? Math.round((count / entry.payload.total) * 100)
            : null);

        return (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-50 transition-colors cursor-default"
          >
            {/* Icon/Color indicator */}
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              {entry.payload?.status && (
                <span className="text-xs text-gray-400 ml-0.5">
                  {getIconShape(entry)}
                </span>
              )}
            </div>

            {/* Label */}
            <span className="text-xs font-medium text-gray-600">{value}</span>

            {/* Count */}
            {count > 0 && (
              <span className="text-xs font-semibold text-gray-900 ml-1">
                ({count})
              </span>
            )}

            {/* Percentage */}
            {percentage !== null && (
              <span className="text-xs text-gray-400 ml-1">{percentage}%</span>
            )}

            {/* Color preview for gradients (optional) */}
            {entry.payload?.colorRange && (
              <div
                className="w-8 h-1 rounded-full ml-1"
                style={{
                  background: `linear-gradient(90deg, ${entry.payload.colorRange[0]}, ${entry.payload.colorRange[1]})`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Alternative compact legend component
export const CompactLegend = ({ payload }) => {
  if (!payload || !payload.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {payload.map((entry, index) => (
        <div
          key={`compact-legend-${index}`}
          className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full"
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
          <span className="text-xs text-gray-600">
            {entry.value || entry.name}
          </span>
          {entry.payload?.count > 0 && (
            <span className="text-xs font-medium text-gray-900">
              {entry.payload.count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Legend with percentage bars
export const PercentageLegend = ({ payload }) => {
  if (!payload || !payload.length) return null;

  const total = payload.reduce(
    (sum, entry) => sum + (entry.payload?.count || entry.payload?.value || 0),
    0,
  );

  return (
    <div className="space-y-2 mt-4">
      {payload.map((entry, index) => {
        const value = entry.payload?.count || entry.payload?.value || 0;
        const percentage = total > 0 ? (value / total) * 100 : 0;

        return (
          <div key={`percentage-legend-${index}`} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: entry.color || entry.payload?.fill,
                  }}
                />
                <span className="text-xs text-gray-600">
                  {entry.value || entry.name}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-900">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: entry.color || entry.payload?.fill,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CustomLegend;
