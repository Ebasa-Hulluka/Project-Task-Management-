import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

// Function to get bar color based on priority
const getBarColor = (entry) => {
  switch (entry?.name || entry?.priority) {
    case "High":
      return "#194f87"; // Brand blue
    case "Medium":
      return "#2f7d65"; // Mid green
    case "Low":
      return "#0f5841"; // Brand green
    default:
      return "#194f87"; // Brand blue
  }
};

const CustomTooltipContent = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-1">
          {payload[0].payload.name || label}
        </p>
        <p className="text-sm text-gray-600">
          Count:{" "}
          <span className="text-sm font-semibold text-gray-900">
            {payload[0].value}
          </span>
        </p>
        {payload[0].payload.percentage && (
          <p className="text-xs text-gray-500 mt-1">
            {payload[0].payload.percentage}% of total
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CustomBarChart = ({
  data = [],
  title,
  height = 300,
  showGrid = false,
  barSize = 40,
  radius = [6, 6, 0, 0],
  showValues = true,
}) => {
  // Transform data if needed
  const chartData = Array.isArray(data)
    ? data
    : data.high !== undefined
      ? [
          { name: "High", value: data.high || 0 },
          { name: "Medium", value: data.medium || 0 },
          { name: "Low", value: data.low || 0 },
        ].filter((item) => item.value > 0)
      : [];

  if (!chartData.length) {
    return (
      <div className="bg-white p-8 text-center text-gray-400 rounded-lg">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  // Calculate total for percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = chartData.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));

  return (
    <div className="bg-white rounded-lg">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={dataWithPercentage}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={barSize}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}

          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
            allowDecimals={false}
          />

          <Tooltip
            content={<CustomTooltipContent />}
            cursor={{ fill: "#f9fafb" }}
          />

          <Bar
            dataKey="value"
            radius={radius}
            animationDuration={1000}
            animationEasing="ease"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
            ))}
            {showValues && (
              <LabelList
                dataKey="value"
                position="top"
                style={{ fontSize: "11px", fill: "#6B7280", fontWeight: 500 }}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;

