import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  LuSearch,
  LuFilter,
  LuFolder,
} from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import DeleteAlert from "../../components/DeleteAlert";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import ProjectCard from "../../components/Cards/ProjectCard";
import IncrementalListControls from "../../components/IncrementalListControls";
import useIncrementalList from "../../hooks/useIncrementalList";
import { PROJECT_STATUS_DATA } from "../../utils/data";
import { getErrorMessage } from "../../utils/helper";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const {
    visibleItems: visibleProjects,
    visibleCount: visibleProjectCount,
    totalCount: totalProjectCount,
    remainingCount: remainingProjectsCount,
    showMore: showMoreProjects,
  } = useIncrementalList(filteredProjects, 4, [filteredProjects.length, searchTerm, statusFilter]);

  const navigate = useNavigate();

  // Fetch all projects for this manager
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.PROJECTS.GET_ALL_PROJECTS,
      );

      if (response.data) {
        setProjects(response.data);
        setFilteredProjects(response.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  // Handle project click
  const handleProjectClick = (projectId) => {
    navigate(`/manager/projects/${projectId}`);
  };

  // Handle edit project
  const handleEditProject = (projectId) => {
    navigate(`/manager/projects/edit/${projectId}`);
  };

  const handleDeleteProject = (projectId) => {
    const target =
      projects.find((p) => p._id === projectId) ||
      filteredProjects.find((p) => p._id === projectId);
    setDeleteTarget(target || { _id: projectId, name: "this project" });
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget?._id) return;

    try {
      setDeleting(true);
      await axiosInstance.delete(
        API_PATHS.PROJECTS.DELETE_PROJECT(deleteTarget._id),
      );
      toast.success("Project deleted successfully");
      setDeleteTarget(null);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(getErrorMessage(error) || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = [...projects];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // Apply search
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Calculate statistics
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "Active").length,
    planning: projects.filter((p) => p.status === "Planning").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    onHold: projects.filter((p) => p.status === "On Hold").length,
  };

  return (
    <DashboardLayout activeMenu="My Projects">
      <div className="my-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-medium">My Projects</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your projects
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-600">Active</p>
            <p className="text-2xl font-semibold text-blue-700">
              {stats.active}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-purple-600">Planning</p>
            <p className="text-2xl font-semibold text-purple-700">
              {stats.planning}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-semibold text-green-700">
              {stats.completed}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <p className="text-sm text-orange-600">On Hold</p>
            <p className="text-2xl font-semibold text-orange-700">
              {stats.onHold}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <button
              className="btn-outline flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <LuFilter />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input text-sm py-1.5 w-48"
                >
                  <option value="all">All Status</option>
                  {PROJECT_STATUS_DATA.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredProjects.length > 0 ? (
              visibleProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => handleProjectClick(project._id)}
                  onEdit={() => handleEditProject(project._id)}
                  onDelete={() => handleDeleteProject(project._id)}
                  showActions={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <LuFolder className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No projects found</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <IncrementalListControls
            visibleCount={visibleProjectCount}
            totalCount={totalProjectCount}
            remainingCount={remainingProjectsCount}
            onShowMore={showMoreProjects}
            batchSize={4}
            itemLabel="projects"
          />
        )}

        <DeleteAlert
          isOpen={Boolean(deleteTarget)}
          onClose={() => !deleting && setDeleteTarget(null)}
          onConfirm={confirmDeleteProject}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          itemName={deleteTarget?.name}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProjectList;
