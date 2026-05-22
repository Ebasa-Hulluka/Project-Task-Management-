import React, { createContext, useState, useEffect, useContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error("Failed to parse stored user:", err);
          clearUser();
        }
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  useEffect(() => {
    const syncAuthFromStorage = () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to sync stored user:", err);
        clearUser();
      }
    };

    window.addEventListener("pageshow", syncAuthFromStorage);
    window.addEventListener("popstate", syncAuthFromStorage);

    return () => {
      window.removeEventListener("pageshow", syncAuthFromStorage);
      window.removeEventListener("popstate", syncAuthFromStorage);
    };
  }, []);

  // Fetch user profile from server
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);

      if (response.data) {
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);

      // Only clear if unauthorized (401)
      if (error.response?.status === 401) {
        clearUser();
      }

      setError(error.response?.data?.message || "Failed to fetch user profile");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const normalizedEmail = (email || "").trim().toLowerCase();

      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: normalizedEmail,
        password,
      });

      if (response.data?.requiresRoleSelection) {
        sessionStorage.setItem("pendingLogin", JSON.stringify(response.data));
        return {
          success: true,
          requiresRoleSelection: true,
          roles: response.data.roles || [],
          user: response.data.user,
        };
      }

      const { token, ...userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error);
      const responseData = error?.response?.data || error || {};

      const errorMessage =
        responseData?.message ||
        error?.message ||
        error.message ||
        "Login failed. Please check your credentials.";

      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        errorCode: responseData?.code || "",
        meta: responseData,
      };
    } finally {
      setLoading(false);
    }
  };

  const selectLoginRole = async (role, selectionToken) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.post(API_PATHS.AUTH.SELECT_LOGIN_ROLE, {
        role,
        selectionToken,
      });

      const { token, ...userData } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to complete login";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = (options = {}) => {
    const { redirect = false, path = "/" } = options;
    sessionStorage.removeItem("pendingLogin");
    clearUser();
    if (redirect && window.location.pathname !== path) {
      window.location.replace(path);
    }
  };

  // Clear user data (used in logout and error cases)
  const clearUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setError(null);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.put(
        API_PATHS.AUTH.UPDATE_PROFILE,
        profileData,
      );

      const updatedUser = response.data;

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("Profile update error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile";

      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Upload profile image
  const uploadProfileImage = async (imageFile) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("profileImage", imageFile);

      const response = await axiosInstance.post(
        API_PATHS.IMAGE.UPLOAD_IMAGE,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Update user with new image URL
      if (response.data.imageUrl && user) {
        const updatedUser = {
          ...user,
          profileImageUrl: response.data.imageUrl,
        };

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Update state
        setUser(updatedUser);
      }

      return {
        success: true,
        imageUrl: response.data.imageUrl,
      };
    } catch (error) {
      console.error("Image upload error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload image";

      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the given roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === "superAdmin" || user?.role === "admin";
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return user?.role === "superAdmin";
  };

  // Check if user is project manager
  const isProjectManager = () => {
    return user?.role === "projectManager";
  };

  // Check if user is team member
  const isTeamMember = () => {
    return user?.role === "teamMember";
  };

  const isTester = () => {
    return user?.role === "tester";
  };

  // Get role label for consistent UI display
  const getRoleLabel = (role = user?.role) => {
    switch (role) {
      case "superAdmin":
      case "superadmin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "projectManager":
      case "projectmanager":
        return "Project Manager";
      case "teamMember":
      case "teammember":
      case "member":
        return "Team Member";
      case "tester":
        return "Tester";
      default:
        return role || "User";
    }
  };

  // Value object to be provided
  const value = {
    // State
    user,
    loading,
    error,

    // Auth actions
    login,
    selectLoginRole,
    logout,
    clearUser,
    fetchUserProfile,

    // Profile actions
    updateProfile,
    uploadProfileImage,

    // Role checkers
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isProjectManager,
    isTeamMember,
    isTester,
    getRoleLabel,

    // User data helpers
    getUserName: () => user?.name || "User",
    getUserEmail: () => user?.email || "",
    getUserRole: () => user?.role || "",
    getUserTeam: () => user?.team || null,
    getProfileImage: () => user?.profileImageUrl || null,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;
