import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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
    projectId: "",
    attachments: [],
    todoChecklist: [],
  });
  const [errors, setErrors] = useState({});

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
      setAssignableUsers([]);
      if (error?.response?.status !== 403) {
        toast.error(getErrorMessage(error) || "Failed to load team members");
      }
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  const fetchData = async () => {
    try {
      setFetchLoading(true);

      const [projectsResponse, taskResponse, testersResponse] = await Promise.all([
        axiosInstance.get(API_PATHS.PROJECTS.GET_ALL_PROJECTS),
        axiosInstance.get(API_PATHS.TASKS.GET_TASK_BY_ID(id)),
        axiosInstance.get(API_PATHS.USERS.GET_USERS_BY_ROLE("tester")),
      ]);

      if (projectsResponse.data) {
        setProjects(projectsResponse.data);
      }

      if (testersResponse.data) {
        const formattedTesters = (
          Array.isArray(testersResponse.data)
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

      const task = taskResponse.data;
      if (task) {
        const projectId =
          typeof task.projectId === "object"
            ? task.projectId?._id
            : task.projectId;

        setFormData({
          title: task.title || "",
          description: task.description || "",
          priority: task.priority || "Medium",
          dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
          assignedTo: (task.assignedTo || []).map((u) =>
            typeof u === "object" ? u._id : u,
          ),
          tester:
            task.tester && typeof task.tester === "object"
              ? task.tester._id
              : task.tester || null,
          projectId: projectId || "",
          attachments: task.attachments || [],
          todoChecklist: task.todoChecklist || [],
        });

        if (projectId) {
          await loadProjectTeamMembers(projectId);
        }
      }
    } catch (error) {
      console.error("Error loading task:", error);
      toast.error(getErrorMessage(error) || "Failed to load task");
      navigate("/manager/tasks");
    } finally {
      setFetchLoading(false);
    }
  };

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
    if (name === "projectId") {
      if (errors.assignedTo) {
        setErrors((prev) => ({ ...prev, assignedTo: "" }));
      }
      loadProjectTeamMembers(value);
    }
  };

  const handleAssignedToChange = (selectedUsers) => {
    setFormData((prev) => ({ ...prev, assignedTo: selectedUsers }));
  };

  const handleTesterChange = (selectedUsers) => {
    setFormData((prev) => ({ ...prev, tester: selectedUsers[0] || null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Task title is required";
    if (!formData.projectId) newErrors.projectId = "Please select a project";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (formData.assignedTo.length === 0) {
      newErrors.assignedTo = "Please assign at least one team member";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
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

      await axiosInstance.put(API_PATHS.TASKS.UPDATE_TASK(id), taskData);
      toast.success("Task updated successfully!");
      navigate(`/manager/tasks/${id}`);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (fetchLoading) {
    return (
      <DashboardLayout activeMenu="Tasks">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Tasks">
      <div className="my-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuArrowLeft className="text-xl" />
          </button>
          <h2 className="text-xl md:text-2xl font-medium">Edit Task</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project *
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="input w-full md:w-96"
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
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

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
              />
            </div>

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
                  This project has no team members to assign.
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Todo Checklist
              </label>
              <TodoListInput
                todoList={formData.todoChecklist}
                onChange={(todoChecklist) =>
                  setFormData((prev) => ({ ...prev, todoChecklist }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attachments
              </label>
              <AddAttachmentsInput
                attachments={formData.attachments}
                onChange={(attachments) =>
                  setFormData((prev) => ({ ...prev, attachments }))
                }
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => navigate(-1)} className="btn-outline">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? "Saving..." : (
                  <>
                    <LuSave />
                    Save Changes
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

export default EditTask;
