import React, { useState } from "react";
import { HiMiniPlus, HiOutlineTrash } from "react-icons/hi2";
import { LuCircleCheck, LuCircle } from "react-icons/lu";
import { toast } from "react-hot-toast";

const TodoListInput = ({
  todoList = [],
  onChange,
  readOnly = false,
  /** When false, items cannot be marked complete (team members do that on the task page). */
  allowToggleComplete = true,
  maxItems = 20,
}) => {
  const [option, setOption] = useState("");

  // Function to handle adding an item
  const handleAddItem = () => {
    if (!option.trim()) {
      toast.error("Please enter a task");
      return;
    }

    if (todoList.length >= maxItems) {
      toast.error(`Maximum ${maxItems} items allowed`);
      return;
    }

    const newItem = {
      text: option.trim(),
      completed: false,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
    };

    onChange([...todoList, newItem]);
    setOption("");
    toast.success("Task added");
  };

  // Function to handle deleting an item
  const handleDeleteItem = (index) => {
    const updatedArr = todoList.filter((_, idx) => idx !== index);
    onChange(updatedArr);
    toast.success("Task removed");
  };

  // Function to toggle item completion
  const handleToggleComplete = (index) => {
    if (!allowToggleComplete) return;

    const updatedArr = [...todoList];
    updatedArr[index] = {
      ...updatedArr[index],
      completed: !updatedArr[index].completed,
    };
    onChange(updatedArr);
  };

  const canToggle = allowToggleComplete && !readOnly;

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="space-y-4">
      {/* Todo List Items */}
      {todoList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500">
              Checklist ({todoList.filter((item) => item.completed).length}/
              {todoList.length})
            </label>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {todoList.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {canToggle ? (
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(index)}
                      className="shrink-0 cursor-pointer transition-colors hover:text-primary"
                    >
                      {item.completed ? (
                        <LuCircleCheck className="text-primary text-lg" />
                      ) : (
                        <LuCircle className="text-gray-400 hover:text-primary text-lg" />
                      )}
                    </button>
                  ) : (
                    <span
                      className="shrink-0 cursor-default"
                      title={
                        item.completed
                          ? "Completed by team member"
                          : "Only team members can mark items complete"
                      }
                    >
                      {item.completed ? (
                        <LuCircleCheck className="text-green-600 text-lg" />
                      ) : (
                        <LuCircle className="text-gray-300 text-lg" />
                      )}
                    </span>
                  )}

                  {/* Item Text */}
                  <span
                    className={`text-sm truncate flex-1 ${
                      item.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="text-xs text-gray-400 font-medium mr-2">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.text}
                  </span>
                </div>

                {/* Delete Button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded"
                  >
                    <HiOutlineTrash className="text-lg text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Item */}
      {!readOnly && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={option}
              onChange={({ target }) => setOption(target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a task (e.g., Design login page)"
              className="flex-1 text-sm text-gray-700 outline-none bg-white border border-gray-200 px-3 py-2.5 rounded-lg focus:border-primary transition-colors"
              maxLength={100}
            />
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!option.trim() || todoList.length >= maxItems}
              className="btn-primary text-nowrap px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiMiniPlus className="text-lg mr-1" /> Add Task
            </button>
          </div>

          {/* Helper Text */}
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-400">
              {!allowToggleComplete
                ? "Team members mark items complete when working on the task"
                : "Press Enter to quickly add"}
            </p>
            <p className="text-gray-400">
              {todoList.length}/{maxItems} tasks
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {todoList.length === 0 && !readOnly && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">No tasks added yet</p>
        </div>
      )}
    </div>
  );
};

export default TodoListInput;
