import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../context/userContext";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useContext(UserContext);
  const token = localStorage.getItem("token");

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If user doesn't have required role, redirect to appropriate dashboard
  if (!allowedRoles.includes(user.role)) {
    const superAdminAllowed = user.role === "superAdmin";
    const adminAllowed =
      user.role === "admin" && !allowedRoles.includes("superAdmin");
    if (superAdminAllowed || adminAllowed) {
      return <Outlet />;
    }

    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case "superAdmin":
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "projectManager":
        return <Navigate to="/manager/dashboard" replace />;
      case "teamMember":
        return <Navigate to="/member/dashboard" replace />;
      case "tester":
        return <Navigate to="/tester/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // If authenticated and authorized, render the child routes
  return <Outlet />;
};

export default PrivateRoute;
