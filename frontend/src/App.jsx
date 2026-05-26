import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context
import UserProvider from "./context/userContext";
import { useUser } from "./context/userContext";
import { ThemeProvider, useTheme } from "./context/themeContext";

// Landing Page - NEW
import Landing from "./pages/Landing";

// Auth Page
import Login from "./pages/Auth/Login";
import SelectRole from "./pages/Auth/SelectRole";
import ForgotPassword from "./pages/Auth/ForgotPassword";

// Admin Pages
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminManageProjects from "./pages/Admin/ManageProjects";
import AdminManageTeams from "./pages/Admin/ManageTeams";
import AdminManageTasks from "./pages/Admin/ManageTasks";
import AdminManageUsers from "./pages/Admin/ManageUsers";
import AdminReports from "./pages/Admin/Reports";

// Project Manager Pages
import ManagerDashboard from "./pages/ProjectManager/ManagerDashboard";
import ManagerProjectList from "./pages/ProjectManager/ProjectList";
import ManagerCreateProject from "./pages/ProjectManager/CreateProject";
import ManagerEditProject from "./pages/ProjectManager/EditProject";
import ManagerProjectDetails from "./pages/ProjectManager/ProjectDetails";
import ManagerTaskManagement from "./pages/ProjectManager/TaskManagement";
import ManagerCreateTask from "./pages/ProjectManager/CreateTask";
import ManagerEditTask from "./pages/ProjectManager/EditTask";
import ManagerManageTeams from "./pages/Admin/ManageTeams";
import ManagerViewTesters from "./pages/ProjectManager/ViewTesters";

// Team Member Pages
import MemberDashboard from "./pages/TeamMember/MemberDashboard";
import MemberMyTasks from "./pages/TeamMember/MyTasks";
import MemberTaskDetails from "./pages/TeamMember/TaskDetails";
import MemberCalendar from "./pages/TeamMember/Calendar";

// Shared Pages
import Profile from "./pages/Shared/Profile";
import Notifications from "./pages/Shared/Notifications";
import Settings from "./pages/Shared/Settings";
import Chat from "./pages/Shared/Chat";

import PrivateRoute from "./routes/PrivateRoute";

const getDashboardPath = (role) => {
  switch (role) {
    case "superAdmin":
    case "admin":
      return "/admin/dashboard";
    case "projectManager":
      return "/manager/dashboard";
    case "teamMember":
      return "/member/dashboard";
    case "tester":
      return "/tester/dashboard";
    default:
      return "/";
  }
};

const NotFoundRedirect = () => {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return <Navigate to={user ? getDashboardPath(user.role) : "/"} replace />;
};

const AccountExitGuard = () => {
  const { user, clearUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lastAccountPathRef = useRef(
    sessionStorage.getItem("lastAccountPath") || "",
  );

  const isAccountPath = (path) =>
    path.startsWith("/admin") ||
    path.startsWith("/manager") ||
    path.startsWith("/member") ||
    path.startsWith("/tester") ||
    path === "/profile" ||
    path === "/notifications" ||
    path === "/settings" ||
    path === "/chat";

  useEffect(() => {
    if (user && isAccountPath(location.pathname)) {
      const accountPath = `${location.pathname}${location.search}`;
      lastAccountPathRef.current = accountPath;
      sessionStorage.setItem("lastAccountPath", accountPath);
    }
  }, [location.pathname, location.search, user]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (user && token && location.pathname === "/" && lastAccountPathRef.current) {
      setShowExitConfirm(true);
      navigate(lastAccountPathRef.current, { replace: true });
    }
  }, [location.pathname, navigate, user]);

  const stayOnAccount = () => {
    setShowExitConfirm(false);
  };

  const leaveAccount = () => {
    sessionStorage.removeItem("lastAccountPath");
    lastAccountPathRef.current = "";
    setShowExitConfirm(false);
    clearUser();
    navigate("/", { replace: true });
  };

  if (!showExitConfirm) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="app-card rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <h3 className="text-lg font-semibold app-text">Leave account?</h3>
        <p className="text-sm app-text-muted mt-2">
          Are you sure you want to leave your account and go back to the landing page?
        </p>
        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium app-text hover:bg-[var(--app-surface-hover)] transition-colors"
            onClick={stayOnAccount}
          >
            Stay
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
            onClick={leaveAccount}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

const ThemedToaster = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "",
        duration: 4000,
        style: {
          fontSize: "14px",
          background: isDark ? "#1f2937" : "#111827",
          color: "#ffffff",
          padding: "16px",
          borderRadius: "8px",
        },
        success: {
          style: {
            background: "#0f5841",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#0f5841",
          },
        },
        error: {
          style: {
            background: "#ef4444",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#ef4444",
          },
        },
        loading: {
          style: {
            background: "#194f87",
          },
        },
      }}
    />
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <AccountExitGuard />
          <Routes>
          {/* ✨ NEW: Landing Page - Now the public homepage */}
          <Route path="/" element={<Landing />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["superAdmin", "admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/projects" element={<AdminManageProjects />} />
            <Route
              path="/admin/projects/:id"
              element={<ManagerProjectDetails />}
            />
            <Route path="/admin/teams" element={<AdminManageTeams />} />
            <Route path="/admin/tasks" element={<AdminManageTasks />} />
            <Route path="/admin/users" element={<AdminManageUsers />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>

          {/* Project Manager Routes */}
          <Route
            element={
              <PrivateRoute allowedRoles={["superAdmin", "admin", "projectManager"]} />
            }
          >
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/projects" element={<ManagerProjectList />} />
            <Route
              path="/manager/projects/create"
              element={<ManagerCreateProject />}
            />
            <Route
              path="/manager/projects/edit/:id"
              element={<ManagerEditProject />}
            />
            <Route
              path="/manager/projects/:id"
              element={<ManagerProjectDetails />}
            />
            <Route path="/manager/tasks" element={<ManagerTaskManagement />} />
            <Route path="/manager/teams" element={<ManagerManageTeams />} />
            <Route path="/manager/testers" element={<ManagerViewTesters />} />
            <Route
              path="/manager/tasks/create"
              element={<ManagerCreateTask />}
            />
            <Route path="/manager/tasks/:id" element={<MemberTaskDetails />} />
            <Route
              path="/manager/tasks/edit/:id"
              element={<ManagerEditTask />}
            />
          </Route>

          {/* Team Member Routes */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={["superAdmin", "admin", "projectManager", "teamMember"]}
              />
            }
          >
            <Route path="/member/dashboard" element={<MemberDashboard />} />
            <Route path="/member/tasks" element={<MemberMyTasks />} />
            <Route path="/member/tasks/:id" element={<MemberTaskDetails />} />
            <Route path="/member/calendar" element={<MemberCalendar />} />
          </Route>

          {/* Tester Routes */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={["superAdmin", "admin", "projectManager", "tester"]}
              />
            }
          >
            <Route path="/tester/dashboard" element={<MemberDashboard />} />
            <Route path="/tester/tasks" element={<MemberMyTasks />} />
            <Route path="/tester/tasks/:id" element={<MemberTaskDetails />} />
            <Route path="/tester/calendar" element={<MemberCalendar />} />
          </Route>

          {/* Shared Routes (accessible by all authenticated users) */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={["superAdmin", "admin", "projectManager", "teamMember", "tester"]}
              />
            }
          >
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Catch all - redirect to landing page */}
          <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </Router>
        <ThemedToaster />
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
