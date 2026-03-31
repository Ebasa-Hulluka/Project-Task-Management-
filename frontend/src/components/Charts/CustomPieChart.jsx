import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: "12px", fontWeight: 600 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomPieChart = ({
  data = [],
  colors = ["#194f87", "#0f5841", "#2e6aa3", "#2f7d65", "#5b87b3"],
  title,
  innerRadius = 60,
  outerRadius = 100,
  showLabels = true,
  height = 325,
}) => {
  // Format data if needed
  const chartData = data
    .map((item) => ({
      name: item.name || item.status || item.category || "Unknown",
      value: item.value || item.count || 0,
      ...item,
    }))
    .filter((item) => item.value > 0);

  if (!chartData.length) {
    return (
      <div className="bg-white h-81.25 flex items-center justify-center text-gray-400 rounded-lg">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  // Calculate total for percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            labelLine={false}
            label={showLabels ? renderCustomizedLabel : false}
            animationDuration={1000}
            animationEasing="ease"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />

          {/* Optional: Add center text with total */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: "20px", fontWeight: 600, fill: "#374151" }}
          >
            {total}
          </text>
          <text
            x="50%"
            y="50%"
            dy="20"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: "11px", fill: "#9CA3AF" }}
          >
            Total
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;

