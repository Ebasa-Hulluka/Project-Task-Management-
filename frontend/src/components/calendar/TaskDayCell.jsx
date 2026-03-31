import React from "react";
import moment from "moment";

const TaskDayCell = ({
  day,
  currentDate,
  tasks = [],
  viewMode = "month",
  onClick,
}) => {
  const isCurrentMonth = day.month() === currentDate.month();
  const isToday = day.isSame(moment(), "day");
  const hasTasks = tasks.length > 0;
  const visibleTasks = viewMode === "month" ? tasks.slice(0, 2) : tasks;

  return (
    <button
      type="button"
      onClick={() => onClick(day)}
      className={`w-full h-full min-h-[100px] p-2 text-left border border-gray-100 transition-colors ${
        isCurrentMonth ? "bg-white hover:bg-blue-50/40" : "bg-gray-50 text-gray-400"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${
            isToday ? "bg-[#1368ec] text-white" : ""
          }`}
        >
          {day.date()}
        </span>
        {hasTasks && <span className="w-2 h-2 rounded-full bg-[#1368ec]"></span>}
      </div>

      <div className="space-y-1">
        {visibleTasks.map((task) => (
          <div
            key={task._id}
            className="text-[11px] px-1.5 py-1 rounded bg-blue-50 text-blue-800 truncate"
          >
            {task.title}
          </div>
        ))}
        {viewMode === "month" && tasks.length > visibleTasks.length && (
          <p className="text-[11px] text-gray-500">
            +{tasks.length - visibleTasks.length} more
          </p>
        )}
      </div>
    </button>
  );
};

export default TaskDayCell;
