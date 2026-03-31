import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context
import UserProvider from "./context/userContext";
import { ThemeProvider, useTheme } from "./context/themeContext";

// Landing Page - NEW
import Landing from "./pages/Landing";

// Auth Pages
import Login from "./pages/Auth/Login";

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

// Team Member Pages
import MemberDashboard from "./pages/TeamMember/MemberDashboard";
import MemberMyTasks from "./pages/TeamMember/MyTasks";
import MemberTaskDetails from "./pages/TeamMember/TaskDetails";
import MemberUpdateTaskStatus from "./pages/TeamMember/UpdateTaskStatus";
import MemberCalendar from "./pages/TeamMember/Calendar";

// Shared Pages
import Profile from "./pages/Shared/Profile";
import Notifications from "./pages/Shared/Notifications";
import Settings from "./pages/Shared/Settings";
import Chat from "./pages/Shared/Chat";

import PrivateRoute from "./routes/PrivateRoute";

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
          <Routes>
          {/* ✨ NEW: Landing Page - Now the public homepage */}
          <Route path="/" element={<Landing />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["superAdmin", "admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/projects" element={<AdminManageProjects />} />
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
            <Route
              path="/manager/tasks/create"
              element={<ManagerCreateTask />}
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
            <Route
              path="/member/tasks/:id/update-status"
              element={<MemberUpdateTaskStatus />}
            />
          </Route>

          {/* Shared Routes (accessible by all authenticated users) */}
          <Route
            element={
              <PrivateRoute
                allowedRoles={["superAdmin", "admin", "projectManager", "teamMember"]}
              />
            }
          >
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
          </Route>

          {/* Catch all - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        <ThemedToaster />
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
