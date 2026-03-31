import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/userContext";

/**
 * RoleBasedRoute - For protecting specific pages/components based on user role
 * Unlike PrivateRoute which works with Outlet, this wraps individual components
 */
const RoleBasedRoute = ({
  children,
  allowedRoles,
  fallbackPath = "/login",
}) => {
  const { user, loading } = useContext(UserContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If user doesn't have required role, show unauthorized message or redirect
  if (!allowedRoles.includes(user.role)) {
    const superAdminAllowed = user.role === "superAdmin";
    const adminAllowed =
      user.role === "admin" && !allowedRoles.includes("superAdmin");
    if (superAdminAllowed || adminAllowed) {
      return children;
    }

    // You can either redirect or show an unauthorized message
    // Option 1: Redirect to dashboard
    switch (user.role) {
      case "superAdmin":
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "projectManager":
        return <Navigate to="/manager/dashboard" replace />;
      case "teamMember":
        return <Navigate to="/member/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }

    // Option 2: Show unauthorized message (uncomment if you prefer this)
    // return (
    //   <div className="flex flex-col items-center justify-center h-screen">
    //     <div className="text-center">
    //       <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
    //       <p className="text-gray-600 mb-4">
    //         You don't have permission to access this page.
    //       </p>
    //       <button
    //         onClick={() => window.history.back()}
    //         className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
    //       >
    //         Go Back
    //       </button>
    //     </div>
    //   </div>
    // );
  }

  // If authorized, render the children
  return children;
};

// Higher-order component version for easier use with components
export const withRoleProtection = (
  WrappedComponent,
  allowedRoles,
  fallbackPath = "/login",
) => {
  return function WithRoleProtection(props) {
    return (
      <RoleBasedRoute allowedRoles={allowedRoles} fallbackPath={fallbackPath}>
        <WrappedComponent {...props} />
      </RoleBasedRoute>
    );
  };
};

export default RoleBasedRoute;
