import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  LuUser,
  LuMail,
  LuBriefcase,
  LuUsers,
  LuCalendar,
  LuCamera,
  LuSave,
  LuLock,
} from "react-icons/lu";
import moment from "moment";

import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUser } from "../../context/userContext";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import uploadImage from "../../utils/uploadImage";
import Input from "../../components/Inputs/Input";
import { validateEmail } from "../../utils/helper";

const Profile = () => {
  const { user, updateProfile, getRoleLabel } = useUser();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
      setImagePreview(user.profileImageUrl || null);
    }
  }, [user]);

  // Fetch user activity from backend
  useEffect(() => {
    const fetchActivity = async () => {
      if (!user?._id) return;
      try {
        setActivityLoading(true);
        const response = await axiosInstance.get(API_PATHS.ACTIVITY.GET_ACTIVITY, {
          params: { limit: 20 },
        });
        setActivity(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching activity:", error);
        toast.error(
          error?.message ||
            error?.response?.data?.message ||
            "Failed to fetch activity",
        );
        setActivity([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [user?._id]);

  const getActivityType = (action = "") => {
    const normalized = action.toLowerCase();
    if (
      normalized.includes("deletion") ||
      normalized.includes("deactivated") ||
      normalized.includes("reactivated")
    ) {
      return "account";
    }
    if (normalized.includes("login")) return "auth";
    if (normalized.includes("profile") || normalized.includes("password")) {
      return "profile";
    }
    if (normalized.includes("task")) return "task";
    return "auth";
  };

  const uniqueRecentActivity = useMemo(() => {
    // Keep only the latest item for each activity type
    const seenTypes = new Set();
    const deduped = [];

    for (const item of activity) {
      const type = getActivityType(item.action);
      if (!seenTypes.has(type)) {
        seenTypes.add(type);
        deduped.push(item);
      }
    }

    return deduped;
  }, [activity]);

  const isIdentityChanged = useMemo(() => {
    const nextName = (formData.name || "").trim();
    const nextEmail = (formData.email || "").trim().toLowerCase();
    const currentName = (user?.name || "").trim();
    const currentEmail = (user?.email || "").trim().toLowerCase();

    return nextName !== currentName || nextEmail !== currentEmail;
  }, [formData.name, formData.email, user?.name, user?.email]);

  const requiresCurrentPassword = isIdentityChanged || changePassword;

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (requiresCurrentPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Current password is required to confirm changes";
    }

    if (changePassword) {
      if (!formData.newPassword) {
        newErrors.newPassword = "New password is required";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let profileImageUrl = user?.profileImageUrl;

      // Upload new profile image if selected
      if (profileImage) {
        const uploadResult = await uploadImage(profileImage);
        if (uploadResult.success) {
          profileImageUrl = uploadResult.imageUrl;
        }
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        email: formData.email,
        profileImageUrl,
      };

      // Add password confirmation for identity changes and password updates
      if (requiresCurrentPassword) {
        updateData.currentPassword = formData.currentPassword;
      }

      if (changePassword) {
        updateData.newPassword = formData.newPassword;
      }

      // Update profile
      const result = await updateProfile(updateData);

      if (result.success) {
        toast.success("Profile updated successfully");
        setEditMode(false);
        setChangePassword(false);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditMode(false);
    setChangePassword(false);
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setImagePreview(user?.profileImageUrl || null);
    setProfileImage(null);
    setErrors({});
  };

  // Get role badge color
  const getRoleColor = (role) => {
    switch (role) {
      case "superAdmin":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "admin":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "projectManager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "teamMember":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-[var(--app-surface-hover)] app-text-muted border-[var(--app-border)]";
    }
  };

  if (!user) {
    return (
      <DashboardLayout activeMenu="Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="Profile">
      <div className="my-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-medium app-text">My Profile</h2>
          <p className="text-sm app-text-muted mt-1">
            Manage your personal information and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="app-card rounded-lg shadow-sm p-6">
              {/* Profile Image */}
              <div className="relative mb-4 flex justify-center">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  {editMode && (
                    <label
                      htmlFor="profile-image"
                      className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors"
                    >
                      <LuCamera className="text-sm" />
                      <input
                        type="file"
                        id="profile-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold app-text">{user.name}</h3>
                <p className="text-sm app-text-muted">{user.email}</p>
              </div>

              {/* Role Badge */}
              <div className="flex justify-center mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>

              {/* Stats */}
              <div className="app-border-top pt-4">
                <div className="flex items-center gap-3 text-sm app-text-muted mb-2">
                  <LuBriefcase className="app-text-muted" />
                  <span>
                    Member since {moment(user.createdAt).format("MMM YYYY")}
                  </span>
                </div>
                {user.team && typeof user.team === "object" && (
                  <div className="flex items-center gap-3 text-sm app-text-muted">
                    <LuUsers className="app-text-muted" />
                    <span>Team: {user.team.name || "Not assigned"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Forms and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Profile Form */}
            <div className="app-card rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold app-text">Personal Information</h3>
              </div>

              {editMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium app-text mb-1">
                      Full Name
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      icon={<LuUser />}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium app-text mb-1">
                      Email Address
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      icon={<LuMail />}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Confirmation Password */}
                  {requiresCurrentPassword && (
                    <div>
                      <label className="block text-sm font-medium app-text mb-1">
                        Current Password
                      </label>
                      <Input
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter current password"
                      />
                      {errors.currentPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.currentPassword}
                        </p>
                      )}
                      {isIdentityChanged && !changePassword && (
                        <p className="text-xs app-text-muted mt-1">
                          Password confirmation is required to save name or email changes.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Change Password Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setChangePassword(!changePassword)}
                      className="text-primary text-sm hover:underline flex items-center gap-1"
                    >
                      <LuLock className="text-sm" />
                      {changePassword
                        ? "Cancel password change"
                        : "Change password"}
                    </button>
                  </div>

                  {/* Password Fields */}
                  {changePassword && (
                    <div className="space-y-4 pt-2 app-border-top">
                      <div>
                        <label className="block text-sm font-medium app-text mb-1">
                          New Password
                        </label>
                        <Input
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password"
                        />
                        {errors.newPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium app-text mb-1">
                          Confirm New Password
                        </label>
                        <Input
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-outline"
                      disabled={loading}
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
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--app-surface-hover)] rounded-lg flex items-center justify-center">
                      <LuUser className="app-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs app-text-muted">Full Name</p>
                      <p className="text-sm font-medium app-text">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--app-surface-hover)] rounded-lg flex items-center justify-center">
                      <LuMail className="app-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs app-text-muted">Email Address</p>
                      <p className="text-sm font-medium app-text">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="app-card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold app-text mb-4">Recent Activity</h3>
              {activityLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : uniqueRecentActivity.length === 0 ? (
                <p className="text-sm app-text-muted">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {uniqueRecentActivity.map((item) => {
                    const type = getActivityType(item.action);
                    return (
                      <div
                        key={item._id}
                        className="flex items-start gap-3 pb-3 app-border-bottom last:border-0"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            type === "auth"
                              ? "bg-blue-100"
                              : type === "account"
                                ? "bg-amber-100"
                              : type === "profile"
                                ? "bg-purple-100"
                                : "bg-green-100"
                          }`}
                        >
                          {type === "auth" ? (
                            <LuLock className="text-blue-600" />
                          ) : type === "account" ? (
                            <LuCalendar className="text-amber-600" />
                          ) : type === "profile" ? (
                            <LuUser className="text-purple-600" />
                          ) : (
                            <LuBriefcase className="text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium app-text">{item.action}</p>
                          {item.details && (
                            <p className="text-xs app-text-muted">{item.details}</p>
                          )}
                          <p className="text-xs app-text-muted">
                            {moment(item.timestamp).fromNow()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
