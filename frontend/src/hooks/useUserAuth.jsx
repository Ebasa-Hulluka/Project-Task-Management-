import { useContext, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { toast } from "react-hot-toast";

export const useUserAuth = (options = {}) => {
  const {
    user,
    loading,
    clearUser,
    fetchUserProfile,
    isAdmin,
    isSuperAdmin,
    isProjectManager,
    isTeamMember,
  } = useContext(UserContext);

  const getDashboardPath = useCallback((role) => {
    switch (role) {
      case "superAdmin":
      case "admin":
        return "/admin/dashboard";
      case "projectManager":
        return "/manager/dashboard";
      case "teamMember":
        return "/member/dashboard";
      default:
        return "/login";
    }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    redirectTo = "/login",
    redirectIfAuthenticated = false,
    allowedRoles = [],
    onUnauthorized = null,
  } = options;

  // Check if user has required role
  const hasRequiredRole = useCallback(() => {
    if (!allowedRoles.length) return true;
    if (!user) return false;
    if (user.role === "superAdmin") {
      return true;
    }
    if (user.role === "admin" && !allowedRoles.includes("superAdmin")) {
      return true;
    }
    return allowedRoles.includes(user.role);
  }, [user, allowedRoles]);

  // Handle authentication check
  useEffect(() => {
    if (loading) return;

    // If user is not authenticated
    if (!user) {
      // If this route requires authentication
      if (!redirectIfAuthenticated) {
        toast.error("Please login to continue");
        navigate(redirectTo, {
          state: { from: location.pathname },
          replace: true,
        });
      }
      return;
    }

    // If user is authenticated and we're on a public-only route
    if (redirectIfAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath = getDashboardPath(user.role);
      navigate(dashboardPath, { replace: true });
      return;
    }

    // Check role-based access
    if (!hasRequiredRole()) {
      toast.error("You don't have permission to access this page");

      if (onUnauthorized) {
        onUnauthorized();
      } else {
        // Redirect to appropriate dashboard based on role
        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath, { replace: true });
      }
    }
  }, [
    user,
    loading,
    navigate,
    redirectTo,
    redirectIfAuthenticated,
    allowedRoles,
    hasRequiredRole,
    getDashboardPath,
    location.pathname,
    onUnauthorized,
  ]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (user) {
      await fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  // Logout handler
  const logout = useCallback(() => {
    clearUser();
    toast.success("Logged out successfully");
    navigate("/");
  }, [clearUser, navigate]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    hasRequiredRole: hasRequiredRole(),
    isAdmin: isAdmin?.(),
    isSuperAdmin: isSuperAdmin?.(),
    isProjectManager: isProjectManager?.(),
    isTeamMember: isTeamMember?.(),
    refreshUser,
    logout,
    getDashboardPath,
  };
};

// Higher-order component for protecting pages
export const withAuth = (WrappedComponent, options = {}) => {
  return function WithAuthComponent(props) {
    const auth = useUserAuth(options);

    if (auth.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!auth.isAuthenticated || !auth.hasRequiredRole) {
      return null;
    }

    return <WrappedComponent {...props} auth={auth} />;
  };
};

// Hook for public routes (redirects if authenticated)
export const usePublicRoute = (redirectTo = "/dashboard") => {
  return useUserAuth({ redirectIfAuthenticated: true, redirectTo });
};

// Hook for role-specific routes
export const useRoleRoute = (allowedRoles, redirectTo = "/login") => {
  return useUserAuth({ allowedRoles, redirectTo });
};

export default useUserAuth;
