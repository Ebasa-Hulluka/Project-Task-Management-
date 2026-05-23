import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuFileSpreadsheet, LuFilter, LuKeyRound, LuPlus, LuSearch } from "react-icons/lu";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUser } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import UserCard from "../../components/Cards/UserCard";
import DeleteAlert from "../../components/DeleteAlert";
import Modal from "../../components/Modal";
import Input from "../../components/Inputs/Input";
import IncrementalListControls from "../../components/IncrementalListControls";
import useIncrementalList from "../../hooks/useIncrementalList";
import { validateEmail } from "../../utils/helper";

const ManageUsers = () => {
  const { user: currentUser } = useUser();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState(null);
  const [statusActionUserId, setStatusActionUserId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [emailQuery, setEmailQuery] = useState("");
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deactivateTargetUser, setDeactivateTargetUser] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState({});
  const [resetRequestsOpen, setResetRequestsOpen] = useState(false);
  const [resetRequests, setResetRequests] = useState([]);
  const [resetRequestsLoading, setResetRequestsLoading] = useState(false);
  const [resetPasswords, setResetPasswords] = useState({});
  const [resetPasswordErrors, setResetPasswordErrors] = useState({});
  const [activeResetRequestId, setActiveResetRequestId] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    roles: ["teamMember"],
  });

  const canAccessManageUsers =
    currentUser?.role === "superAdmin" || currentUser?.role === "admin";
  const isSuperAdmin = currentUser?.role === "superAdmin";
  const {
    visibleItems: visibleUsers,
    visibleCount: visibleUserCount,
    totalCount: totalUserCount,
    remainingCount: remainingUsersCount,
    showMore: showMoreUsers,
    batchSize: userBatchSize,
  } = useIncrementalList(
    filteredUsers,
    { batchSize: 8, columns: 4 },
    [
      filteredUsers.length,
      emailQuery,
      roleFilter,
      statusFilter,
    ],
  );

  const roleOptions = [
    { value: "teamMember", label: "Team Member" },
    { value: "tester", label: "Tester" },
    { value: "projectManager", label: "Project Manager" },
    { value: "admin", label: "Admin" },
  ];

  const applyEmailFilter = (query, sourceUsers = allUsers) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setFilteredUsers(sourceUsers);
      return;
    }

    setFilteredUsers(
      sourceUsers.filter((item) =>
        `${item?.name || ""} ${item?.email || ""}`.toLowerCase().includes(normalized),
      ),
    );
  };

  const getUsers = async (filters = {}) => {
    if (!canAccessManageUsers) {
      toast.error("Access denied.");
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_FILTERED_USERS(filters));
      const users = Array.isArray(response.data) ? response.data : response.data?.users || [];
      const backendSummary = Array.isArray(response.data) ? null : response.data?.summary || null;

      setAllUsers(users);
      applyEmailFilter(emailQuery, users);
      setSummary(backendSummary);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("Access denied.");
        navigate("/");
        return;
      }

      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully");
    } catch {
      toast.error("Failed to download report");
    }
  };

  const handleRoleChange = async (userId, newRoles) => {
    try {
      await axiosInstance.put(API_PATHS.USERS.UPDATE_USER_ROLE(userId), {
        roles: newRoles,
      });
      toast.success("User roles updated successfully");
      getUsers({ role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    const target = allUsers.find((item) => item._id === userId) || null;
    setDeletePassword("");
    setDeletePasswordError("");
    setDeleteTargetUser(target || { _id: userId });
  };

  const handleDeactivateUser = async (userId) => {
    const target = allUsers.find((item) => item._id === userId) || null;
    setDeactivateTargetUser(target || { _id: userId });
  };

  const confirmDeactivateUser = async () => {
    if (!deactivateTargetUser?._id) return;

    try {
      setStatusActionUserId(deactivateTargetUser._id);
      await axiosInstance.post(API_PATHS.USERS.DEACTIVATE_ACCOUNT(deactivateTargetUser._id));
      toast.success("User deactivated successfully");
      setDeactivateTargetUser(null);
      getUsers({ role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to deactivate user");
    } finally {
      setStatusActionUserId(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTargetUser?._id) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError("Enter your password to confirm deletion");
      return;
    }

    try {
      setStatusActionUserId(deleteTargetUser._id);
      setDeletePasswordError("");
      await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(deleteTargetUser._id), {
        data: {
          currentPassword: deletePassword,
        },
      });
      toast.success("User deleted successfully");
      setDeleteTargetUser(null);
      setDeletePassword("");
      getUsers({ role: roleFilter, status: statusFilter });
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete user";
      setDeletePasswordError(message);
      toast.error(message);
    } finally {
      setStatusActionUserId(null);
    }
  };

  const handleReactivateUser = async (userId) => {
    try {
      setStatusActionUserId(userId);
      await axiosInstance.post(API_PATHS.USERS.REACTIVATE_ACCOUNT(userId));
      toast.success("User reactivated successfully");
      getUsers({ role: roleFilter, status: statusFilter });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reactivate user");
    } finally {
      setStatusActionUserId(null);
    }
  };

  const getPasswordResetRequests = async () => {
    if (!isSuperAdmin) return;

    try {
      setResetRequestsLoading(true);
      const response = await axiosInstance.get(API_PATHS.USERS.GET_PASSWORD_RESET_REQUESTS);
      setResetRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch password requests");
    } finally {
      setResetRequestsLoading(false);
    }
  };

  const openPasswordRequests = () => {
    setResetRequestsOpen(true);
    setResetPasswords({});
    setResetPasswordErrors({});
    getPasswordResetRequests();
  };

  const handleCompletePasswordReset = async (requestId) => {
    const newPassword = String(resetPasswords[requestId] || "");

    if (newPassword.length < 6) {
      setResetPasswordErrors((prev) => ({
        ...prev,
        [requestId]: "Password must be at least 6 characters",
      }));
      return;
    }

    try {
      setActiveResetRequestId(requestId);
      setResetPasswordErrors((prev) => ({ ...prev, [requestId]: "" }));
      await axiosInstance.post(API_PATHS.USERS.COMPLETE_PASSWORD_RESET_REQUEST(requestId), {
        newPassword,
      });
      toast.success("New password emailed to user");
      setResetPasswords((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      getPasswordResetRequests();
    } catch (error) {
      const message = error.response?.data?.message || "Failed to complete password reset";
      setResetPasswordErrors((prev) => ({ ...prev, [requestId]: message }));
      toast.error(message);
    } finally {
      setActiveResetRequestId(null);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      password: "",
      roles: ["teamMember"],
    });
    setCreateErrors({});
  };

  const toggleCreateRole = (roleValue) => {
    setCreateForm((prev) => {
      const hasRole = prev.roles.includes(roleValue);
      if (hasRole) {
        const next = prev.roles.filter((r) => r !== roleValue);
        return { ...prev, roles: next.length ? next : prev.roles };
      }
      return { ...prev, roles: [...prev.roles, roleValue] };
    });
    setCreateErrors((prev) => ({ ...prev, roles: "" }));
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateModalOpen(true);
  };

  const validateCreateForm = () => {
    const nextErrors = {};

    if (!createForm.name.trim()) {
      nextErrors.name = "Full name is required";
    }

    if (!validateEmail(createForm.email.trim().toLowerCase())) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!createForm.password || createForm.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (!createForm.roles.length) {
      nextErrors.roles = "Select at least one role";
    }

    if (
      createForm.roles.some(
        (roleValue) => !roleOptions.some((option) => option.value === roleValue),
      )
    ) {
      nextErrors.roles = "One or more selected roles are invalid";
    }

    setCreateErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateCreateForm()) return;

    try {
      setCreateLoading(true);
      setCreateErrors({});
      await axiosInstance.post(API_PATHS.USERS.CREATE_USER, {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        roles: createForm.roles,
      });

      toast.success("User account created successfully");
      setCreateModalOpen(false);
      resetCreateForm();
      getUsers({ role: roleFilter, status: statusFilter });
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Failed to create user account";
      const normalizedMessage = message.toLowerCase();
      const isDuplicateEmailMessage =
        normalizedMessage.includes("email already exists") ||
        normalizedMessage.includes("already an account with this email") ||
        normalizedMessage.includes("already an account by this email");

      if (isDuplicateEmailMessage) {
        setCreateErrors((prev) => ({
          ...prev,
          email: message,
          form: "",
        }));
        toast.error(message);
        return;
      }

      setCreateErrors((prev) => ({ ...prev, form: message }));
      toast.error(message);
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    getUsers({ role: roleFilter, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, roleFilter, statusFilter]);

  return (
    <DashboardLayout activeMenu="Users">
      <div className="mt-5 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-medium">User Management</h2>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={openCreateModal}
            >
              <LuPlus className="text-lg" />
              Create User
            </button>

            {isSuperAdmin && (
              <button
                className="btn-outline flex items-center gap-2"
                onClick={openPasswordRequests}
              >
                <LuKeyRound className="text-lg" />
                Password Requests
              </button>
            )}

            <button
              className="btn-outline flex items-center gap-1"
              onClick={() => setShowFilters(!showFilters)}
            >
              <LuFilter className="text-lg" />
              Filter
            </button>

            <button
              className="btn-outline flex items-center gap-1"
              onClick={handleDownloadReport}
            >
              <LuFileSpreadsheet className="text-lg" />
              Export
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 app-text-muted" />
            <input
              type="text"
              value={emailQuery}
              onChange={(e) => {
                setEmailQuery(e.target.value);
                applyEmailFilter(e.target.value);
              }}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg app-border app-surface app-text outline-none focus:ring-1 focus:ring-(--app-primary)"
            />
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input text-sm py-1.5 w-48 mt-1"
                >
                  <option value="all">All Roles</option>
                  <option value="superAdmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="projectManager">Project Manager</option>
                  <option value="teamMember">Team Member</option>
                  <option value="tester">Tester</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input text-sm py-1.5 w-48 mt-1"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
            {filteredUsers.length > 0 ? (
              visibleUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onRoleChange={handleRoleChange}
                  onDelete={handleDeleteUser}
                  onDeactivate={handleDeactivateUser}
                  onReactivate={handleReactivateUser}
                  statusActionLoading={statusActionUserId === user._id}
                  showActions={true}
                  currentUserRole={currentUser?.role || ""}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <IncrementalListControls
            visibleCount={visibleUserCount}
            totalCount={totalUserCount}
            remainingCount={remainingUsersCount}
            onShowMore={showMoreUsers}
            batchSize={userBatchSize}
            itemLabel="users"
          />
        )}

        {!loading && allUsers.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1">
              {[
                { label: "Total Users", value: summary?.totalUsers ?? allUsers.length },
                { label: "Super Admins", value: summary?.byRole?.superAdmin ?? allUsers.filter((u) => (u.roles || [u.role]).includes("superAdmin")).length },
                { label: "Admins", value: summary?.byRole?.admin ?? allUsers.filter((u) => (u.roles || [u.role]).includes("admin")).length },
                { label: "Project Managers", value: summary?.byRole?.projectManager ?? allUsers.filter((u) => (u.roles || [u.role]).includes("projectManager")).length },
                { label: "Team Members", value: summary?.byRole?.teamMember ?? allUsers.filter((u) => (u.roles || [u.role]).includes("teamMember")).length },
                { label: "Testers", value: summary?.byRole?.tester ?? allUsers.filter((u) => (u.roles || [u.role]).includes("tester")).length },
                { label: "Deactivated", value: summary?.byStatus?.deactivated ?? allUsers.filter((u) => u.isActive === false).length },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white border border-gray-200 rounded-lg p-4 min-h-[90px] min-w-[180px] flex-shrink-0 flex flex-col justify-between"
                >
                  <p className="text-xs text-gray-500 leading-4">{item.label}</p>
                  <p className="text-2xl font-semibold leading-none">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteAlert
        isOpen={Boolean(deactivateTargetUser)}
        onClose={() => setDeactivateTargetUser(null)}
        onConfirm={confirmDeactivateUser}
        title="Deactivate User"
        message="This user will no longer be able to log in until an admin reactivates the account."
        itemName={deactivateTargetUser?.email || deactivateTargetUser?.name || ""}
        loading={statusActionUserId === deactivateTargetUser?._id}
        confirmLabel="Deactivate User"
        loadingLabel="Deactivating..."
      />

      <DeleteAlert
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => {
          setDeleteTargetUser(null);
          setDeletePassword("");
          setDeletePasswordError("");
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Enter your password to confirm deleting this user. This action cannot be undone."
        itemName={deleteTargetUser?.email || deleteTargetUser?.name || ""}
        loading={statusActionUserId === deleteTargetUser?._id}
        confirmLabel="Delete User"
        confirmDisabled={!deletePassword.trim()}
      >
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Your Password
          </label>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
              if (deletePasswordError) {
                setDeletePasswordError("");
              }
            }}
            placeholder="Enter your password"
            className="input w-full"
            disabled={statusActionUserId === deleteTargetUser?._id}
          />
          {deletePasswordError && (
            <p className="mt-1.5 text-xs text-red-500">{deletePasswordError}</p>
          )}
        </div>
      </DeleteAlert>

      <Modal
        isOpen={resetRequestsOpen}
        onClose={() => {
          if (activeResetRequestId) return;
          setResetRequestsOpen(false);
          setResetPasswords({});
          setResetPasswordErrors({});
        }}
        title="Password Reset Requests"
        size="lg"
      >
        {resetRequestsLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : resetRequests.length > 0 ? (
          <div className="space-y-3">
            {resetRequests.map((request) => {
              const requestedUser = request.user || {};
              const requestId = request._id;
              return (
                <div
                  key={requestId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {requestedUser.name || request.email}
                      </p>
                      <p className="text-sm text-gray-500">{request.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Role: {requestedUser.role || "N/A"} | Requested:{" "}
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="w-full lg:w-80">
                      <Input
                        value={resetPasswords[requestId] || ""}
                        onChange={(event) => {
                          setResetPasswords((prev) => ({
                            ...prev,
                            [requestId]: event.target.value,
                          }));
                          setResetPasswordErrors((prev) => ({
                            ...prev,
                            [requestId]: "",
                          }));
                        }}
                        label="New Password"
                        placeholder="At least 6 characters"
                        type="password"
                        disabled={activeResetRequestId === requestId}
                        error={resetPasswordErrors[requestId]}
                      />
                      <button
                        type="button"
                        className="btn-primary w-full mt-3"
                        onClick={() => handleCompletePasswordReset(requestId)}
                        disabled={activeResetRequestId === requestId}
                      >
                        {activeResetRequestId === requestId
                          ? "Sending..."
                          : "Set Password & Email"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No pending password reset requests.</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          if (createLoading) return;
          setCreateModalOpen(false);
          resetCreateForm();
        }}
        title="Create User Account"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            error={createErrors.name}
            placeholder="Enter full name"
            disabled={createLoading}
            required
          />

          <Input
            label="Email Address"
            value={createForm.email}
            onChange={(e) => {
              setCreateForm((prev) => ({ ...prev, email: e.target.value }));
              setCreateErrors((prev) => ({
                ...prev,
                email: "",
                form: "",
              }));
            }}
            error={createErrors.email}
            placeholder="Enter email"
            type="email"
            disabled={createLoading}
            required
          />

          <Input
            label="Password"
            value={createForm.password}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
            error={createErrors.password}
            placeholder="At least 6 characters"
            type="password"
            disabled={createLoading}
            required
          />

          <div>
            <label className="text-sm font-semibold app-text block mb-1.5">
              Roles (select one or more)
            </label>
            <div className="space-y-2 rounded-lg border border-gray-200 p-3">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 text-sm ${
                    option.value === "admin" && !isSuperAdmin
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={createForm.roles.includes(option.value)}
                    disabled={
                      createLoading || (option.value === "admin" && !isSuperAdmin)
                    }
                    onChange={() => toggleCreateRole(option.value)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            {createErrors.roles && (
              <p className="mt-1.5 text-xs text-red-500">{createErrors.roles}</p>
            )}
            {!isSuperAdmin && (
              <p className="mt-1.5 text-xs text-gray-500">
                Only the super admin can assign the admin role.
              </p>
            )}
          </div>

          {createErrors.form && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{createErrors.form}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetCreateForm();
              }}
              disabled={createLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreateUser}
              disabled={createLoading}
            >
              {createLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageUsers;
