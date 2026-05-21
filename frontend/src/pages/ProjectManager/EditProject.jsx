import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuArrowLeft, LuSave, LuTrash2 } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import SelectDropdown from "../../components/Inputs/SelectDropdown";
import DeleteAlert from "../../components/DeleteAlert";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { PROJECT_STATUS_DATA } from "../../utils/data";
import { getErrorMessage } from "../../utils/helper";
import { getProjectPaths, isTaskViewOnlyRole } from "../../utils/rolePaths";
import { useUser } from "../../context/userContext";

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const projectPaths = getProjectPaths(user?.role);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Planning",
    team: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isTaskViewOnlyRole(user?.role)) {
      toast.error(
        "Super Admins and Admins can only view projects. Editing projects is not allowed.",
      );
      navigate(projectPaths.list, { replace: true });
    }
  }, [user?.role, navigate, projectPaths.list]);

  // Fetch project details
  const fetchProjectDetails = async () => {
    try {
      setFetchLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_PROJECT_BY_ID(id),
      );

      if (response.data) {
        const project = response.data;
        setFormData({
          name: project.name || "",
          description: project.description || "",
          startDate: project.startDate ? project.startDate.split("T")[0] : "",
          endDate: project.endDate ? project.endDate.split("T")[0] : "",
          status: project.status || "Planning",
          team: Array.isArray(project.team)
            ? project.team.map((teamItem) =>
                typeof teamItem === "string" ? teamItem : teamItem?._id,
              )
            : [],
        });
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error(getErrorMessage(error) || "Failed to load project details");
      navigate(projectPaths.list);
    } finally {
      setFetchLoading(false);
    }
  };

  // Fetch teams for project assignment
  const fetchTeams = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TEAMS.GET_ALL_TEAMS);
      if (response.data) {
        const teamOptions = (Array.isArray(response.data) ? response.data : []).map((team) => ({
          label: team.name,
          value: team._id,
        }));
        setTeams(teamOptions);
      }
    } catch (error) {
      // Don't spam console with 403 errors
      if (error.response?.status !== 403) {
        console.error("Error fetching teams:", error);
      }
      toast.error(getErrorMessage(error) || "Failed to load teams");
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

  // Handle team selection
  const handleTeamChange = (selectedTeams) => {
    setFormData((prev) => ({ ...prev, team: selectedTeams }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
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
      const projectData = {
        ...formData,
        team: (Array.isArray(formData.team) ? formData.team : [])
          .map((teamId) => String(teamId))
          .filter(Boolean),
      };

      const response = await axiosInstance.put(
        API_PATHS.PROJECTS.UPDATE_PROJECT(id),
        projectData,
      );

      if (response.data) {
        toast.success("Project updated successfully!");
        navigate(projectPaths.detail(id));
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error(getErrorMessage(error) || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  // Handle project deletion
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(API_PATHS.PROJECTS.DELETE_PROJECT(id));
      toast.success("Project deleted successfully");
      navigate(projectPaths.list);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(getErrorMessage(error) || "Failed to delete project");
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchTeams();
  }, [id]);

  if (fetchLoading) {
    return (
      <DashboardLayout activeMenu="Edit Project">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Edit Project">
      <div className="my-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LuArrowLeft className="text-xl" />
            </button>
            <h2 className="text-xl md:text-2xl font-medium">Edit Project</h2>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn-outline text-red-600 border-red-200 hover:bg-red-50"
          >
            <LuTrash2 className="text-lg" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6 md:p-8"
        >
          <div className="space-y-7">
            {/* Project Name */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input w-full"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="input w-full min-h-[120px] resize-y"
              />
            </div>

            {/* Dates and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="border border-gray-200 rounded-lg p-4 h-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input w-full"
                />
                </div>
              </div>

              <div>
                <div className="border border-gray-200 rounded-lg p-4 h-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input w-full"
                />
                {errors.endDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                )}
                </div>
              </div>

              <div>
                <div className="border border-gray-200 rounded-lg p-4 h-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input w-full"
                >
                  {PROJECT_STATUS_DATA.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                </div>
              </div>
            </div>

            {/* Team Selection */}
            <div className="pt-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teams
              </label>
              <SelectDropdown
                options={teams}
                value={formData.team}
                onChange={handleTeamChange}
                placeholder="Select team(s)..."
                multiple={true}
                searchable={true}
                clearable={true}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
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
                    Saving...
                  </>
                ) : (
                  <>
                    <LuSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <DeleteAlert
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone and will affect all associated tasks."
        />
      </div>
    </DashboardLayout>
  );
};

export default EditProject;
