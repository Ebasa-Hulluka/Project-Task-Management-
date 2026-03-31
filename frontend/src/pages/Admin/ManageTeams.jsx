import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { LuPlus, LuSearch, LuUsers, LuUserPlus } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import Modal from "../../components/Modal";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import TeamCard from "../../components/Cards/TeamCard";
import IncrementalListControls from "../../components/IncrementalListControls";
import SelectUsers from "../../components/Inputs/SelectUsers";
import AvatarGroup from "../../components/AvatarGroup";
import DeleteAlert from "../../components/DeleteAlert";
import useIncrementalList from "../../hooks/useIncrementalList";

const EMPTY_TEAM_FORM = {
  name: "",
  description: "",
  members: [],
  lead: "",
};

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState("");
  const [formData, setFormData] = useState(EMPTY_TEAM_FORM);
  const [formTouched, setFormTouched] = useState(false);
  const [deleteTargetTeam, setDeleteTargetTeam] = useState(null);
  const [deletingTeamId, setDeletingTeamId] = useState("");
  const {
    visibleItems: visibleTeams,
    visibleCount: visibleTeamCount,
    totalCount: totalTeamCount,
    remainingCount: remainingTeamsCount,
    showMore: showMoreTeams,
  } = useIncrementalList(filteredTeams, 4, [filteredTeams.length, searchTerm]);

  const getTeamMemberCount = (team) => {
    if (typeof team?.memberCount === "number") return team.memberCount;
    if (Array.isArray(team?.members)) return team.members.length;
    return 0;
  };

  const selectedMemberDetails = useMemo(
    () => {
      const memberIdSet = new Set((formData.members || []).map((id) => String(id)));
      return allUsers.filter((user) => memberIdSet.has(String(user?._id || "")));
    },
    [allUsers, formData.members],
  );

  const validationErrors = useMemo(() => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const descriptionLength = (formData.description || "").length;

    if (!trimmedName) {
      errors.name = "Team name is required";
    } else if (trimmedName.length < 2) {
      errors.name = "Team name must be at least 2 characters";
    } else if (trimmedName.length > 50) {
      errors.name = "Team name must be 50 characters or fewer";
    }

    if (descriptionLength > 200) {
      errors.description = "Description must be 200 characters or fewer";
    }

    if (!formData.members.length) {
      errors.members = "Select at least one team member";
    }

    if (formData.lead && !formData.members.includes(formData.lead)) {
      errors.lead = "Team lead must be one of the selected members";
    }

    return errors;
  }, [formData]);

  const isFormValid = Object.keys(validationErrors).length === 0;

  const getAllTeams = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.TEAMS.GET_ALL_TEAMS);
      const list = Array.isArray(response?.data) ? response.data : [];
      setTeams(list);
      setFilteredTeams(list);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      const payload = response?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
          ? payload.users
          : [];
      setAllUsers(list);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  const validateForm = () => {
    if (!isFormValid) {
      setFormTouched(true);
      const firstError = Object.values(validationErrors)[0];
      if (firstError) toast.error(firstError);
      return false;
    }
    return true;
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormData(EMPTY_TEAM_FORM);
    setFormTouched(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTeamId("");
    setFormData(EMPTY_TEAM_FORM);
    setFormTouched(false);
  };

  const handleCreateTeam = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await axiosInstance.post(API_PATHS.TEAMS.CREATE_TEAM, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: formData.members,
        lead: formData.lead || null,
      });
      toast.success("Team created successfully");
      closeCreateModal();
      getAllTeams();
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error(error.response?.data?.message || "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = async (teamId) => {
    try {
      setSubmitting(true);
      const response = await axiosInstance.get(API_PATHS.TEAMS.GET_TEAM_BY_ID(teamId));
      const team = response?.data;
      if (!team?._id) {
        toast.error("Failed to load team details");
        return;
      }

      const memberIds = (team.members || []).map((member) => member._id || member);
      const leadId = team.lead?._id || team.lead || "";

      setEditingTeamId(team._id);
      setFormData({
        name: team.name || "",
        description: team.description || "",
        members: memberIds,
        lead: leadId,
      });
      setFormTouched(false);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error loading team details:", error);
      toast.error(error.response?.data?.message || "Failed to load team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!validateForm() || !editingTeamId) return;

    try {
      setSubmitting(true);
      await axiosInstance.put(API_PATHS.TEAMS.UPDATE_TEAM(editingTeamId), {
        name: formData.name.trim(),
        description: formData.description.trim(),
        members: formData.members,
        lead: formData.lead || null,
      });
      toast.success("Team updated successfully");
      closeEditModal();
      getAllTeams();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error(error.response?.data?.message || "Failed to update team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    const target = teams.find((team) => team._id === teamId) || null;
    setDeleteTargetTeam(target || { _id: teamId });
  };

  const confirmDeleteTeam = async () => {
    if (!deleteTargetTeam?._id) return;

    try {
      setDeletingTeamId(deleteTargetTeam._id);
      await axiosInstance.delete(API_PATHS.TEAMS.DELETE_TEAM(deleteTargetTeam._id));
      toast.success("Team deleted successfully");
      setDeleteTargetTeam(null);
      getAllTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error(error.response?.data?.message || "Failed to delete team");
    } finally {
      setDeletingTeamId("");
    }
  };

  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredTeams(
        teams.filter(
          (team) =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    } else {
      setFilteredTeams(teams);
    }
  }, [searchTerm, teams]);

  useEffect(() => {
    getAllTeams();
    getAllUsers();
  }, []);

  const renderTeamForm = ({ title, onCancel, onSubmit, submitLabel }) => (
    <Modal isOpen onClose={onCancel} title={title} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormTouched(true);
              setFormData((prev) => ({ ...prev, name: e.target.value }));
            }}
            className="input w-full"
            placeholder="e.g., Backend Development"
            minLength={2}
            maxLength={50}
          />
          {formTouched && validationErrors.name && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <span className="text-xs text-gray-400">{(formData.description || "").length}/200</span>
          </div>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormTouched(true);
              setFormData((prev) => ({
                ...prev,
                description: e.target.value.slice(0, 200),
              }));
            }}
            className="input w-full"
            rows="3"
            placeholder="Team description..."
            maxLength={200}
          />
          {formTouched && validationErrors.description && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
          )}
        </div>

        <SelectUsers
          label="Select Team Members *"
          placeholder="Add team members"
          users={allUsers}
          selectedUsers={formData.members}
          onChange={(members) => {
            setFormTouched(true);
            setFormData((prev) => ({
              ...prev,
              members,
              lead: members.includes(prev.lead) ? prev.lead : "",
            }));
          }}
        />
        {formTouched && validationErrors.members && (
          <p className="text-xs text-red-500 -mt-2">{validationErrors.members}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead</label>
          <select
            value={formData.lead}
            onChange={(e) => {
              setFormTouched(true);
              setFormData((prev) => ({ ...prev, lead: e.target.value }));
            }}
            className="input w-full"
            disabled={!formData.members.length}
          >
            <option value="">Select team lead (optional)</option>
            {selectedMemberDetails.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {formTouched && validationErrors.lead && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.lead}</p>
          )}
        </div>

        {selectedMemberDetails.length > 0 && (
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500 mb-2">
              Selected Members ({selectedMemberDetails.length})
            </p>
            <AvatarGroup users={selectedMemberDetails} maxVisible={8} size="md" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button className="btn-outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={onSubmit}
          disabled={submitting || !isFormValid}
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </Modal>
  );

  return (
    <DashboardLayout activeMenu="Teams">
      <div className="my-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-medium">Teams</h2>
            <p className="text-sm text-gray-500 mt-1">Manage teams, members, and leads</p>
          </div>

          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              setFormData(EMPTY_TEAM_FORM);
              setFormTouched(false);
              setShowCreateModal(true);
            }}
          >
            <LuPlus className="text-lg" />
            Create Team
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <LuUsers className="text-primary text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Teams</p>
                <p className="text-2xl font-semibold">{teams.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <LuUserPlus className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-semibold">
                  {teams.reduce((acc, team) => acc + getTeamMemberCount(team), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <LuUsers className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Members/Team</p>
                <p className="text-2xl font-semibold">
                  {teams.length
                    ? Math.round(
                        teams.reduce((acc, team) => acc + getTeamMemberCount(team), 0) /
                          teams.length,
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full md:w-96"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredTeams.length > 0 ? (
              visibleTeams.map((team) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  onClick={openEditModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTeam}
                  showActions
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <LuUsers className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No teams found</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setFormData(EMPTY_TEAM_FORM);
                    setFormTouched(false);
                    setShowCreateModal(true);
                  }}
                >
                  Create Your First Team
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && filteredTeams.length > 0 && (
          <IncrementalListControls
            visibleCount={visibleTeamCount}
            totalCount={totalTeamCount}
            remainingCount={remainingTeamsCount}
            onShowMore={showMoreTeams}
            batchSize={4}
            itemLabel="teams"
          />
        )}

        {showCreateModal && (
          renderTeamForm({
            title: "Create New Team",
            submitLabel: "Create Team",
            onCancel: closeCreateModal,
            onSubmit: handleCreateTeam,
          })
        )}

        {showEditModal && (
          renderTeamForm({
            title: "Edit Team",
            submitLabel: "Save Changes",
            onCancel: closeEditModal,
            onSubmit: handleUpdateTeam,
          })
        )}
      </div>

      <DeleteAlert
        isOpen={Boolean(deleteTargetTeam)}
        onClose={() => setDeleteTargetTeam(null)}
        onConfirm={confirmDeleteTeam}
        title="Delete Team"
        message="Delete this team? This is not allowed when projects are still assigned."
        itemName={deleteTargetTeam?.name || ""}
        loading={deletingTeamId === deleteTargetTeam?._id}
      />
    </DashboardLayout>
  );
};

export default ManageTeams;
