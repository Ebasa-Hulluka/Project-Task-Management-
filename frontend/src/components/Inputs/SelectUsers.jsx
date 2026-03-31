import React, { useState, useEffect } from "react";
import { LuUsers, LuSearch, LuCheck } from "react-icons/lu";
import { toast } from "react-hot-toast";

import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../Modal";
import { getInitials } from "../../utils/helper";

const SelectUsers = ({
  selectedUsers = [],
  onChange,
  label = "Select Team Members",
  placeholder = "Add members",
  maxSelections,
  filterByRole,
  users = null,
  disabled = false,
}) => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const applyUsers = (items) => {
    let nextUsers = Array.isArray(items) ? items : [];
    if (filterByRole) {
      nextUsers = nextUsers.filter((user) => user.role === filterByRole);
    }
    setAllUsers(nextUsers);
    setFilteredUsers(nextUsers);
  };

  // Fetch all users
  const fetchUsers = async () => {
    if (Array.isArray(users) && users.length > 0) {
      applyUsers(users);
      return;
    }

    try {
      setLoading(true);
      const endpoint =
        filterByRole === "teamMember"
          ? API_PATHS.USERS.GET_TEAM_MEMBERS
          : API_PATHS.USERS.GET_ALL_USERS;
      const response = await axiosInstance.get(endpoint);
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
          ? payload.users
          : [];
      applyUsers(list);
    } catch (error) {
      // Don't spam console with 403 errors
      if (error?.response?.status !== 403) {
        console.error("Error fetching users:", error);
      }
      // Only show toast for non-403 errors
      if (error?.response?.status !== 403) {
        toast.error("Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (Array.isArray(users)) {
      applyUsers(users);
    }
  }, [users, filterByRole]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchTerm, allUsers]);

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setTempSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        // Check max selections
        if (maxSelections && prev.length >= maxSelections) {
          toast.error(`Maximum ${maxSelections} users can be selected`);
          return prev;
        }
        return [...prev, userId];
      }
    });
  };

  // Handle assign
  const handleAssign = () => {
    onChange(tempSelectedUsers);
    setIsModalOpen(false);
    setSearchTerm("");

    if (tempSelectedUsers.length > 0) {
      toast.success(`${tempSelectedUsers.length} member(s) assigned`);
    }
  };

  // Handle open modal
  const handleOpenModal = () => {
    setTempSelectedUsers(selectedUsers);
    setIsModalOpen(true);
    fetchUsers();
  };

  // Get selected user details
  const selectedUserDetails = allUsers
    .filter((user) => selectedUsers.includes(user._id))
    .map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    }));

  useEffect(() => {
    if (isModalOpen) {
      fetchUsers();
    }
  }, [isModalOpen]);

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Selected Users Display */}
      {selectedUserDetails.length === 0 ? (
        <button
          type="button"
          onClick={handleOpenModal}
          disabled={disabled}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <LuUsers className="text-primary text-lg" />
            <span className="text-sm text-gray-600">{placeholder}</span>
          </div>
        </button>
      ) : (
        <div
          onClick={handleOpenModal}
          className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-primary transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {selectedUserDetails.length} member
              {selectedUserDetails.length > 1 ? "s" : ""} selected
            </span>
            {!disabled && (
              <span className="text-xs text-primary">Click to change</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedUserDetails.slice(0, 5).map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"
              >
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.name}
                    className="w-4 h-4 rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-medium text-primary">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-700">{user.name}</span>
              </div>
            ))}
            {selectedUserDetails.length > 5 && (
              <span className="text-xs text-gray-500">
                +{selectedUserDetails.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSearchTerm("");
        }}
        title="Select Team Members"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>

          {/* Users List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = tempSelectedUsers.includes(user._id);

                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(user.name)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Role:{" "}
                          {user.role === "admin"
                            ? "Administrator"
                            : user.role === "projectManager"
                              ? "Project Manager"
                              : "Team Member"}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <LuCheck className="text-white text-xs" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <LuUsers className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setSearchTerm("");
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              className="btn-primary"
              disabled={tempSelectedUsers.length === 0}
            >
              Assign{" "}
              {tempSelectedUsers.length > 0 && `(${tempSelectedUsers.length})`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SelectUsers;
