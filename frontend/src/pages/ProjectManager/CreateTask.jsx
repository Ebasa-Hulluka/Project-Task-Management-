import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuArrowLeft, LuSave } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import SelectUsers from "../../components/Inputs/SelectUsers";
import TodoListInput from "../../components/Inputs/TodoListInput";
import AddAttachmentsInput from "../../components/Inputs/AddAttachmentsInput";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { PRIORITY_DATA } from "../../utils/data";
import { getErrorMessage } from "../../utils/helper";

const CreateTask = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId: initialProjectId, projectName: initialProjectName } =
    location.state || {};

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: [],
    projectId: initialProjectId || "",
    attachments: [],
    todoChecklist: [],
  });
  const [errors, setErrors] = useState({});

  // Fetch projects and users
  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsResponse = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_ALL_PROJECTS,
      );
      if (projectsResponse.data) {
        setProjects(projectsResponse.data);
      }

      // Fetch users
      const usersResponse = await axiosInstance.get(
        API_PATHS.USERS.GET_TEAM_MEMBERS,
      );
      if (usersResponse.data) {
        const formattedUsers = (Array.isArray(usersResponse.data)
          ? usersResponse.data
          : usersResponse.data?.users || []
        ).map((user) => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      // Don't spam console with 403 errors
      if (error.response?.status !== 403) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle assigned users change
  const handleAssignedToChange = (selectedUsers) => {
    setFormData((prev) => ({ ...prev, assignedTo: selectedUsers }));
  };

  // Handle todo checklist change
  const handleTodoListChange = (todoList) => {
    setFormData((prev) => ({ ...prev, todoChecklist: todoList }));
  };

  // Handle attachments change
  const handleAttachmentsChange = (attachments) => {
    setFormData((prev) => ({ ...prev, attachments }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!formData.projectId) {
      newErrors.projectId = "Please select a project";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (formData.assignedTo.length === 0) {
      newErrors.assignedTo = "Please assign at least one team member";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const taskData = {
        ...formData,
        assignedTo: formData.assignedTo.map((user) =>
          typeof user === "string" ? user : user?._id,
        ),
      };

      const response = await axiosInstance.post(
        API_PATHS.TASKS.CREATE_TASK,
        taskData,
      );

      if (response.data) {
        toast.success("Task created successfully!");

        // Navigate back to project or task list
        if (formData.projectId) {
          navigate(`/manager/projects/${formData.projectId}`);
        } else {
          navigate("/manager/tasks");
        }
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(getErrorMessage(error) || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardLayout activeMenu="Create Task">
      <div className="my-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuArrowLeft className="text-xl" />
          </button>
          <h2 className="text-xl md:text-2xl font-medium">
            {initialProjectName
              ? `Create Task for ${initialProjectName}`
              : "Create New Task"}
          </h2>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="input w-full md:w-96"
                disabled={!!initialProjectId}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="text-red-500 text-xs mt-1">{errors.projectId}</p>
              )}
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., Design the login page"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="input w-full"
                placeholder="Describe the task requirements..."
              />
            </div>

            {/* Priority and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input w-full"
                >
                  {PRIORITY_DATA.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="input w-full"
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To *
              </label>
              <SelectUsers
                users={users}
                selectedUsers={formData.assignedTo}
                onChange={handleAssignedToChange}
                placeholder="Select team members..."
                filterByRole="teamMember"
              />
              {errors.assignedTo && (
                <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
              )}
            </div>

            {/* Todo Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Todo Checklist
              </label>
              <TodoListInput
                todoList={formData.todoChecklist}
                onChange={handleTodoListChange}
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <AddAttachmentsInput
                attachments={formData.attachments}
                onChange={handleAttachmentsChange}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <LuSave />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTask;
