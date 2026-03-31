import React from "react";
import { LuArrowUp, LuArrowDown } from "react-icons/lu";

const InfoCard = ({
  icon,
  label,
  value,
  color = "bg-primary",
  trend = null,
  trendValue = null,
  onClick,
}) => {
  return (
    <div
      className={`bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        {icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}
          >
            <span className={`text-xl ${color.replace("bg-", "text-")}`}>
              {icon}
            </span>
          </div>
        )}

        {/* Trend Indicator */}
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === "up"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trend === "up" ? <LuArrowUp /> : <LuArrowDown />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      {/* Value and Label */}
      <div className="mt-3">
        <p className="text-2xl md:text-3xl font-semibold text-gray-900">
          {value}
        </p>
        <p className="text-xs md:text-sm text-gray-500 mt-1">{label}</p>
      </div>

      {/* Progress Bar (optional) */}
      {trend === "progress" && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${color}`}
              style={{ width: `${trendValue}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoCard;
