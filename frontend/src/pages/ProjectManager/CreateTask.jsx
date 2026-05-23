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
import { getProjectTeamDisplay } from "../../utils/projectTeam";
import { getProjectPaths, isTaskViewOnlyRole } from "../../utils/rolePaths";
import { useUser } from "../../context/userContext";

const CreateTask = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { projectId: initialProjectId, projectName: initialProjectName } =
    location.state || {};

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [testers, setTesters] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    assignedTo: [],
    tester: null,
    projectId: initialProjectId || "",
    attachments: [],
    todoChecklist: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isTaskViewOnlyRole(user?.role)) {
      toast.error(
        "Super Admins and Admins can only view tasks. Creating tasks is not allowed.",
      );
      const paths = getProjectPaths(user?.role);
      navigate(
        initialProjectId ? paths.detail(initialProjectId) : paths.list,
        { replace: true },
      );
    }
  }, [user?.role, navigate, initialProjectId]);

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

      const testersResponse = await axiosInstance.get(
        API_PATHS.USERS.GET_USERS_BY_ROLE("tester"),
      );
      if (testersResponse.data) {
        const formattedTesters = (Array.isArray(testersResponse.data)
          ? testersResponse.data
          : testersResponse.data?.users || []
        ).map((user) => ({
          _id: user._id,
          name: user.name,
          email: user.email,
          profileImageUrl: user.profileImageUrl,
          role: user.role,
        }));
        setTesters(formattedTesters);
      }
    } catch (error) {
      // Don't spam console with 403 errors
      if (error.response?.status !== 403) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    }
  };

  const loadProjectTeamMembers = async (projectId) => {
    if (!projectId) {
      setAssignableUsers([]);
      return;
    }

    try {
      setLoadingTeamMembers(true);
      const response = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_PROJECT_BY_ID(projectId),
      );
      const { users } = getProjectTeamDisplay(response.data?.team);
      setAssignableUsers(users);
    } catch (error) {
      console.error("Error loading project team members:", error);
      setAssignableUsers([]);
      if (error?.response?.status !== 403) {
        toast.error(getErrorMessage(error) || "Failed to load team members");
      }
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "projectId") {
        next.assignedTo = [];
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "projectId" && errors.assignedTo) {
      setErrors((prev) => ({ ...prev, assignedTo: "" }));
    }
  };

  // Handle assigned users change
  const handleAssignedToChange = (selectedUsers) => {
    setFormData((prev) => ({ ...prev, assignedTo: selectedUsers }));
  };

  const handleTesterChange = (selectedUsers) => {
    setFormData((prev) => ({ ...prev, tester: selectedUsers[0] || null }));
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
    } else if (formData.projectId) {
      const selectedProject = projects.find((p) => p._id === formData.projectId);
      if (
        selectedProject &&
        selectedProject.endDate &&
        new Date(formData.dueDate) > new Date(selectedProject.endDate)
      ) {
        newErrors.dueDate = `Task due date must be on or before the project deadline (${new Date(
          selectedProject.endDate
        ).toLocaleDateString()})`;
      }
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
        tester:
          typeof formData.tester === "string"
            ? formData.tester
            : formData.tester?._id || null,
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

  useEffect(() => {
    if (!formData.projectId) {
      setAssignableUsers([]);
      return;
    }
    loadProjectTeamMembers(formData.projectId);
  }, [formData.projectId]);

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
              {!formData.projectId ? (
                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
                  Select a project first to choose members from its team.
                </p>
              ) : loadingTeamMembers ? (
                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
                  Loading team members...
                </p>
              ) : assignableUsers.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  This project has no team members to assign. Edit the project and
                  link a team with members first.
                </p>
              ) : (
                <SelectUsers
                  users={assignableUsers}
                  selectedUsers={formData.assignedTo}
                  onChange={handleAssignedToChange}
                  placeholder="Select team members from project team..."
                  filterByRole="teamMember"
                />
              )}
              {errors.assignedTo && (
                <p className="text-red-500 text-xs mt-1">{errors.assignedTo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tester
              </label>
              <SelectUsers
                users={testers}
                selectedUsers={formData.tester ? [formData.tester] : []}
                onChange={handleTesterChange}
                placeholder="Select tester..."
                filterByRole="tester"
              />
            </div>

            {/* Todo Checklist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Todo Checklist
              </label>
              <TodoListInput
                todoList={formData.todoChecklist}
                onChange={handleTodoListChange}
                allowToggleComplete={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference attachments
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Requirements, specs, or repo links the team needs for this task.
              </p>
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
